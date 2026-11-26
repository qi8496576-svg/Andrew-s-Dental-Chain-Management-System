package com.adc.identity.bootstrap;

import com.adc.domain.shared.*;
import com.adc.infrastructure.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.sql.*;
import java.time.*;
import java.util.*;
import tools.jackson.databind.json.JsonMapper;

/** Explicit owner-verified control-plane operation; no component scanning, HTTP or startup hook. */
public final class NewClinicManagement {
    private static final String ACTION="initializeNewClinicManagement";
    private static final Set<String> CAPABILITIES=Set.of("authorization.manage","resource.read","resource.write");
    private static final JsonMapper JSON=JsonMapper.builder().build();
    private NewClinicManagement(){}
    public record Input(String clinic_id,String target_subject_id,String target_staff_reference,String owner_reference,String verification_reference,String operator_reference,String valid_until,String idempotency_key){}
    private static void required(String value,int limit){if(value==null || value.isBlank() || value.length()>limit)throw new IllegalArgumentException("Explicit verified initialization metadata required");}
    private static void execute(Connection c,String sql,Object...values)throws SQLException{try(var s=c.prepareStatement(sql)){for(int i=0;i<values.length;i++)s.setObject(i+1,values[i]);s.executeUpdate();}}
    private static List<String> strings(Connection c,String sql,Object...values)throws SQLException{try(var s=c.prepareStatement(sql)){for(int i=0;i<values.length;i++)s.setObject(i+1,values[i]);try(var r=s.executeQuery()){var rows=new ArrayList<String>();while(r.next())rows.add(r.getString(1));return rows;}}}
    private static LocalDateTime utc(Instant time){return LocalDateTime.ofInstant(time,ZoneOffset.UTC);}
    private static DomainFailure denied(){return new DomainFailure(403,"ACCESS_DENIED");}
    private static DomainFailure conflict(){return new DomainFailure(409,"INITIALIZATION_ALREADY_OCCURRED");}
    private static void audit(Connection c,String system,Input input,String grant,String request,Instant now,String result)throws SQLException{
        execute(c,"INSERT INTO adc_audit.AuditEvent (audit_id,subject_id,actor_kind,action,object_kind,object_id,clinic_scope,occurred_at,request_id,result,reason,verification_reference,change_summary) VALUES (?,?,'SYSTEM',?,'AccessGrant',?,?,?,?,?,?,?,?)",Crypto.id(),system,ACTION,grant,JSON.writeValueAsString(List.of(input.clinic_id())),utc(now),request,result,"SUCCESS".equals(result)?"OWNER_VERIFIED_FIRST_CLINIC_INITIALIZATION":"INITIALIZATION_REJECTED_OR_ROLLED_BACK",input.verification_reference(),CanonicalJson.normalize(JSON.writeValueAsString(input)));
    }
    public static String initialize(Connection c,Input input,Clock clock)throws Exception{
        Objects.requireNonNull(input);Objects.requireNonNull(clock);
        required(input.clinic_id(),20);long clinic=BusinessValues.id(input.clinic_id());required(input.target_subject_id(),36);required(input.target_staff_reference(),100);required(input.owner_reference(),200);required(input.verification_reference(),200);required(input.operator_reference(),200);required(input.idempotency_key(),64);
        Instant now=clock.instant(),until=BusinessTime.timestamp(input.valid_until());if(!until.isAfter(now))throw new IllegalArgumentException("An explicit future authorization end is required");
        if(!c.getAutoCommit())throw new IllegalStateException("Initialization requires an owned connection outside a transaction");
        String lock=TransactionLocks.name("operator-new-clinic",Long.toString(clinic)),system=null,request=UUID.randomUUID().toString();boolean locked=false;int previousIsolation=c.getTransactionIsolation();
        try{
            try(var s=c.prepareStatement("SELECT GET_LOCK(?,10)")){s.setString(1,lock);try(var r=s.executeQuery()){locked=r.next() && r.getInt(1)==1 && !r.wasNull();}}
            if(!locked)throw new DomainFailure(409,"INITIALIZATION_BUSY");
            c.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);c.setAutoCommit(false);
            var systems=strings(c,"SELECT DISTINCT s.subject_id FROM adc_identity.Subject s JOIN adc_audit.AuditEvent a ON a.subject_id=s.subject_id WHERE s.subject_type='SYSTEM' AND s.is_enabled=true AND a.action='bootstrapHeadquarters' AND a.result='SUCCESS'");
            if(systems.size()!=1)throw denied();system=systems.getFirst();
            // Same Subject ordering as normal staff/grant mutations, before Clinic or dependent rows.
            for(String subject:new TreeSet<>(Set.of(system,input.target_subject_id())))strings(c,"SELECT subject_id FROM adc_identity.Subject WHERE subject_id=? FOR UPDATE",subject);
            if(strings(c,"SELECT s.subject_id FROM adc_identity.Subject s JOIN adc_identity.StaffAccount a ON a.subject_id=s.subject_id WHERE s.subject_id=? AND s.subject_type='STAFF' AND s.is_enabled=true AND a.staff_reference=? AND a.password_hash IS NOT NULL AND a.requires_reset=false",input.target_subject_id(),input.target_staff_reference()).isEmpty())throw denied();
            if(strings(c,"SELECT g.grant_id FROM adc_identity.AccessGrant g JOIN adc_identity.GrantCapability cap ON cap.grant_id=g.grant_id JOIN adc_identity.GrantClinicScope scope ON scope.grant_id=g.grant_id WHERE g.subject_id=? AND g.role_code='HEADQUARTERS' AND cap.capability_code='authorization.manage' AND g.revoked_at IS NULL AND g.valid_from<=? AND (g.valid_until IS NULL OR g.valid_until>?)",input.target_subject_id(),utc(now),utc(now)).isEmpty())throw denied();
            if(strings(c,"SELECT clinic_id FROM adc_business.Clinic WHERE clinic_id=? AND is_active=true FOR UPDATE",clinic).isEmpty())throw denied();
            if(strings(c,"SELECT audit_id FROM adc_audit.AuditEvent WHERE action='createClinic' AND object_kind='Clinic' AND object_id=? AND result='SUCCESS'",Long.toString(clinic)).isEmpty())throw conflict();
            byte[] hash=Crypto.sha256(CanonicalJson.normalize(JSON.writeValueAsString(input)));
            try(var s=c.prepareStatement("SELECT content_hash,response_summary FROM adc_identity.RequestReceipt WHERE subject_id=? AND operation_id=? AND request_key=?")){
                s.setString(1,system);s.setString(2,ACTION);s.setString(3,input.idempotency_key());try(var r=s.executeQuery()){if(r.next()){
                    if(!MessageDigest.isEqual(hash,r.getBytes(1)))throw new DomainFailure(409,"IDEMPOTENCY_CONTENT_CONFLICT");
                    String grant=JSON.readTree(r.getString(2)).path("grant_id").asText();
                    if(strings(c,"SELECT grant_id FROM adc_identity.AccessGrant WHERE grant_id=? AND subject_id=? AND granted_by=? AND revoked_at IS NULL AND valid_from<=? AND valid_until>?",grant,input.target_subject_id(),system,utc(now),utc(now)).isEmpty())throw denied();
                    if(!strings(c,"SELECT clinic_id FROM adc_identity.GrantClinicScope WHERE grant_id=?",grant).equals(List.of(Long.toString(clinic))) || !new HashSet<>(strings(c,"SELECT capability_code FROM adc_identity.GrantCapability WHERE grant_id=?",grant)).equals(CAPABILITIES))throw denied();
                    c.commit();return grant;
                }}
            }
            // Any historical scope (including expired/revoked grants) permanently closes this entry.
            if(!strings(c,"SELECT grant_id FROM adc_identity.GrantClinicScope WHERE clinic_id=?",clinic).isEmpty() || !strings(c,"SELECT audit_id FROM adc_audit.AuditEvent WHERE action=? AND result='SUCCESS' AND JSON_CONTAINS(clinic_scope,JSON_QUOTE(?))",ACTION,Long.toString(clinic)).isEmpty())throw conflict();
            String grant=UUID.randomUUID().toString();execute(c,"INSERT INTO adc_identity.AccessGrant VALUES (?,?,'HEADQUARTERS',?,?,?,NULL,NULL,?,?)",grant,input.target_subject_id(),system,utc(now),utc(until),"OWNER_VERIFIED_FIRST_CLINIC_INITIALIZATION",utc(now));
            execute(c,"INSERT INTO adc_identity.GrantClinicScope VALUES (?,?)",grant,clinic);for(String capability:new TreeSet<>(CAPABILITIES))execute(c,"INSERT INTO adc_identity.GrantCapability VALUES (?,?)",grant,capability);
            audit(c,system,input,grant,request,now,"SUCCESS");
            execute(c,"INSERT INTO adc_identity.RequestReceipt VALUES (?,?,?,?,?,?,?,?,?,?)",system,ACTION,input.idempotency_key(),hash,request,JSON.writeValueAsString(List.of("AccessGrant:"+grant)),JSON.writeValueAsString(Map.of("grant_id",grant)),200,utc(now),utc(now));
            c.commit();return grant;
        }catch(Exception error){
            if(!c.getAutoCommit()){c.rollback();if(system!=null){try{audit(c,system,input,null,request,now,"FAILURE");c.commit();}catch(Exception auditError){c.rollback();error.addSuppressed(new IllegalStateException("Failure audit unavailable"));}}}throw error;
        }finally{
            if(!c.isClosed()){
                if(!c.getAutoCommit())c.setAutoCommit(true);c.setTransactionIsolation(previousIsolation);
                if(locked)try(var s=c.prepareStatement("SELECT RELEASE_LOCK(?)")){s.setString(1,lock);try(var r=s.executeQuery()){if(!r.next() || r.getInt(1)!=1 || r.wasNull()){c.close();throw new SQLException("Initialization outcome requires original-key verification; lock cleanup failed");}}}
            }
        }
    }
    private static String env(String name){String value=System.getenv(name);required(value,4096);return value;}
    public static void main(String[] args)throws Exception{
        if(args.length!=0)throw new IllegalArgumentException("Only controlled configuration files are accepted");
        var node=JSON.readTree(Files.readString(Path.of(env("ADC_NEW_CLINIC_INPUT_FILE"))));
        var fields=new HashSet<>(node.propertyNames());
        if(!fields.equals(Set.of("clinic_id","target_subject_id","target_staff_reference","owner_reference","verification_reference","operator_reference","valid_until","idempotency_key")))throw new IllegalArgumentException("Exact owner-verified initialization fields required");
        var input=JSON.treeToValue(node,Input.class);String password=Files.readString(Path.of(env("ADC_BOOTSTRAP_DB_PASSWORD_FILE"))).strip();
        try(var c=DriverManager.getConnection(env("ADC_DB_URL"),env("ADC_DB_USERNAME"),password)){
            execute(c,"SET time_zone='+00:00'");String grant=initialize(c,input,Clock.systemUTC());System.out.println("New clinic first management initialized: "+grant);
        }catch(Exception failure){System.err.println("New clinic initialization rejected or outcome unknown; preserve original input/key for verification. No credentials logged.");System.exit(1);}
    }
}
