package com.adc.identity;

import com.adc.domain.shared.DomainFailure;
import com.adc.infrastructure.Crypto;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
@Transactional(propagation=Propagation.MANDATORY)
public class IdentityGate {
    private final JdbcTemplate db;
    private final Clock clock;
    public IdentityGate(JdbcTemplate db,Clock clock) { this.db=db;this.clock=clock; }
    public record Identity(String subjectId,String subjectType,String sessionId,Long dentistId) { }
    public void lockSubjects(Collection<String> subjects) {
        for(String subject:new TreeSet<>(subjects))db.query("SELECT subject_id FROM adc_identity.Subject WHERE subject_id=? FOR UPDATE",(r,n)->r.getString(1),subject);
    }
    private record Session(String id,String subject,String client,Instant created,Instant activity,Instant expires,boolean revoked) { }
    private static Instant instant(java.sql.ResultSet r,String name) throws java.sql.SQLException {
        return r.getObject(name,LocalDateTime.class).toInstant(ZoneOffset.UTC);
    }
    public Identity authenticate(String token,String expectedClient) {
        if(token==null || !token.matches("[A-Za-z0-9_-]{43}") || !Set.of("WEB","WECHAT").contains(expectedClient))
            throw new DomainFailure(401,"AUTH_REQUIRED");
        var hints=db.query("SELECT subject_id FROM adc_identity.Session WHERE token_hash=?",(r,n)->r.getString(1),Crypto.sha256(token));
        if(hints.isEmpty()) throw new DomainFailure(401,"AUTH_REQUIRED");
        String subject=hints.getFirst();
        // All identity mutations lock stable Subject rows first, then dependent records.
        var subjects=db.query("SELECT subject_type,is_enabled FROM adc_identity.Subject WHERE subject_id=? FOR UPDATE",(r,n)->Map.entry(r.getString(1),r.getBoolean(2)),subject);
        if(subjects.isEmpty() || !subjects.getFirst().getValue()) throw new DomainFailure(401,"ACCOUNT_DISABLED");
        var sessions=db.query("SELECT * FROM adc_identity.Session WHERE token_hash=? AND subject_id=? FOR UPDATE",(r,n)->new Session(r.getString("session_id"),r.getString("subject_id"),r.getString("client_type"),instant(r,"created_at"),instant(r,"last_activity_at"),instant(r,"absolute_expires_at"),r.getObject("revoked_at")!=null),Crypto.sha256(token),subject);
        if(sessions.isEmpty()) throw new DomainFailure(401,"AUTH_REQUIRED");
        var session=sessions.getFirst(); Instant now=clock.instant();
        if(session.revoked || !session.client.equals(expectedClient)) throw new DomainFailure(401,"AUTH_REQUIRED");
        if(!now.isBefore(session.activity.plusSeconds(1800)) || !now.isBefore(session.expires)
                || !now.isBefore(session.created.plusSeconds(28800))) throw new DomainFailure(401,"SESSION_EXPIRED");
        String type=subjects.getFirst().getKey(); Long dentist=null;
        if(type.equals("SYSTEM") || (type.equals("STAFF") && !expectedClient.equals("WEB"))
                || (type.equals("PATIENT") && !expectedClient.equals("WECHAT"))) throw new DomainFailure(401,"AUTH_REQUIRED");
        if(type.equals("STAFF")) {
            var accounts=db.query("SELECT dentist_id,password_hash,requires_reset FROM adc_identity.StaffAccount WHERE subject_id=?",(r,n)->new Object[]{r.getObject(1,Long.class),r.getString(2),r.getBoolean(3)},subject);
            if(accounts.isEmpty() || accounts.getFirst()[1]==null || (Boolean)accounts.getFirst()[2]) throw new DomainFailure(401,"AUTH_REQUIRED");
            dentist=(Long)accounts.getFirst()[0];
        }
        db.update("UPDATE adc_identity.Session SET last_activity_at=? WHERE session_id=?",LocalDateTime.ofInstant(now,ZoneOffset.UTC),session.id);
        return new Identity(subject,type,session.id,dentist);
    }
    public void requireStaff(Identity identity,String role,String capability,long clinic) {
        if(!identity.subjectType.equals("STAFF")) throw new DomainFailure(403,"ACCESS_DENIED");
        var now=LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC);
        var count=db.queryForObject("SELECT COUNT(*) FROM adc_identity.AccessGrant g JOIN adc_identity.GrantClinicScope s ON s.grant_id=g.grant_id JOIN adc_identity.GrantCapability c ON c.grant_id=g.grant_id JOIN adc_business.Clinic clinic ON clinic.clinic_id=s.clinic_id WHERE g.subject_id=? AND g.role_code=? AND c.capability_code=? AND s.clinic_id=? AND g.valid_from<=? AND (g.valid_until IS NULL OR g.valid_until>?) AND g.revoked_at IS NULL",Integer.class,identity.subjectId,role,capability,clinic,now,now);
        if(count==null || count==0) throw new DomainFailure(403,"ACCESS_DENIED");
    }
    public void requirePatient(Identity identity,long patient) {
        if(!identity.subjectType.equals("PATIENT") || db.queryForObject("SELECT COUNT(*) FROM adc_identity.CurrentPatientBinding b JOIN adc_business.Patient p ON p.patient_id=b.patient_id WHERE b.subject_id=? AND b.patient_id=?",Integer.class,identity.subjectId,patient)!=1)
            throw new DomainFailure(403,"PATIENT_BINDING_REQUIRED");
    }
    // A read-only capability probe may be caught to try another approved role. Do not
    // poison the caller's transaction; uncaught denials still roll back its service boundary.
    @Transactional(propagation=Propagation.MANDATORY,noRollbackFor=DomainFailure.class)
    public List<Long> staffClinics(Identity identity,String role,String capability) {
        if(!identity.subjectType.equals("STAFF")) throw new DomainFailure(403,"ACCESS_DENIED");
        var now=LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC);
        var clinics=db.query("SELECT DISTINCT s.clinic_id FROM adc_identity.AccessGrant g JOIN adc_identity.GrantClinicScope s ON s.grant_id=g.grant_id JOIN adc_identity.GrantCapability c ON c.grant_id=g.grant_id JOIN adc_business.Clinic clinic ON clinic.clinic_id=s.clinic_id WHERE g.subject_id=? AND g.role_code=? AND c.capability_code=? AND g.valid_from<=? AND (g.valid_until IS NULL OR g.valid_until>?) AND g.revoked_at IS NULL ORDER BY s.clinic_id",(r,n)->r.getLong(1),identity.subjectId,role,capability,now,now);
        if(clinics.isEmpty()) throw new DomainFailure(403,"ACCESS_DENIED");
        return List.copyOf(clinics);
    }
}
