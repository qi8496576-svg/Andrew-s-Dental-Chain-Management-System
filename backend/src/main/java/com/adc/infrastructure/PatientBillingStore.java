package com.adc.infrastructure;

import com.adc.domain.shared.DomainFailure;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

/** Money is integer fen; these records never change Invoice/R1 revenue. */
@Repository
public class PatientBillingStore {
    private static final JsonMapper JSON=JsonMapper.builder().build();
    private final JdbcTemplate db;private final Clock clock;
    public PatientBillingStore(JdbcTemplate db,Clock clock){this.db=db;this.clock=clock;}
    public LocalDateTime now(){return utc(clock.instant());}
    public static LocalDateTime utc(Instant at){return LocalDateTime.ofInstant(at,ZoneOffset.UTC);}
    public record Bill(long id,long patient,long clinic,String kind,Long hold,Long appointment,Long invoice,long amount,String status) { }
    public record Hold(long id,long patient,long clinic,long dentist,long schedule,Instant at,int minutes,List<Long> treatments,byte[] confirmation,Instant expires,String status) { }
    public Bill bill(long id,boolean lock){var rows=db.query("SELECT * FROM adc_business.PatientBill WHERE bill_id=?"+(lock?" FOR UPDATE":""),(r,n)->new Bill(r.getLong("bill_id"),r.getLong("patient_id"),r.getLong("clinic_id"),r.getString("kind"),r.getObject("hold_id",Long.class),r.getObject("appointment_id",Long.class),r.getObject("invoice_id",Long.class),r.getLong("amount_fen"),r.getString("status")),id);if(rows.isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");return rows.getFirst();}
    public Hold hold(long id){var rows=db.query("SELECT * FROM adc_business.BookingHold WHERE hold_id=?",(r,n)->{var ids=new ArrayList<Long>();for(var node:JSON.readTree(r.getString("requested_treatment_ids")))ids.add(node.asLong());return new Hold(id,r.getLong("patient_id"),r.getLong("clinic_id"),r.getLong("dentist_id"),r.getLong("schedule_id"),r.getObject("scheduled_at",LocalDateTime.class).toInstant(ZoneOffset.UTC),r.getInt("slot_minutes"),ids,r.getBytes("confirmation_digest"),r.getObject("expires_at",LocalDateTime.class).toInstant(ZoneOffset.UTC),r.getString("status"));},id);if(rows.isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");return rows.getFirst();}
    public long createHold(long patient,ScheduleStore.Schedule schedule,Instant at,List<Long> treatments,byte[] confirmation,long amount){
        long hold=Crypto.id(),bill=Crypto.id();Instant expiry=clock.instant().plusSeconds(300);if(!expiry.isBefore(at))expiry=at;
        db.update("INSERT INTO adc_business.BookingHold VALUES (?,?,?,?,?,?,?,?,?,?,'HELD',NULL,?,?)",hold,patient,schedule.clinic(),schedule.dentist(),schedule.id(),utc(at),schedule.slot(),JSON.writeValueAsString(treatments),confirmation,utc(expiry),now(),now());
        db.update("INSERT INTO adc_business.PatientBill VALUES (?,?,?,'REGISTRATION',?,NULL,NULL,?,'PENDING',?,?)",bill,patient,schedule.clinic(),hold,amount,now(),now());return bill;
    }
    public void close(Bill bill,String holdStatus){if(bill.status.equals("PENDING")){db.update("UPDATE adc_business.PatientBill SET status='CLOSED',updated_at=? WHERE bill_id=? AND status='PENDING'",now(),bill.id);if(bill.hold!=null)db.update("UPDATE adc_business.BookingHold SET status=?,updated_at=? WHERE hold_id=? AND status='HELD'",holdStatus,now(),bill.hold);}}
    public void pay(Bill bill,Long appointment){
        db.update("INSERT INTO adc_business.PaymentOrder VALUES (?,?,?,'DEMO','SUCCEEDED',?,?)",Crypto.id(),bill.id,bill.amount,now(),now());
        db.update("UPDATE adc_business.PatientBill SET status='PAID',appointment_id=COALESCE(?,appointment_id),updated_at=? WHERE bill_id=?",appointment,now(),bill.id);
        if(bill.hold!=null)db.update("UPDATE adc_business.BookingHold SET status='BOOKED',appointment_id=?,updated_at=? WHERE hold_id=?",appointment,now(),bill.hold);
    }
    public static void refund(JdbcTemplate db,Clock clock,long bill,String actor,String reason){
        var rows=db.query("SELECT p.payment_id,p.amount_fen,p.mode FROM adc_business.PaymentOrder p WHERE p.bill_id=? FOR UPDATE",(r,n)->new Object[]{r.getLong(1),r.getLong(2),r.getString(3)},bill);
        if(rows.isEmpty()||!"DEMO".equals(rows.getFirst()[2]))throw new DomainFailure(409,"DEMO_PAYMENT_REQUIRED");
        long payment=(Long)rows.getFirst()[0];if(db.queryForObject("SELECT COUNT(*) FROM adc_business.RefundOrder WHERE payment_id=?",Integer.class,payment)>0)return;
        var now=utc(clock.instant());db.update("INSERT INTO adc_business.RefundOrder VALUES (?,?,?,?,?,'SUCCEEDED',?)",Crypto.id(),payment,rows.getFirst()[1],reason,actor,now);db.update("UPDATE adc_business.PaymentOrder SET status='REFUNDED' WHERE payment_id=?",payment);db.update("UPDATE adc_business.PatientBill SET status='REFUNDED',updated_at=? WHERE bill_id=?",now,bill);
    }
    public void refund(Bill bill,String actor,String reason){refund(db,clock,bill.id,actor,reason);}
    public boolean cancelled(long appointment){return db.queryForObject("SELECT COUNT(*) FROM adc_business.Appointment WHERE appointment_id=? AND status='CANCELLED'",Integer.class,appointment)==1;}
    public void treatmentBill(long invoice){
        db.update("INSERT INTO adc_business.PatientBill (bill_id,patient_id,clinic_id,kind,hold_id,appointment_id,invoice_id,amount_fen,status,created_at,updated_at) SELECT ?,a.patient_id,a.clinic_id,'TREATMENT',NULL,a.appointment_id,i.invoice_id,CAST(i.total_amount*100 AS SIGNED),'PENDING',?,? FROM adc_business.Invoice i JOIN adc_business.Appointment a ON a.appointment_id=i.appointment_id WHERE i.invoice_id=? AND NOT EXISTS (SELECT 1 FROM adc_business.PatientBill b WHERE b.invoice_id=i.invoice_id)",Crypto.id(),now(),now(),invoice);
    }
    public List<Long> list(Long patient,List<Long> clinics,long after,int limit){var args=new ArrayList<Object>();String where="bill_id>?";args.add(after);if(patient!=null){where+=" AND patient_id=?";args.add(patient);}else{where+=" AND clinic_id IN ("+String.join(",",Collections.nCopies(clinics.size(),"?"))+")";args.addAll(clinics);}args.add(limit);return db.query("SELECT bill_id FROM adc_business.PatientBill WHERE "+where+" ORDER BY bill_id LIMIT ?",(r,n)->r.getLong(1),args.toArray());}
    public Map<String,Object> view(long id){var b=bill(id,false);var row=new LinkedHashMap<String,Object>();row.put("bill_id",Long.toString(b.id));row.put("patient_id",Long.toString(b.patient));row.put("clinic_id",Long.toString(b.clinic));row.put("kind",b.kind);row.put("amount_fen",b.amount);row.put("status",b.status);row.put("hold_id",b.hold==null?null:Long.toString(b.hold));row.put("appointment_id",b.appointment==null?null:Long.toString(b.appointment));row.put("invoice_id",b.invoice==null?null:Long.toString(b.invoice));row.put("mode","DEMO");row.put("payment_notice","演示支付，不扣真实款");row.put("clinic_name",db.queryForObject("SELECT clinic_code FROM adc_business.Clinic WHERE clinic_id=?",String.class,b.clinic));row.put("expires_at",b.hold==null?null:hold(b.hold).expires.toString());row.put("scheduled_at",b.hold==null?null:hold(b.hold).at.toString());row.put("dentist_name",b.hold==null?null:db.queryForObject("SELECT full_name FROM adc_business.Dentist WHERE dentist_id=?",String.class,hold(b.hold).dentist));
        var payments=db.query("SELECT p.payment_id,p.status,p.paid_at,r.refund_id,r.reason FROM adc_business.PaymentOrder p LEFT JOIN adc_business.RefundOrder r ON r.payment_id=p.payment_id WHERE p.bill_id=?",(r,n)->{var p=new LinkedHashMap<String,Object>();p.put("payment_id",r.getString(1));p.put("status",r.getString(2));p.put("paid_at",r.getObject(3,LocalDateTime.class).toInstant(ZoneOffset.UTC).toString());p.put("refund_id",r.getString(4));p.put("refund_reason",r.getString(5));return p;},id);row.put("payment",payments.isEmpty()?null:payments.getFirst());return row;}
    public String clinicCode(long id){return db.queryForObject("SELECT clinic_code FROM adc_business.Clinic WHERE clinic_id=?",String.class,id);}
    public void fee(long clinic,long dentist,long amount){db.update("INSERT INTO adc_business.RegistrationFeePolicy VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE amount_fen=VALUES(amount_fen),updated_at=VALUES(updated_at)",clinic,dentist,amount,now());}
}
