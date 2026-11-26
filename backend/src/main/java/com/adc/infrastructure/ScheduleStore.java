package com.adc.infrastructure;

import com.adc.domain.shared.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ScheduleStore {
    private final JdbcTemplate db;private final Clock clock;
    public ScheduleStore(JdbcTemplate db,Clock clock){this.db=db;this.clock=clock;}
    public record Schedule(long id,long dentist,long clinic,LocalDate date,LocalTime start,LocalTime end,int slot,String status,String note){
        public Instant starts(){return date.atTime(start).atZone(BusinessTime.ZONE).toInstant();}public Instant ends(){return date.atTime(end).atZone(BusinessTime.ZONE).toInstant();}
        public Map<String,Object> view(){var result=new LinkedHashMap<String,Object>();result.put("schedule_id",Long.toString(id));result.put("dentist_id",Long.toString(dentist));result.put("clinic_id",Long.toString(clinic));result.put("schedule_date",date.toString());result.put("start_time",start.format(DateTimeFormatter.ISO_LOCAL_TIME));result.put("end_time",end.format(DateTimeFormatter.ISO_LOCAL_TIME));result.put("slot_minutes",slot);result.put("schedule_status",status);result.put("note",note);return result;}
    }
    public Schedule get(long id){var rows=db.query("SELECT * FROM adc_business.DentistSchedule WHERE schedule_id=?",(r,n)->new Schedule(r.getLong("schedule_id"),r.getLong("dentist_id"),r.getLong("clinic_id"),r.getObject("schedule_date",LocalDate.class),r.getObject("start_time",LocalTime.class),r.getObject("end_time",LocalTime.class),r.getInt("slot_minutes"),r.getString("schedule_status"),r.getString("note")),id);if(rows.isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");return rows.getFirst();}
    public void eligible(long dentist,long clinic,LocalDate date){
        if(db.queryForObject("SELECT COUNT(*) FROM adc_business.Clinic WHERE clinic_id=? AND is_active=true",Integer.class,clinic)!=1)throw new DomainFailure(422,"CLINIC_UNAVAILABLE");
        if(db.queryForObject("SELECT COUNT(*) FROM adc_business.Dentist d WHERE d.dentist_id=? AND d.is_active=true AND d.hire_date<=? AND (d.termination_date IS NULL OR d.termination_date>=?) AND EXISTS (SELECT 1 FROM adc_business.DentistClinicAssignment a WHERE a.dentist_id=d.dentist_id AND a.clinic_id=? AND a.is_active=true AND a.start_date<=? AND (a.end_date IS NULL OR a.end_date>=?))",Integer.class,dentist,date,date,clinic,date,date)!=1)throw new DomainFailure(422,"DENTIST_ASSIGNMENT_UNAVAILABLE");
    }
    public void overlap(long dentist,LocalDate date,LocalTime start,LocalTime end){if(db.queryForObject("SELECT COUNT(*) FROM adc_business.DentistSchedule WHERE dentist_id=? AND schedule_date=? AND schedule_status='NORMAL' AND start_time<? AND end_time>?",Integer.class,dentist,date,end,start)>0)throw new DomainFailure(409,"SCHEDULE_OVERLAP");}
    public long create(long dentist,long clinic,LocalDate date,LocalTime start,LocalTime end,int slot,String note){long id=Crypto.id();db.update("INSERT INTO adc_business.DentistSchedule VALUES (?,?,?,?,?,?,?,'NORMAL',?,?)",id,dentist,clinic,date,start,end,slot,note,LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC));return id;}
    public List<Long> appointmentIds(long schedule){return db.query("SELECT appointment_id FROM adc_business.Appointment WHERE schedule_id=? ORDER BY appointment_id",(r,n)->r.getLong(1),schedule);}
    public List<String> affected(long schedule){return db.query("SELECT appointment_id FROM adc_business.Appointment WHERE schedule_id=? AND status='SCHEDULED' ORDER BY scheduled_at,appointment_id",(r,n)->r.getString(1),schedule);}
    public void suspend(long schedule){db.update("UPDATE adc_business.DentistSchedule SET schedule_status='SUSPENDED' WHERE schedule_id=?",schedule);}
    public List<Schedule> list(List<Long> clinics,Long dentist,Instant start,Instant end,long after,int limit){String placeholders=String.join(",",Collections.nCopies(clinics.size(),"?"));var args=new ArrayList<Object>(clinics);args.add(after);String filter="";if(dentist!=null){filter+=" AND dentist_id=?";args.add(dentist);}if(start!=null){filter+=" AND schedule_date>=?";args.add(start.atZone(BusinessTime.ZONE).toLocalDate());}if(end!=null){filter+=" AND schedule_date<=?";args.add(end.atZone(BusinessTime.ZONE).toLocalDate());}
        // Filter exact half-open instants before pagination; day predicates keep the scan in the requested range.
        return db.query("SELECT schedule_id FROM adc_business.DentistSchedule WHERE clinic_id IN ("+placeholders+") AND schedule_id>?"+filter+" ORDER BY schedule_id",(r,n)->r.getLong(1),args.toArray()).stream().map(this::get).filter(s->(start==null || s.ends().isAfter(start)) && (end==null || s.starts().isBefore(end))).limit(limit).toList();
    }
}
