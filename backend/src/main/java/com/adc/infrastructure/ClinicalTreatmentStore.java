package com.adc.infrastructure;
import com.adc.domain.shared.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

@Repository
public class ClinicalTreatmentStore {
    private final JdbcTemplate db;private final AppointmentTransitionStore appointments;private final BusinessRowLocks locks;private static final JsonMapper JSON=JsonMapper.builder().build();
    public ClinicalTreatmentStore(JdbcTemplate db,AppointmentTransitionStore appointments,BusinessRowLocks locks){this.db=db;this.appointments=appointments;this.locks=locks;}
    public BusinessRowLocks.Plan plan(long appointment,Long actorDentist){var fact=appointments.facts(appointment);var dentists=new TreeSet<Long>(db.query("SELECT DISTINCT dentist_id FROM adc_business.AppliedTreatment WHERE appointment_id=?",(r,n)->r.getLong(1),appointment));dentists.add(fact.dentist());if(actorDentist!=null)dentists.add(actorDentist);return new BusinessRowLocks.Plan(dentists,Set.of(fact.schedule()),Set.of(appointment));}
    public void lock(long appointment,Long actorDentist){var before=plan(appointment,actorDentist);locks.acquire(before);before.verifyUnchanged(plan(appointment,actorDentist));}
    public Instant attended(long id){var at=db.queryForObject("SELECT attended_at FROM adc_business.Appointment WHERE appointment_id=?",LocalDateTime.class,id);return at==null?null:at.toInstant(ZoneOffset.UTC);}
    public boolean invoiced(long id){return db.queryForObject("SELECT COUNT(*) FROM adc_business.Invoice WHERE appointment_id=?",Integer.class,id)>0;}
    public BigDecimal price(long id){var rows=db.query("SELECT default_unit_price FROM adc_business.Treatment WHERE treatment_id=? AND is_active=true FOR UPDATE",(r,n)->r.getBigDecimal(1),id);if(rows.isEmpty())throw new DomainFailure(422,"TREATMENT_UNAVAILABLE");return rows.getFirst();}
    public long record(long appointment,long treatment,long dentist,BigDecimal units,BigDecimal price,BigDecimal subtotal,Instant at){long id=Crypto.id();db.update("INSERT INTO adc_business.AppliedTreatment VALUES (?,?,?,?,?,?,?,?)",id,appointment,treatment,dentist,units,price,subtotal,LocalDateTime.ofInstant(at,ZoneOffset.UTC));return id;}
    public Map<String,Object> raw(long id){var rows=db.query("SELECT * FROM adc_business.AppliedTreatment WHERE applied_treatment_id=?",(r,n)->{var row=new LinkedHashMap<String,Object>();for(String field:List.of("applied_treatment_id","appointment_id","treatment_id","dentist_id"))row.put(field,r.getString(field));for(String field:List.of("standard_units","unit_price","subtotal"))row.put(field,r.getBigDecimal(field).toPlainString());row.put("performed_at",r.getObject("performed_at",LocalDateTime.class).toInstant(ZoneOffset.UTC).toString());return (Map<String,Object>)row;},id);if(rows.isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");return rows.getFirst();}
    public Map<String,Object> view(long id){var row=raw(id);row.put("etag",CanonicalJson.etag(JSON.writeValueAsString(row)));return row;}
    public List<Map<String,Object>> rows(long appointment){return db.query("SELECT applied_treatment_id FROM adc_business.AppliedTreatment WHERE appointment_id=? ORDER BY applied_treatment_id",(r,n)->r.getLong(1),appointment).stream().map(this::view).toList();}
    public String notes(long appointment){return db.queryForObject("SELECT problems_or_special_needs FROM adc_business.Appointment WHERE appointment_id=?",String.class,appointment);}
    public void notes(long appointment,String text,Instant now){db.update("UPDATE adc_business.Appointment SET problems_or_special_needs=?,updated_at=? WHERE appointment_id=?",text,LocalDateTime.ofInstant(now,ZoneOffset.UTC),appointment);}
    public void correct(long id,BigDecimal price,BigDecimal subtotal){db.update("UPDATE adc_business.AppliedTreatment SET unit_price=?,subtotal=? WHERE applied_treatment_id=?",price,subtotal,id);}
    public boolean priceEvidence(String actor,long id,long clinic,String reference){return db.queryForObject("SELECT COUNT(*) FROM adc_audit.AuditEvent WHERE subject_id=? AND object_kind='AppliedTreatment' AND object_id=? AND action='getAppliedTreatment' AND result='SUCCESS' AND JSON_CONTAINS(clinic_scope,JSON_QUOTE(?)) AND JSON_UNQUOTE(JSON_EXTRACT(change_summary,'$.price_snapshot_etag'))=?",Integer.class,actor,Long.toString(id),Long.toString(clinic),reference)>0;}
    public void complete(long appointment,Instant now,String actor,String key){if(db.update("UPDATE adc_business.Appointment SET status='COMPLETED',completed_at=?,updated_at=? WHERE appointment_id=? AND status='IN_PROGRESS'",LocalDateTime.ofInstant(now,ZoneOffset.UTC),LocalDateTime.ofInstant(now,ZoneOffset.UTC),appointment)!=1)throw new DomainFailure(409,"APPOINTMENT_STATE_CONFLICT");db.update("INSERT INTO adc_business.AppointmentEvent VALUES (?,?,'COMPLETE','IN_PROGRESS','COMPLETED',?,'DENTIST',?,NULL,?,NULL)",Crypto.id(),appointment,LocalDateTime.ofInstant(now,ZoneOffset.UTC),actor,key);}
}
