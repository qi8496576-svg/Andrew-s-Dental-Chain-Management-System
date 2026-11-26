package com.adc.application;

import com.adc.domain.shared.*;
import com.adc.identity.IdentityGate;
import com.adc.infrastructure.*;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

/** Minimal authorized projections. No patient contacts, notes or allergy data. */
@Service @Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
public class WorkspaceReadService {
 private final IdentityGate gate; private final JdbcTemplate db; private final AuditWriter audit; private final Clock clock; private final ScheduleStore schedules;
 public WorkspaceReadService(IdentityGate gate,JdbcTemplate db,AuditWriter audit,Clock clock,ScheduleStore schedules){this.gate=gate;this.db=db;this.audit=audit;this.clock=clock;this.schedules=schedules;}
 private record Scope(IdentityGate.Identity actor,List<Long> clinics,Long dentist){}
 private Scope scope(String token,String client,String role,Long clinic,boolean summary){
  var actor=gate.authenticate(token,client);
  if(!Set.of("HEADQUARTERS","RECEPTION","DENTIST","CASHIER").contains(role)||(!summary&&role.equals("HEADQUARTERS")))throw new DomainFailure(403,"ACCESS_DENIED");
  var clinics=new ArrayList<>(gate.staffClinics(actor,role,role.equals("HEADQUARTERS")?"analysis.read":"listAppointments"));
  if(clinic!=null){if(!clinics.contains(clinic))throw new DomainFailure(403,"ACCESS_DENIED");clinics=new ArrayList<>(List.of(clinic));}
  Long dentist=null;if(role.equals("DENTIST")){dentist=actor.dentistId();if(dentist==null)throw new DomainFailure(403,"ACCESS_DENIED");for(long id:List.copyOf(clinics))try{schedules.eligible(dentist,id,clock.instant().atZone(BusinessTime.ZONE).toLocalDate());}catch(DomainFailure failure){if(failure.status()!=422)throw failure;clinics.remove(id);}}
  if(clinics.isEmpty())throw new DomainFailure(403,"ACCESS_DENIED");return new Scope(actor,clinics,dentist);
 }
 private String where(Scope scope,Instant start,Instant end,String status,Long dentist,String review,List<Object> args){
  String sql="a.clinic_id IN ("+String.join(",",Collections.nCopies(scope.clinics.size(),"?"))+")";args.addAll(scope.clinics);
  if(start!=null){sql+=" AND a.scheduled_at>=?";args.add(LocalDateTime.ofInstant(start,ZoneOffset.UTC));}if(end!=null){sql+=" AND a.scheduled_at<?";args.add(LocalDateTime.ofInstant(end,ZoneOffset.UTC));}
  if(scope.dentist!=null){sql+=" AND a.dentist_id=?";args.add(scope.dentist);}if(dentist!=null){sql+=" AND a.dentist_id=?";args.add(dentist);}
  if(status!=null&&!status.isBlank()){if(!Set.of("SCHEDULED","IN_PROGRESS","COMPLETED","INVOICED","CANCELLED").contains(status))throw new DomainFailure(400,"INVALID_REQUEST");sql+=" AND a.status=?";args.add(status);}
  if(review!=null){if(!Set.of("reschedule","no-show").contains(review))throw new DomainFailure(400,"INVALID_REQUEST");sql+=" AND a.status='SCHEDULED' AND "+(review.equals("reschedule")?"s.schedule_status='SUSPENDED'":"s.schedule_status='NORMAL' AND a.attended_at IS NULL AND DATE_ADD(a.scheduled_at,INTERVAL s.slot_minutes MINUTE)<=?");if(review.equals("no-show"))args.add(LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC));}
  return sql;
 }
 public Map<String,Object> appointments(String token,String client,String role,Long clinic,Instant start,Instant end,String status,Long dentist,String review,String cursor,int limit,String request){
  if(limit<1||limit>100||(start!=null&&end!=null&&!end.isAfter(start)))throw new DomainFailure(400,"INVALID_REQUEST");var scope=scope(token,client,role,clinic,false);var args=new ArrayList<Object>();var filter=where(scope,start,end,status,dentist,review,args);
  if(cursor!=null){try{var parts=new String(Base64.getUrlDecoder().decode(cursor),java.nio.charset.StandardCharsets.UTF_8).split("/",-1);var at=LocalDateTime.ofInstant(Instant.parse(parts[0]),ZoneOffset.UTC);long id=BusinessValues.id(parts[1]);filter+=" AND (a.scheduled_at>? OR (a.scheduled_at=? AND a.appointment_id>?))";args.add(at);args.add(at);args.add(id);}catch(RuntimeException e){throw new DomainFailure(400,"INVALID_REQUEST");}}
  args.add(limit+1);
  var rows=db.query("SELECT a.appointment_id,a.patient_id,a.clinic_id,a.dentist_id,a.schedule_id,a.scheduled_at,a.status,a.attended_at,a.completed_at,a.cancellation_kind,a.rescheduled_from_id,i.invoice_id,p.full_name patient_name,p.patient_number,d.full_name dentist_name,c.clinic_code clinic_name,COALESCE((SELECT GROUP_CONCAT(t.treatment_name ORDER BY t.treatment_id SEPARATOR '、') FROM adc_business.AppointmentRequestedTreatment r JOIN adc_business.Treatment t ON t.treatment_id=r.treatment_id WHERE r.appointment_id=a.appointment_id),'未指定') requested_treatments FROM adc_business.Appointment a JOIN adc_business.DentistSchedule s ON s.schedule_id=a.schedule_id JOIN adc_business.Patient p ON p.patient_id=a.patient_id JOIN adc_business.Dentist d ON d.dentist_id=a.dentist_id JOIN adc_business.Clinic c ON c.clinic_id=a.clinic_id LEFT JOIN adc_business.Invoice i ON i.appointment_id=a.appointment_id WHERE "+filter+" ORDER BY a.scheduled_at,a.appointment_id LIMIT ?",(r,n)->{var row=new LinkedHashMap<String,Object>();for(String key:List.of("appointment_id","patient_id","clinic_id","dentist_id","schedule_id","status","cancellation_kind","rescheduled_from_id","invoice_id","patient_name","patient_number","dentist_name","clinic_name","requested_treatments"))row.put(key,r.getString(key));for(String key:List.of("scheduled_at","attended_at","completed_at")){var at=r.getObject(key,LocalDateTime.class);row.put(key,at==null?null:at.toInstant(ZoneOffset.UTC).toString());}return row;},args.toArray());
  String next=null;if(rows.size()>limit){rows=new ArrayList<>(rows.subList(0,limit));var last=rows.getLast();next=Base64.getUrlEncoder().withoutPadding().encodeToString((last.get("scheduled_at")+"/"+last.get("appointment_id")).getBytes(java.nio.charset.StandardCharsets.UTF_8));}
  audit.success(scope.actor,"listAppointments","Appointment",null,scope.clinics,request);var page=new LinkedHashMap<String,Object>();page.put("items",rows);page.put("next_cursor",next);return page;
 }
 public Map<String,Object> applied(String token,String client,Long clinic,String cursor,int limit,String request){
  var actor=gate.authenticate(token,client);var scope=new ArrayList<>(gate.staffClinics(actor,"HEADQUARTERS","cost.verify"));if(clinic!=null){if(!scope.contains(clinic))throw new DomainFailure(403,"ACCESS_DENIED");scope=new ArrayList<>(List.of(clinic));}if(limit<1||limit>100)throw new DomainFailure(400,"INVALID_REQUEST");var args=new ArrayList<Object>();args.addAll(scope);args.add(cursor==null?0:BusinessValues.id(cursor));args.add(limit+1);
  var rows=db.query("SELECT t.applied_treatment_id,t.appointment_id,t.dentist_id,a.clinic_id,d.full_name dentist_name,c.clinic_code clinic_name,r.treatment_name,t.performed_at FROM adc_business.AppliedTreatment t JOIN adc_business.Appointment a ON a.appointment_id=t.appointment_id JOIN adc_business.Dentist d ON d.dentist_id=t.dentist_id JOIN adc_business.Clinic c ON c.clinic_id=a.clinic_id JOIN adc_business.Treatment r ON r.treatment_id=t.treatment_id WHERE a.clinic_id IN ("+String.join(",",Collections.nCopies(scope.size(),"?"))+") AND t.applied_treatment_id>? ORDER BY t.applied_treatment_id LIMIT ?",(r,n)->{var row=new LinkedHashMap<String,Object>();for(String key:List.of("applied_treatment_id","appointment_id","dentist_id","clinic_id","dentist_name","clinic_name","treatment_name"))row.put(key,r.getString(key));row.put("performed_at",r.getObject("performed_at",LocalDateTime.class).toInstant(ZoneOffset.UTC).toString());return row;},args.toArray());
  String next=null;if(rows.size()>limit){rows=new ArrayList<>(rows.subList(0,limit));next=(String)rows.getLast().get("applied_treatment_id");}audit.success(actor,"cost.verify","AppliedTreatment",null,scope,request);var result=new LinkedHashMap<String,Object>();result.put("items",rows);result.put("next_cursor",next);return result;
 }
 public Map<String,Object> summary(String token,String client,String role,Long clinic,Instant start,Instant end,String request){
  if(start==null||end==null||!end.isAfter(start))throw new DomainFailure(400,"INVALID_REQUEST");var scope=scope(token,client,role,clinic,true);var args=new ArrayList<Object>();var filter=where(scope,start,end,null,null,null,args);
  var rows=db.query("SELECT a.status,COUNT(*) amount FROM adc_business.Appointment a WHERE "+filter+" GROUP BY a.status",(r,n)->Map.<String,Object>of("status",r.getString(1),"count",r.getLong(2)),args.toArray());
  audit.success(scope.actor,role.equals("HEADQUARTERS")?"analysis.read":"listAppointments","Appointment",null,scope.clinics,request);return Map.of("states",rows,"start",start.toString(),"end",end.toString(),"clinic_ids",scope.clinics.stream().map(String::valueOf).toList());
 }
}
