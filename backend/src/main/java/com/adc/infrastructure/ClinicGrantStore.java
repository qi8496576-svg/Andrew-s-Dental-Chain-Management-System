package com.adc.infrastructure;

import com.adc.domain.shared.DomainFailure;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ClinicGrantStore {
    private final JdbcTemplate db;private final Clock clock;
    public ClinicGrantStore(JdbcTemplate db,Clock clock){this.db=db;this.clock=clock;}
    public record Authority(long clinic,Instant from,Instant until){ }
    private static Instant instant(java.sql.ResultSet r,String name)throws java.sql.SQLException{var value=r.getObject(name,LocalDateTime.class);return value==null?null:value.toInstant(ZoneOffset.UTC);}
    private static LocalDateTime utc(Instant value){return value==null?null:LocalDateTime.ofInstant(value,ZoneOffset.UTC);}
    public List<Authority> authority(String subject) {
        var now=utc(clock.instant());
        return db.query("SELECT s.clinic_id,g.valid_from,g.valid_until FROM adc_identity.AccessGrant g JOIN adc_identity.GrantClinicScope s ON s.grant_id=g.grant_id JOIN adc_identity.GrantCapability c ON c.grant_id=g.grant_id JOIN adc_business.Clinic clinic ON clinic.clinic_id=s.clinic_id WHERE g.subject_id=? AND g.role_code='HEADQUARTERS' AND c.capability_code='authorization.manage' AND g.valid_from<=? AND (g.valid_until IS NULL OR g.valid_until>?) AND g.revoked_at IS NULL",(r,n)->new Authority(r.getLong(1),instant(r,"valid_from"),instant(r,"valid_until")),subject,now,now);
    }
    public void target(String subject,String role) {
        var rows=db.query("SELECT a.dentist_id FROM adc_identity.StaffAccount a JOIN adc_identity.Subject s ON s.subject_id=a.subject_id WHERE a.subject_id=? AND s.subject_type='STAFF'",(r,n)->r.getObject(1,Long.class),subject);
        if(rows.isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");
        if(role.equals("DENTIST") && (rows.getFirst()==null || db.queryForObject("SELECT COUNT(*) FROM adc_business.Dentist WHERE dentist_id=?",Integer.class,rows.getFirst())!=1))throw new DomainFailure(422,"ASSIGNMENT_INVALID");
    }
    public String owner(String grant) {var owners=db.query("SELECT subject_id FROM adc_identity.AccessGrant WHERE grant_id=?",(r,n)->r.getString(1),grant);return owners.isEmpty()?null:owners.getFirst();}
    public List<Long> clinics(String grant){return db.query("SELECT clinic_id FROM adc_identity.GrantClinicScope WHERE grant_id=? ORDER BY clinic_id",(r,n)->r.getLong(1),grant);}
    public String create(String subject,String role,Set<Long> clinics,Set<String> capabilities,Instant from,Instant until,String actor,String request) {
        String grant=UUID.randomUUID().toString();
        db.update("INSERT INTO adc_identity.AccessGrant VALUES (?,?,?,?,?,?,NULL,NULL,?,?)",grant,subject,role,actor,utc(from),utc(until),"AUTHORIZED_GRANT:"+request,utc(clock.instant()));
        for(long clinic:new TreeSet<>(clinics))db.update("INSERT INTO adc_identity.GrantClinicScope VALUES (?,?)",grant,clinic);
        for(String capability:new TreeSet<>(capabilities))db.update("INSERT INTO adc_identity.GrantCapability VALUES (?,?)",grant,capability);
        return grant;
    }
    public Map<String,Object> view(String grant) {
        var rows=db.query("SELECT * FROM adc_identity.AccessGrant WHERE grant_id=?",(r,n)->{
            var view=new LinkedHashMap<String,Object>();view.put("grant_id",r.getString("grant_id"));view.put("subject_id",r.getString("subject_id"));view.put("role",r.getString("role_code"));view.put("valid_from",instant(r,"valid_from").toString());var until=instant(r,"valid_until");view.put("valid_until",until==null?null:until.toString());view.put("revoked",r.getObject("revoked_at")!=null);return view;
        },grant);
        if(rows.isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");var view=rows.getFirst();view.put("clinic_ids",clinics(grant).stream().map(Object::toString).toList());view.put("capabilities",db.query("SELECT capability_code FROM adc_identity.GrantCapability WHERE grant_id=? ORDER BY capability_code",(r,n)->r.getString(1),grant));return view;
    }
    public void revoke(String grant,String actor){db.update("UPDATE adc_identity.AccessGrant SET revoked_at=?,revoked_by=? WHERE grant_id=? AND revoked_at IS NULL",utc(clock.instant()),actor,grant);}
    public Map<String,Object> list(Set<Long> authorized,String subject,String cursor,int limit) {
        if(limit<1 || limit>100)throw new DomainFailure(400,"INVALID_REQUEST");String after="";
        if(cursor!=null)try{after=new String(Base64.getUrlDecoder().decode(cursor),java.nio.charset.StandardCharsets.UTF_8);}catch(IllegalArgumentException e){throw new DomainFailure(400,"INVALID_REQUEST");}
        var sql=new StringBuilder("SELECT g.grant_id FROM adc_identity.AccessGrant g WHERE g.grant_id>? AND EXISTS (SELECT 1 FROM adc_identity.GrantClinicScope s WHERE s.grant_id=g.grant_id) AND NOT EXISTS (SELECT 1 FROM adc_identity.GrantClinicScope s WHERE s.grant_id=g.grant_id AND s.clinic_id NOT IN (");
        sql.append(String.join(",",Collections.nCopies(authorized.size(),"?"))).append("))");var args=new ArrayList<Object>();args.add(after);args.addAll(new TreeSet<>(authorized));
        if(subject!=null){sql.append(" AND g.subject_id=?");args.add(subject);}sql.append(" ORDER BY g.grant_id LIMIT ?");args.add(limit+1);
        var ids=db.query(sql.toString(),(r,n)->r.getString(1),args.toArray());String next=null;
        if(ids.size()>limit){ids=new ArrayList<>(ids.subList(0,limit));next=Base64.getUrlEncoder().withoutPadding().encodeToString(ids.getLast().getBytes(java.nio.charset.StandardCharsets.UTF_8));}
        var page=new LinkedHashMap<String,Object>();page.put("items",ids.stream().map(this::view).toList());page.put("next_cursor",next);return page;
    }
}
