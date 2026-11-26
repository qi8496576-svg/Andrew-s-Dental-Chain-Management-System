package com.adc.infrastructure;

import com.adc.domain.shared.DomainFailure;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

@Repository
public class PatientBindingStore {
    private final JdbcTemplate db;private final Clock clock;private static final JsonMapper JSON=JsonMapper.builder().build();
    public PatientBindingStore(JdbcTemplate db,Clock clock){this.db=db;this.clock=clock;}
    private LocalDateTime now(){return LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC);}
    public record Request(String id,String subject,String number,LocalDate birth,long clinic,String status,Long patient,Instant submitted) { }
    public Request request(String id){var rows=db.query("SELECT * FROM adc_identity.BindingRequest WHERE request_id=?",(r,n)->new Request(r.getString("request_id"),r.getString("applicant_subject_id"),r.getString("patient_number_hint"),r.getObject("date_of_birth_hint",LocalDate.class),r.getLong("service_clinic_id"),r.getString("status"),r.getObject("candidate_patient_id",Long.class),r.getObject("submitted_at",LocalDateTime.class).toInstant(ZoneOffset.UTC)),id);if(rows.isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");return rows.getFirst();}
    public Map<String,Object> requestView(Request row){return Map.of("request_id",row.id,"subject_id",row.subject,"patient_number",row.number,"date_of_birth",row.birth.toString(),"clinic_id",Long.toString(row.clinic),"status",row.status,"submitted_at",row.submitted.toString());}
    public Map<String,Object> binding(String subject){var rows=db.query("SELECT subject_id,patient_id,verified_at,verification_reference FROM adc_identity.CurrentPatientBinding WHERE subject_id=?",(r,n)->Map.<String,Object>of("subject_id",r.getString(1),"patient_id",r.getString(2),"verified_at",r.getObject(3,LocalDateTime.class).toInstant(ZoneOffset.UTC).toString(),"verification_reference",r.getString(4)),subject);return rows.isEmpty()?null:rows.getFirst();}
    public void nativeSubject(String subject){if(db.queryForObject("SELECT COUNT(*) FROM adc_identity.Subject WHERE subject_id=? AND subject_type='PATIENT' AND is_enabled=true",Integer.class,subject)!=1)throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");}
    public void clinic(long clinic){if(db.queryForObject("SELECT COUNT(*) FROM adc_business.Clinic WHERE clinic_id=? AND is_active=true",Integer.class,clinic)!=1)throw new DomainFailure(422,"CLINIC_UNAVAILABLE");}
    public String create(String subject,String number,LocalDate birth,long clinic){String id=UUID.randomUUID().toString();db.update("INSERT INTO adc_identity.BindingRequest (request_id,applicant_subject_id,patient_number_hint,date_of_birth_hint,service_clinic_id,status,submitted_at) VALUES (?,?,?,?,?,'PENDING',?)",id,subject,number,birth,clinic,now());return id;}
    public List<Request> list(List<Long> clinics,String after,int limit){String placeholders=String.join(",",Collections.nCopies(clinics.size(),"?"));var args=new ArrayList<Object>(clinics);args.add(after);args.add(limit);return db.query("SELECT request_id FROM adc_identity.BindingRequest WHERE service_clinic_id IN ("+placeholders+") AND request_id>? ORDER BY request_id LIMIT ?",(r,n)->r.getString(1),args.toArray()).stream().map(this::request).toList();}
    public void available(String subject,long patient){if(binding(subject)!=null || db.queryForObject("SELECT COUNT(*) FROM adc_identity.CurrentPatientBinding WHERE patient_id=?",Integer.class,patient)>0)throw new DomainFailure(409,"PATIENT_BINDING_CONFLICT");}
    public void approve(Request request,long patient,String actor,Object basis,String reason){if(!request.status.equals("PENDING"))throw new DomainFailure(409,"BINDING_REQUEST_ALREADY_REVIEWED");db.update("UPDATE adc_identity.BindingRequest SET candidate_patient_id=?,status='APPROVED',reviewed_by=?,reviewed_at=?,verification_basis=?,reason=? WHERE request_id=? AND status='PENDING'",patient,actor,now(),JSON.writeValueAsString(basis),reason,request.id);}
    public void bind(String subject,long patient,String actor,String request){db.update("INSERT INTO adc_identity.CurrentPatientBinding VALUES (?,?,?,?,?)",subject,patient,actor,now(),request);}
    public void unbind(String subject){db.update("DELETE FROM adc_identity.CurrentPatientBinding WHERE subject_id=?",subject);}
    public void event(String action,long patient,String oldSubject,String newSubject,String actor,String request,Object basis,String reason,String key){db.update("INSERT INTO adc_identity.BindingEvent (event_id,action,patient_id,old_subject_id,new_subject_id,operator_subject_id,binding_request_id,occurred_at,reason,verification_basis,request_key) VALUES (?,?,?,?,?,?,?,?,?,?,?)",UUID.randomUUID().toString(),action,patient,oldSubject,newSubject,actor,request,now(),reason,JSON.writeValueAsString(basis),key);}
}
