package com.adc.infrastructure;

import com.adc.domain.shared.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

/** Scope is supplied only after current authorization, never directly from HTTP parameters. */
@Repository
public class AuditEventStore {
    private final JdbcTemplate db;
    public AuditEventStore(JdbcTemplate db) {this.db=db;}
    public Map<String,Object> search(List<Long> clinics,String start,String end,String action,String object,String cursor,int limit) {
        var args=new ArrayList<Object>();
        var sql=new StringBuilder("SELECT a.audit_id,a.subject_id,a.action,a.object_kind,a.object_id,a.clinic_scope,a.occurred_at,a.request_id,a.result,a.reason FROM adc_audit.AuditEvent a WHERE a.subject_id IS NOT NULL AND JSON_LENGTH(a.clinic_scope)>0 AND NOT EXISTS (SELECT 1 FROM JSON_TABLE(a.clinic_scope,'$[*]' COLUMNS (clinic VARCHAR(30) PATH '$')) scope WHERE scope.clinic NOT IN (");
        sql.append(String.join(",",Collections.nCopies(clinics.size(),"?"))).append("))");
        clinics.forEach(id->args.add(id.toString()));
        if(start!=null) {sql.append(" AND a.occurred_at>=?");args.add(utc(BusinessTime.timestamp(start)));}
        if(end!=null) {sql.append(" AND a.occurred_at<?");args.add(utc(BusinessTime.timestamp(end)));}
        if(start!=null && end!=null && !BusinessTime.timestamp(end).isAfter(BusinessTime.timestamp(start)))throw new DomainFailure(400,"INVALID_REQUEST");
        if(action!=null) {sql.append(" AND a.action=?");args.add(action);}
        if(object!=null) {sql.append(" AND CONCAT_WS(':',a.object_kind,a.object_id)=?");args.add(object);}
        if(cursor!=null) {
            try {
                var parts=new String(Base64.getUrlDecoder().decode(cursor),StandardCharsets.UTF_8).split("\\|",-1);
                if(parts.length!=2)throw new IllegalArgumentException();
                var time=utc(Instant.parse(parts[0]));long id=BusinessValues.id(parts[1]);
                sql.append(" AND (a.occurred_at<? OR (a.occurred_at=? AND a.audit_id<?))");Collections.addAll(args,time,time,id);
            } catch(IllegalArgumentException e) {throw new DomainFailure(400,"INVALID_REQUEST");}
        }
        sql.append(" ORDER BY a.occurred_at DESC,a.audit_id DESC LIMIT ?");args.add(limit+1);
        var items=db.query(sql.toString(),(r,n)->{
            var row=new LinkedHashMap<String,Object>();
            row.put("audit_id",Long.toString(r.getLong("audit_id")));row.put("subject_id",r.getString("subject_id"));
            row.put("action",r.getString("action"));row.put("object_reference",r.getString("object_kind")+(r.getString("object_id")==null?"":":"+r.getString("object_id")));
            var scope=new ArrayList<String>();for(var id:JsonMapper.builder().build().readTree(r.getString("clinic_scope")))scope.add(id.asText());row.put("clinic_scope",scope);
            row.put("occurred_at",r.getObject("occurred_at",LocalDateTime.class).toInstant(ZoneOffset.UTC).toString());row.put("request_id",r.getString("request_id"));row.put("result",r.getString("result"));
            if(r.getString("reason")!=null)row.put("reason",r.getString("reason"));return row;
        },args.toArray());
        String next=null;
        if(items.size()>limit) {
            items=new ArrayList<>(items.subList(0,limit));var last=items.getLast();
            next=Base64.getUrlEncoder().withoutPadding().encodeToString((last.get("occurred_at")+"|"+last.get("audit_id")).getBytes(StandardCharsets.UTF_8));
        }
        var page=new LinkedHashMap<String,Object>();page.put("items",items);page.put("next_cursor",next);return page;
    }
    private static LocalDateTime utc(Instant instant) {return LocalDateTime.ofInstant(instant,ZoneOffset.UTC);}
}
