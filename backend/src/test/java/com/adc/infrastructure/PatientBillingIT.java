package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.domain.shared.DomainFailure;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.core.env.MapPropertySource;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class PatientBillingIT {
    final PatientRegistrationIT fixture=new PatientRegistrationIT();PatientBillingService billing;String token;
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @BeforeEach void setup()throws Exception{
        fixture.setup();var base=fixture.fixture.fixture.fixture.fixture;token=fixture.token;
        base.context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("demo",Map.of("adc.demo-payments.enabled","true","adc.demo-payments.clinics","FIXTURE")));
        base.context.register(PatientBillingStore.class,PatientBillingService.class,AppointmentTransitionStore.class,AppointmentCancellationService.class);billing=base.context.getBean(PatientBillingService.class);
        base.db.update("UPDATE adc_business.Clinic SET clinic_code='FIXTURE' WHERE clinic_id=1");
        for(String cap:List.of("billing.read","billing.refund"))base.db.update("INSERT IGNORE INTO adc_identity.GrantCapability VALUES ('hq',?)",cap);
        base.db.update("INSERT INTO adc_business.RegistrationFeePolicy VALUES (1,21,2000,?)",StaffAccountsIT.utc(base.now));
        var minimal=new LinkedHashMap<String,Object>();minimal.put("full_name","New minimal patient");minimal.put("date_of_birth","1995-01-02");minimal.put("phone","000");
        fixture.registration.register(cmd("registerSelfPatient","minimal"),1,minimal,"NONE",null,true);
    }
    @AfterEach void close()throws Exception{fixture.close();}
    AtomicCommandExecutor.Command cmd(String op,String key){return new AtomicCommandExecutor.Command(token,"WECHAT",op,key,Crypto.sha256(key),UUID.randomUUID().toString());}
    AppointmentBookingService.Creation input(){var p=fixture.fixture.patients.get(token,"WECHAT",fixture.fixture.fixture.fixture.fixture.db.queryForObject("SELECT patient_id FROM adc_identity.CurrentPatientBinding WHERE subject_id='new-native'",Long.class),UUID.randomUUID().toString());var details=new LinkedHashMap<String,Object>();for(String k:List.of("full_name","date_of_birth","phone","billing_address","email","emergency_contact_name","emergency_contact_phone"))details.put(k,p.get(k));return new AppointmentBookingService.Creation(1,fixture.fixture.schedule,Instant.parse("2026-11-12T01:00:00Z"),List.of(71L),(String)p.get("allergy_confirmation_reference"),null,null,details,new AppointmentBookingService.Declaration("NOT_REVIEWED",List.of(),true));}
    long id(Map<String,Object> bill){return Long.parseLong((String)bill.get("bill_id"));}
    @Test void paidSlotCannotBypassFeeAndOneDemoPaymentCreatesOneRealAppointment()throws Exception{
        assertThrows(DomainFailure.class,()->fixture.fixture.booking.create(cmd("createAppointment","bypass"),input()));
        var hold=cmd("createBookingHold","hold");var bill=billing.hold(hold,input());assertEquals("PENDING",bill.get("status"));assertEquals(2000L,bill.get("amount_fen"));assertNull(bill.get("appointment_id"));
        assertEquals(bill,billing.hold(hold,input()));assertThrows(DomainFailure.class,()->billing.hold(cmd("createBookingHold","compete"),input()));
        var paid=billing.pay(cmd("payDemoBill","pay"),id(bill));assertEquals("PAID",paid.get("status"));assertNotNull(paid.get("appointment_id"));assertEquals("DEMO",paid.get("mode"));
        assertEquals(paid,billing.pay(cmd("payDemoBill","another-key"),id(bill)));
        var db=fixture.fixture.fixture.fixture.fixture.db;assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_business.PaymentOrder",Integer.class));assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_business.Appointment",Integer.class));assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_business.Invoice",Integer.class));
        fixture.fixture.fixture.fixture.fixture.context.getBean(AppointmentCancellationService.class).cancel(cmd("cancelAppointment","cancel-paid"),Long.parseLong((String)paid.get("appointment_id")),"患者取消",null);
        var refund=billing.refund(cmd("refundPatientBill","refund"),id(bill),"患者取消");assertEquals("REFUNDED",refund.get("status"));assertEquals(refund,billing.refund(cmd("refundPatientBill","refund2"),id(bill),"患者取消"));assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_business.RefundOrder",Integer.class));
    }
    @Test void expirationClosureSuspensionAndAuthorizationNeverProduceSuccessfulBookings()throws Exception{
        var bill=billing.hold(cmd("createBookingHold","expiry"),input());var db=fixture.fixture.fixture.fixture.fixture.db;
        db.update("UPDATE adc_business.BookingHold SET created_at=DATE_SUB(created_at,INTERVAL 1 HOUR),expires_at=DATE_SUB(expires_at,INTERVAL 1 HOUR)");
        assertEquals("CLOSED",billing.pay(cmd("payDemoBill","expired-pay"),id(bill)).get("status"));assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_business.Appointment",Integer.class));
        var another=billing.hold(cmd("createBookingHold","new"),input());assertEquals("CLOSED",billing.close(cmd("closePatientBill","close"),id(another)).get("status"));
        var stopped=billing.hold(cmd("createBookingHold","stop"),input());db.update("UPDATE adc_business.DentistSchedule SET schedule_status='SUSPENDED' WHERE schedule_id=?",fixture.fixture.schedule);assertEquals("CLOSED",billing.pay(cmd("payDemoBill","stopped-pay"),id(stopped)).get("status"));
        assertThrows(DomainFailure.class,()->billing.get(fixture.fixture.fixture.fixture.fixture.other,"WEB",id(stopped),UUID.randomUUID().toString()));
        assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_business.PaymentOrder",Integer.class));
    }
    @Test void parallelPaymentsAreExactlyOnce()throws Exception{
        var bill=billing.hold(cmd("createBookingHold","race-hold"),input());long id=id(bill);
        try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)){var start=new java.util.concurrent.CountDownLatch(1);var a=pool.submit(()->{start.await();return billing.pay(cmd("payDemoBill","p1"),id);});var b=pool.submit(()->{start.await();return billing.pay(cmd("payDemoBill","p2"),id);});start.countDown();assertEquals(a.get(30,java.util.concurrent.TimeUnit.SECONDS),b.get(30,java.util.concurrent.TimeUnit.SECONDS));}
        var db=fixture.fixture.fixture.fixture.fixture.db;assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_business.PaymentOrder",Integer.class));
        assertThrows(DomainFailure.class,()->billing.refund(cmd("refundPatientBill","uncancelled"),id,"无取消事实"));
    }
    @Test void changedPatientConfirmationClosesHoldAndDoesNotCharge()throws Exception{
        var bill=billing.hold(cmd("createBookingHold","confirmation"),input());var db=fixture.fixture.fixture.fixture.fixture.db;
        db.update("UPDATE adc_business.Patient SET phone='changed' WHERE patient_id=?",bill.get("patient_id"));
        assertEquals("CLOSED",billing.pay(cmd("payDemoBill","changed-pay"),id(bill)).get("status"));
        assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_business.PaymentOrder",Integer.class));
    }
    @Test void paymentAuditFailureRollsBackPaymentBookingAndHoldConversion()throws Exception{
        var bill=billing.hold(cmd("createBookingHold","rollback"),input());var base=fixture.fixture.fixture.fixture.fixture;
        try(var c=base.connection("inspector");var sql=c.createStatement()){sql.execute("REVOKE INSERT ON adc_audit.* FROM 'adc_runtime_role'");try{assertThrows(org.springframework.dao.DataAccessException.class,()->billing.pay(cmd("payDemoBill","rollback-pay"),id(bill)));}finally{sql.execute("GRANT INSERT ON adc_audit.* TO 'adc_runtime_role'");}}
        assertEquals(0,base.db.queryForObject("SELECT COUNT(*) FROM adc_business.PaymentOrder",Integer.class));assertEquals(0,base.db.queryForObject("SELECT COUNT(*) FROM adc_business.Appointment",Integer.class));
        assertEquals("PENDING",billing.get(token,"WECHAT",id(bill),UUID.randomUUID().toString()).get("status"));
    }
    @Test void profileProjectionAndPriceSnapshotUseStoredFacts()throws Exception{
        var db=fixture.fixture.fixture.fixture.fixture.db;db.update("UPDATE adc_business.Dentist SET professional_title='副主任医师',specialty='虚构测试：牙体牙髓',introduction='虚构测试医生简介' WHERE dentist_id=21");
        var candidates=(List<?>)fixture.fixture.booking.candidates(token,"WECHAT",1,List.of(71L),Instant.parse("2026-11-12T01:00:00Z"),Instant.parse("2026-11-12T02:00:00Z"),null,20,UUID.randomUUID().toString()).get("items");var first=(Map<?,?>)candidates.getFirst();assertEquals("副主任医师",first.get("professional_title"));assertFalse(first.containsKey("home_address"));assertFalse(first.containsKey("phone"));
        var bill=billing.hold(cmd("createBookingHold","price"),input());db.update("UPDATE adc_business.RegistrationFeePolicy SET amount_fen=3000");assertEquals(2000L,billing.pay(cmd("payDemoBill","price-pay"),id(bill)).get("amount_fen"));
    }
    @Test void multipleBillsAcrossSchedulesAcquireOneOrderedBusinessLockPlan()throws Exception{
        var paid=billing.hold(cmd("createBookingHold","list-paid"),input());billing.pay(cmd("payDemoBill","list-pay"),id(paid));
        var base=fixture.fixture.fixture.fixture.fixture;long next=fixture.fixture.schedule+1;
        base.db.update("INSERT INTO adc_business.DentistSchedule SELECT ?,dentist_id,clinic_id,'2026-11-13',start_time,end_time,slot_minutes,schedule_status,note,created_at FROM adc_business.DentistSchedule WHERE schedule_id=?",next,fixture.fixture.schedule);
        var old=input();var another=new AppointmentBookingService.Creation(old.clinic(),next,Instant.parse("2026-11-13T01:00:00Z"),old.treatments(),old.allergyReference(),old.patient(),old.verification(),old.details(),old.declaration());
        billing.hold(cmd("createBookingHold","list-pending"),another);
        var page=billing.list(token,"WECHAT",null,20,UUID.randomUUID().toString());assertEquals(2,((List<?>)page.get("items")).size());
    }
    @Test void candidateReadProjectionExcludesActiveHoldAndReleasesExpiredHold()throws Exception{
        var bill=billing.hold(cmd("createBookingHold","read-projection"),input());var base=fixture.fixture.fixture.fixture.fixture;var store=base.context.getBean(AppointmentBookingStore.class);
        var start=Instant.parse("2026-11-12T01:00:00Z");var end=start.plusSeconds(3600);
        assertTrue(store.candidateWindows(21,start,end).stream().anyMatch(w->w.overlaps(start,20)));
        assertTrue(store.occupied(21,start,20));
        base.db.update("UPDATE adc_business.BookingHold SET created_at=?,expires_at=? WHERE hold_id=(SELECT hold_id FROM adc_business.PatientBill WHERE bill_id=?)",StaffAccountsIT.utc(base.now.minusSeconds(300)),StaffAccountsIT.utc(base.now),id(bill));
        assertFalse(store.candidateWindows(21,start,end).stream().anyMatch(w->w.overlaps(start,20)));
        assertFalse(store.occupied(21,start,20));
    }
}
