package com.adc.identity;

import com.adc.domain.authentication.AuthenticationRules;
import com.adc.domain.authentication.AuthenticationRules.Throttle;
import com.adc.domain.shared.DomainFailure;
import com.adc.infrastructure.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

/** Identity component persistence; authentication rejection returns an outcome so throttle facts commit. */
@Service
@Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
public class AuthenticationTransactions {
    private final JdbcTemplate db;private final Clock clock;private final AuthSecrets secrets;private final PasswordHasher passwords;
    private final TransactionLocks locks;private final AuditWriter audit;private final IdentityGate gate;private final String dummy;
    public AuthenticationTransactions(JdbcTemplate db,Clock clock,AuthSecrets secrets,PasswordHasher passwords,TransactionLocks locks,AuditWriter audit,IdentityGate gate) {
        this.db=db;this.clock=clock;this.secrets=secrets;this.passwords=passwords;this.locks=locks;this.audit=audit;this.gate=gate;dummy=passwords.encode(Crypto.token());
    }
    public record IssuedSession(String subjectId,String subjectType,String token,String csrf,Instant expiresAt,Map<String,Object> identity) {
        public IssuedSession {identity=Collections.unmodifiableMap(new LinkedHashMap<>(identity));}
        @Override public String toString(){return "IssuedSession[credentials redacted]";}
    }
    public record Outcome(IssuedSession session,int status,String code) { }
    private record Attempt(Throttle throttle,Instant lastFailure) { }
    private byte[] staffKey(String username){return secrets.derive("staff-authentication",username);}
    private byte[] sourceKey(String source){return secrets.derive("wechat-anonymous-authentication",source);}
    private static LocalDateTime utc(Instant time){return time==null?null:LocalDateTime.ofInstant(time,ZoneOffset.UTC);}
    private static Instant instant(java.sql.ResultSet r,String column)throws java.sql.SQLException {var value=r.getObject(column,LocalDateTime.class);return value==null?null:value.toInstant(ZoneOffset.UTC);}
    private static String lockName(byte[] key){return TransactionLocks.name("authentication",HexFormat.of().formatHex(key));}
    private Attempt attempt(byte[] key) {
        var rows=db.query("SELECT consecutive_failures,blocked_until,last_failure_at FROM adc_identity.LoginThrottle WHERE throttle_key=?",(r,n)->new Attempt(new Throttle(r.getInt(1),instant(r,"blocked_until")),instant(r,"last_failure_at")),key);
        return rows.isEmpty()?new Attempt(new Throttle(0,null),null):rows.getFirst();
    }
    private void store(byte[] key,String subject,Throttle state,Instant failure) {
        db.update("INSERT INTO adc_identity.LoginThrottle (throttle_key,subject_id,consecutive_failures,blocked_until,last_failure_at,updated_at) VALUES (?,?,?,?,?,?) AS incoming ON DUPLICATE KEY UPDATE subject_id=incoming.subject_id,consecutive_failures=incoming.consecutive_failures,blocked_until=incoming.blocked_until,last_failure_at=incoming.last_failure_at,updated_at=incoming.updated_at",key,subject,state.failures(),utc(state.blockedUntil()),utc(failure),utc(clock.instant()));
    }
    private Outcome rejected(byte[] key,String subject,Attempt state,String operation,String request) {
        boolean blocked=AuthenticationRules.blocked(state.throttle,clock.instant());
        var next=blocked?state.throttle:AuthenticationRules.failed(state.throttle,clock.instant());
        if(!blocked)store(key,subject,next,clock.instant());
        audit.authenticationFailure(operation,subject,request);
        return new Outcome(null,AuthenticationRules.blocked(next,clock.instant())?429:401,AuthenticationRules.blocked(next,clock.instant())?"AUTH_ATTEMPT_LIMITED":"AUTH_REQUIRED");
    }
    public Outcome staff(String username,String password,String oldToken,String request) {
        byte[] key=staffKey(username);locks.acquire(List.of(lockName(key)));var state=attempt(key);
        if(AuthenticationRules.blocked(state.throttle,clock.instant()))return rejected(key,null,state,"createStaffSession",request);
        var subjects=db.query("SELECT subject_id FROM adc_identity.StaffAccount WHERE username=?",(r,n)->r.getString(1),username);
        String subject=subjects.isEmpty()?null:subjects.getFirst();
        var stable=new TreeSet<String>();if(subject!=null)stable.add(subject);
        if(oldToken!=null)stable.addAll(db.query("SELECT subject_id FROM adc_identity.Session WHERE token_hash=?",(r,n)->r.getString(1),Crypto.sha256(oldToken)));
        for(String id:stable)db.query("SELECT subject_id FROM adc_identity.Subject WHERE subject_id=? FOR UPDATE",(r,n)->r.getString(1),id);
        var accounts=db.query("SELECT a.password_hash,a.requires_reset,s.is_enabled,s.subject_type FROM adc_identity.StaffAccount a JOIN adc_identity.Subject s ON s.subject_id=a.subject_id WHERE a.subject_id=? AND a.username=?",(r,n)->new Object[]{r.getString(1),r.getBoolean(2),r.getBoolean(3),r.getString(4)},subject,username);
        var account=accounts.isEmpty()?null:accounts.getFirst();String hash=account==null?null:(String)account[0];
        boolean verified=passwords.matches(password,hash==null?dummy:hash);
        if(account==null || hash==null || !verified || (Boolean)account[1] || !(Boolean)account[2] || !account[3].equals("STAFF"))return rejected(key,subject,state,"createStaffSession",request);
        store(key,subject,new Throttle(0,null),state.lastFailure);
        if(oldToken!=null)db.update("UPDATE adc_identity.Session SET revoked_at=?,revoked_reason='LOGIN_ROTATION' WHERE token_hash=? AND revoked_at IS NULL",utc(clock.instant()),Crypto.sha256(oldToken));
        return new Outcome(issue(subject,"STAFF","WEB",request),200,null);
    }
    public void checkAnonymousSource(String source) {
        if(AuthenticationRules.blocked(attempt(sourceKey(source)).throttle,clock.instant()))throw new DomainFailure(429,"AUTH_ATTEMPT_LIMITED");
    }
    public Outcome anonymousFailure(String source,String request) {
        byte[] key=sourceKey(source);locks.acquire(List.of(lockName(key)));return rejected(key,null,attempt(key),"createWechatSession",request);
    }
    public Outcome wechat(WechatCodeExchange.TrustedIdentity external,String source,String request) {
        byte[] app=external.appId().getBytes(StandardCharsets.UTF_8),open=external.openId().getBytes(StandardCharsets.UTF_8);
        if(app.length==0 || app.length>64 || open.length==0 || open.length>128)throw new DomainFailure(503,"IDENTITY_UNAVAILABLE");
        String externalKey=Base64.getEncoder().encodeToString(app)+"/"+Base64.getEncoder().encodeToString(open);
        byte[] key=secrets.derive("wechat-account-authentication",externalKey),anonymous=sourceKey(source);
        locks.acquire(List.of(lockName(key),lockName(anonymous),TransactionLocks.name("external-identity",externalKey)));
        var sourceState=attempt(anonymous);if(AuthenticationRules.blocked(sourceState.throttle,clock.instant()))return rejected(anonymous,null,sourceState,"createWechatSession",request);
        var state=attempt(key);if(AuthenticationRules.blocked(state.throttle,clock.instant()))return rejected(key,null,state,"createWechatSession",request);
        var subjects=db.query("SELECT subject_id FROM adc_identity.ExternalIdentity WHERE provider='WECHAT_MINIPROGRAM' AND appid=? AND openid=?",(r,n)->r.getString(1),app,open);
        String subject;
        if(subjects.isEmpty()) {
            subject=UUID.randomUUID().toString();
            db.update("INSERT INTO adc_identity.Subject VALUES (?,'PATIENT',true,?,NULL)",subject,utc(clock.instant()));
            db.update("INSERT INTO adc_identity.ExternalIdentity VALUES (?,?,'WECHAT_MINIPROGRAM',?,?,?)",Crypto.id(),subject,app,open,utc(clock.instant()));
        } else subject=subjects.getFirst();
        var enabled=db.query("SELECT is_enabled,subject_type FROM adc_identity.Subject WHERE subject_id=? FOR UPDATE",(r,n)->r.getBoolean(1)&&r.getString(2).equals("PATIENT"),subject);
        if(enabled.isEmpty() || !enabled.getFirst())return rejected(key,subject,state,"createWechatSession",request);
        store(key,subject,new Throttle(0,null),state.lastFailure);store(anonymous,null,new Throttle(0,null),sourceState.lastFailure);
        return new Outcome(issue(subject,"PATIENT","WECHAT",request),200,null);
    }
    private IssuedSession issue(String subject,String type,String client,String request) {
        String id=UUID.randomUUID().toString(),token=Crypto.token(),csrf=client.equals("WEB")?Crypto.token():null;Instant now=clock.instant(),expires=now.plusSeconds(28800);
        db.update("INSERT INTO adc_identity.Session VALUES (?,?,?,?,?,?,?,?,NULL,NULL)",id,subject,Crypto.sha256(token),client,csrf==null?null:Crypto.sha256(csrf),utc(now),utc(now),utc(expires));
        var identity=new IdentityGate.Identity(subject,type,id,null);
        audit.success(identity,client.equals("WEB")?"createStaffSession":"createWechatSession","Session",id,List.of(),request);
        return new IssuedSession(subject,type,token,csrf,expires,projection(identity));
    }
    public Map<String,Object> me(String token,String client) {return projection(gate.authenticate(token,client));}
    public Map<String,Object> projection(IdentityGate.Identity identity) {
        var roles=new TreeSet<String>();var capabilities=new TreeSet<String>();var clinics=new TreeSet<Long>();var now=utc(clock.instant());
        if(identity.subjectType().equals("STAFF")) {
            var grants=db.query("SELECT g.grant_id,g.role_code,s.clinic_id FROM adc_identity.AccessGrant g JOIN adc_identity.GrantClinicScope s ON s.grant_id=g.grant_id JOIN adc_business.Clinic c ON c.clinic_id=s.clinic_id WHERE g.subject_id=? AND g.valid_from<=? AND (g.valid_until IS NULL OR g.valid_until>?) AND g.revoked_at IS NULL",(r,n)->new Object[]{r.getString(1),r.getString(2),r.getLong(3)},identity.subjectId(),now,now);
            for(var grant:grants) {roles.add((String)grant[1]);clinics.add((Long)grant[2]);capabilities.addAll(db.query("SELECT capability_code FROM adc_identity.GrantCapability WHERE grant_id=?",(r,n)->r.getString(1),grant[0]));}
        }
        Object binding=null;
        if(identity.subjectType().equals("PATIENT")) {
            var bindings=db.query("SELECT b.patient_id,b.verified_at,b.verification_reference FROM adc_identity.CurrentPatientBinding b JOIN adc_business.Patient p ON p.patient_id=b.patient_id WHERE b.subject_id=?",(r,n)->Map.of("subject_id",identity.subjectId(),"patient_id",Long.toString(r.getLong(1)),"verified_at",instant(r,"verified_at").toString(),"verification_reference",r.getString(3)),identity.subjectId());
            if(!bindings.isEmpty())binding=bindings.getFirst();
        }
        var out=new LinkedHashMap<String,Object>();out.put("subject_id",identity.subjectId());out.put("subject_type",identity.subjectType());out.put("roles",List.copyOf(roles));out.put("capabilities",List.copyOf(capabilities));out.put("clinic_scope",clinics.stream().map(Object::toString).toList());out.put("binding",binding);return out;
    }
    public void revoke(IdentityGate.Identity identity) {db.update("UPDATE adc_identity.Session SET revoked_at=?,revoked_reason='LOGOUT' WHERE session_id=?",utc(clock.instant()),identity.sessionId());}
    public String rotateCsrf(String token) {
        var identity=gate.authenticate(token,"WEB");String csrf=Crypto.token();
        db.update("UPDATE adc_identity.Session SET csrf_secret_hash=? WHERE session_id=?",Crypto.sha256(csrf),identity.sessionId());return csrf;
    }
    public void providerFailure(String request) {audit.identityProviderFailure(request);}
}
