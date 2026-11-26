package com.adc.infrastructure;

import com.adc.domain.shared.DomainFailure;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class StaffAccountStore {
    private final JdbcTemplate db;private final Clock clock;
    public StaffAccountStore(JdbcTemplate db,Clock clock){this.db=db;this.clock=clock;}
    private LocalDateTime now(){return LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC);}
    public Map<String,Object> require(String subject) {
        var rows=db.query("SELECT a.subject_id,a.username,s.is_enabled FROM adc_identity.StaffAccount a JOIN adc_identity.Subject s ON s.subject_id=a.subject_id WHERE a.subject_id=? AND s.subject_type='STAFF'",(r,n)->Map.<String,Object>of("subject_id",r.getString(1),"username",r.getString(2),"enabled",r.getBoolean(3)),subject);
        if(rows.isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");return rows.getFirst();
    }
    public String create(String staffReference,String username,Long dentist,String verification) {
        if(dentist!=null && db.queryForObject("SELECT COUNT(*) FROM adc_business.Dentist WHERE dentist_id=?",Integer.class,dentist)!=1)throw new DomainFailure(422,"FIELD_REQUIRED");
        String subject=UUID.randomUUID().toString();
        db.update("INSERT INTO adc_identity.Subject VALUES (?,'STAFF',true,?,NULL)",subject,now());
        db.update("INSERT INTO adc_identity.StaffAccount VALUES (?,?,?,?,NULL,true,NULL,?)",subject,username,staffReference,dentist,verification);return subject;
    }
    public void enabled(String subject,boolean enabled) {
        db.update("UPDATE adc_identity.Subject SET is_enabled=?,disabled_at=? WHERE subject_id=?",enabled,enabled?null:now(),subject);revokeSessions(subject,enabled?"ACCOUNT_ACTIVATED":"ACCOUNT_DISABLED");
    }
    public void credential(String subject,String hash,String verification) {
        db.update("UPDATE adc_identity.StaffAccount SET password_hash=?,requires_reset=false,credential_changed_at=?,verification_reference=? WHERE subject_id=?",hash,now(),verification,subject);revokeSessions(subject,"CREDENTIAL_RECOVERY");
    }
    private void revokeSessions(String subject,String reason){db.update("UPDATE adc_identity.Session SET revoked_at=?,revoked_reason=? WHERE subject_id=? AND revoked_at IS NULL",now(),reason,subject);}
    public Map<String,Object> list(String cursor,int limit) {
        if(limit<1 || limit>100)throw new DomainFailure(400,"INVALID_REQUEST");String after="";
        if(cursor!=null)try {after=new String(Base64.getUrlDecoder().decode(cursor),java.nio.charset.StandardCharsets.UTF_8);}catch(IllegalArgumentException e){throw new DomainFailure(400,"INVALID_REQUEST");}
        var items=db.query("SELECT a.subject_id,a.username,s.is_enabled FROM adc_identity.StaffAccount a JOIN adc_identity.Subject s ON s.subject_id=a.subject_id WHERE s.subject_type='STAFF' AND a.subject_id>? ORDER BY a.subject_id LIMIT ?",(r,n)->Map.<String,Object>of("subject_id",r.getString(1),"username",r.getString(2),"enabled",r.getBoolean(3)),after,limit+1);
        String next=null;if(items.size()>limit){items=new ArrayList<>(items.subList(0,limit));next=Base64.getUrlEncoder().withoutPadding().encodeToString(((String)items.getLast().get("subject_id")).getBytes(java.nio.charset.StandardCharsets.UTF_8));}
        var page=new LinkedHashMap<String,Object>();page.put("items",items);page.put("next_cursor",next);return page;
    }
}
