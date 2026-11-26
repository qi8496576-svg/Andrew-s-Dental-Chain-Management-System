package com.adc.infrastructure;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AppointmentReschedulingStore {
    private final JdbcTemplate db;private final AppointmentBookingStore booking;
    public AppointmentReschedulingStore(JdbcTemplate db,AppointmentBookingStore booking){this.db=db;this.booking=booking;}
    public boolean hasSuccessor(long id){return db.queryForObject("SELECT COUNT(*) FROM adc_business.Appointment WHERE rescheduled_from_id=?",Integer.class,id)>0;}
    public List<Long> requested(long id){return db.query("SELECT treatment_id FROM adc_business.AppointmentRequestedTreatment WHERE appointment_id=? ORDER BY treatment_id",(r,n)->r.getLong(1),id);}
    public boolean occupiedExcept(long dentist,Instant at,int minutes,long source){return booking.hasActiveHold(dentist,at,minutes)||db.queryForObject("SELECT COUNT(*) FROM adc_business.Appointment a JOIN adc_business.DentistSchedule s ON s.schedule_id=a.schedule_id WHERE a.dentist_id=? AND a.appointment_id<>? AND a.status IN ('SCHEDULED','IN_PROGRESS','COMPLETED','INVOICED') AND a.scheduled_at<? AND DATE_ADD(a.scheduled_at,INTERVAL s.slot_minutes MINUTE)>?",Integer.class,dentist,source,LocalDateTime.ofInstant(at.plusSeconds(minutes*60L),ZoneOffset.UTC),LocalDateTime.ofInstant(at,ZoneOffset.UTC))>0;}
    public long successor(long source,long patient,ScheduleStore.Schedule schedule,Instant at,List<Long> treatments,String actor,String key){long id=booking.create(patient,schedule,at,treatments,"RECEPTION",actor,key);db.update("UPDATE adc_business.Appointment SET rescheduled_from_id=? WHERE appointment_id=?",source,id);db.update("UPDATE adc_business.AppointmentRequestedTreatment n JOIN adc_business.AppointmentRequestedTreatment o ON o.appointment_id=? AND o.treatment_id=n.treatment_id SET n.request_note=o.request_note WHERE n.appointment_id=?",source,id);return id;}
}
