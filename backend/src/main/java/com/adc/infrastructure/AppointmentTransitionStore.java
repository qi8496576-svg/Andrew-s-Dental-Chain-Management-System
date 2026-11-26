package com.adc.infrastructure;

import com.adc.domain.shared.DomainFailure;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

@Repository
public class AppointmentTransitionStore {
    private final JdbcTemplate db;private final BusinessRowLocks locks;private final ScheduleStore schedules;private final Clock clock;
    public AppointmentTransitionStore(JdbcTemplate db,BusinessRowLocks locks,ScheduleStore schedules,Clock clock){this.db=db;this.locks=locks;this.schedules=schedules;this.clock=clock;}
    public record Facts(long id,long patient,long clinic,long dentist,long schedule,Instant at,String status) { }
    public Facts facts(long id){var rows=db.query("SELECT appointment_id,patient_id,clinic_id,dentist_id,schedule_id,scheduled_at,status FROM adc_business.Appointment WHERE appointment_id=?",(r,n)->new Facts(r.getLong(1),r.getLong(2),r.getLong(3),r.getLong(4),r.getLong(5),r.getObject(6,LocalDateTime.class).toInstant(ZoneOffset.UTC),r.getString(7)),id);if(rows.isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");return rows.getFirst();}
    public Facts lock(long id){var hint=facts(id);var plan=new BusinessRowLocks.Plan(Set.of(hint.dentist),Set.of(hint.schedule),Set.of(id));locks.acquire(plan);var current=facts(id);plan.verifyUnchanged(new BusinessRowLocks.Plan(Set.of(current.dentist),Set.of(current.schedule),Set.of(id)));var schedule=schedules.get(current.schedule);if(schedule.clinic()!=current.clinic || schedule.dentist()!=current.dentist)throw new DomainFailure(409,"APPOINTMENT_SCHEDULE_CONFLICT");return current;}
    public ScheduleStore.Schedule schedule(Facts facts){return schedules.get(facts.schedule);}
    public boolean hasAttendance(long id){return db.queryForObject("SELECT COUNT(*) FROM adc_business.Appointment WHERE appointment_id=? AND attended_at IS NOT NULL",Integer.class,id)>0;}
    public void transition(Facts facts,String target,String event,String kind,String reason,String verification,String role,String actor,String key){
        LocalDateTime now=LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC);int changed;
        if(target.equals("IN_PROGRESS"))changed=db.update("UPDATE adc_business.Appointment SET status='IN_PROGRESS',attended_at=?,updated_at=? WHERE appointment_id=? AND status='SCHEDULED'",now,now,facts.id);
        else if(target.equals("CANCELLED"))changed=db.update("UPDATE adc_business.Appointment SET status='CANCELLED',cancelled_at=?,cancellation_reason=?,cancellation_kind=?,updated_at=? WHERE appointment_id=? AND status='SCHEDULED'",now,reason,kind,now,facts.id);
        else throw new IllegalArgumentException("Unsupported transition");
        if(changed!=1)throw new DomainFailure(409,"APPOINTMENT_STATE_CONFLICT");
        if(target.equals("CANCELLED")&&!"NO_SHOW".equals(kind)){
            var bills=db.query("SELECT bill_id FROM adc_business.PatientBill WHERE appointment_id=? AND kind='REGISTRATION' AND status='PAID' FOR UPDATE",(r,n)->r.getLong(1),facts.id);
            for(long bill:bills)PatientBillingStore.refund(db,clock,bill,actor,reason);
        }
        var details=new LinkedHashMap<String,Object>();details.put("verification_reference",verification);if(kind!=null)details.put("cancellation_kind",kind);
        if("NO_SHOW".equals(kind))details.put("absence_confirmed_by_reception",true);
        db.update("INSERT INTO adc_business.AppointmentEvent VALUES (?,?,?,'SCHEDULED',?,?,?,?,?,?,?)",Crypto.id(),facts.id,event,target,now,role,actor,reason,key,JsonMapper.builder().build().writeValueAsString(details));
    }
}
