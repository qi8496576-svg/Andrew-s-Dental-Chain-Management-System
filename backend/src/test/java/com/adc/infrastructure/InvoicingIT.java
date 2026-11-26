package com.adc.infrastructure;
import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.domain.shared.DomainFailure;
import java.util.*;
import org.junit.jupiter.api.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class InvoicingIT {
    final ClinicalTreatmentsIT fixture=new ClinicalTreatmentsIT();InvoiceService invoices;String cashier=Crypto.token();
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    StaffAccountsIT base(){return fixture.fixture.base();}
    long appointment(){return fixture.fixture.id;}
    @BeforeEach void setup()throws Exception{
        fixture.setup();base().context.register(InvoiceStore.class,InvoiceService.class);invoices=base().context.getBean(InvoiceService.class);fixture.record("charged",71,"1.50");fixture.record("free",72,"1.00");fixture.clinical.complete(fixture.command("completeAppointment","complete"),appointment());
        var db=base().db;db.update("INSERT INTO adc_identity.Subject VALUES ('cashier-one','STAFF',true,?,NULL)",StaffAccountsIT.utc(base().now));db.update("INSERT INTO adc_identity.StaffAccount SELECT 'cashier-one','cashier-one','Verified cashier fixture',NULL,password_hash,false,credential_changed_at,'fixture' FROM adc_identity.StaffAccount WHERE subject_id='other'");db.update("INSERT INTO adc_identity.Session VALUES ('cashier-session','cashier-one',?,'WEB',?,?,?, ?,NULL,NULL)",Crypto.sha256(cashier),new byte[32],StaffAccountsIT.utc(base().now),StaffAccountsIT.utc(base().now),StaffAccountsIT.utc(base().now.plusSeconds(28800)));db.update("INSERT INTO adc_identity.AccessGrant VALUES ('cashier-grant','cashier-one','CASHIER','hq',?,NULL,NULL,NULL,'fixture',?)",StaffAccountsIT.utc(base().now),StaffAccountsIT.utc(base().now));db.update("INSERT INTO adc_identity.GrantClinicScope VALUES ('cashier-grant',1)");for(String capability:List.of("invoiceAppointment","getInvoice"))db.update("INSERT INTO adc_identity.GrantCapability VALUES ('cashier-grant',?)",capability);
    }
    @AfterEach void close(){fixture.close();}
    AtomicCommandExecutor.Command command(String key){return new AtomicCommandExecutor.Command(cashier,"WEB","invoiceAppointment",key,Crypto.sha256(key),UUID.randomUUID().toString());}
    @SuppressWarnings("unchecked") @Test void uniqueVoucherCopiesHistoricalRowsAndDoesNotRepresentPayment()throws Exception{
        base().db.update("UPDATE adc_business.Treatment SET default_unit_price=99.00 WHERE treatment_id=71");var first=invoices.issue(command("issue"),appointment());assertEquals("15.02",first.get("total_amount"));var items=(List<Map<String,Object>>)first.get("items");assertEquals(2,items.size());assertEquals(Set.of("15.02","0.00"),new HashSet<>(items.stream().map(r->(String)r.get("subtotal")).toList()));assertEquals(first,invoices.issue(command("issue"),appointment()));assertEquals(first,invoices.issue(command("different-request"),appointment()));assertFalse(first.containsKey("payment_status"));assertEquals("INVOICED",base().db.queryForObject("SELECT status FROM adc_business.Appointment WHERE appointment_id=?",String.class,appointment()));assertEquals(1,base().db.queryForObject("SELECT COUNT(*) FROM adc_business.AppointmentEvent WHERE event_type='INVOICE'",Integer.class));base().db.update("UPDATE adc_business.Treatment SET treatment_name='Renamed later',default_unit_price=200.00 WHERE treatment_id=71");assertEquals(first,invoices.get(cashier,"WEB",Long.parseLong((String)first.get("invoice_id")),UUID.randomUUID().toString()));
    }
    @Test void headquartersNeedsExplicitSourceReadAuthorityAndDoctorCannotIssue()throws Exception{
        assertThrows(DomainFailure.class,()->invoices.issue(new AtomicCommandExecutor.Command(fixture.doctorToken,"WEB","invoiceAppointment","doctor",Crypto.sha256("doctor"),UUID.randomUUID().toString()),appointment()));var invoice=invoices.issue(command("issue"),appointment());long id=Long.parseLong((String)invoice.get("invoice_id"));assertThrows(DomainFailure.class,()->invoices.get(base().token,"WEB",id,UUID.randomUUID().toString()));base().db.update("INSERT INTO adc_identity.GrantCapability VALUES ('hq','getInvoice')");assertEquals(invoice,invoices.get(base().token,"WEB",id,UUID.randomUUID().toString()));base().db.update("DELETE FROM adc_identity.GrantClinicScope WHERE grant_id='cashier-grant'");assertThrows(DomainFailure.class,()->invoices.issue(command("issue"),appointment()));
    }
    @Test void concurrentCashiersReceiveOneOriginalInvoiceAndOneSetOfLines()throws Exception{
        var db=base().db;db.update("INSERT INTO adc_identity.AccessGrant VALUES ('cashier-second','other','CASHIER','hq',?,NULL,NULL,NULL,'fixture',?)",StaffAccountsIT.utc(base().now),StaffAccountsIT.utc(base().now));db.update("INSERT INTO adc_identity.GrantClinicScope VALUES ('cashier-second',1)");db.update("INSERT INTO adc_identity.GrantCapability VALUES ('cashier-second','invoiceAppointment')");
        try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)){var start=new java.util.concurrent.CountDownLatch(1);var a=pool.submit(()->{start.await();return invoices.issue(command("one"),appointment());});var b=pool.submit(()->{start.await();return invoices.issue(new AtomicCommandExecutor.Command(base().other,"WEB","invoiceAppointment","two",Crypto.sha256("two"),UUID.randomUUID().toString()),appointment());});start.countDown();assertEquals(a.get(20,java.util.concurrent.TimeUnit.SECONDS),b.get(20,java.util.concurrent.TimeUnit.SECONDS));}assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_business.Invoice",Integer.class));assertEquals(2,db.queryForObject("SELECT COUNT(*) FROM adc_business.InvoiceItem",Integer.class));
    }
    @Test void injectedHeaderSecondLineStatusAndEventFailuresNeverLeaveHalfAnInvoice()throws Exception{
        var failures=List.of("BEFORE INSERT ON adc_business.Invoice FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='owned header failure'","BEFORE INSERT ON adc_business.InvoiceItem FOR EACH ROW BEGIN IF NEW.line_number=2 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='owned line failure'; END IF; END","BEFORE UPDATE ON adc_business.Appointment FOR EACH ROW BEGIN IF NEW.status='INVOICED' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='owned status failure'; END IF; END","BEFORE INSERT ON adc_business.AppointmentEvent FOR EACH ROW BEGIN IF NEW.event_type='INVOICE' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='owned event failure'; END IF; END");int index=0;
        for(String failure:failures){String key="failure-"+index++;try(var connection=base().connection("inspector");var sql=connection.createStatement()){sql.execute("CREATE TRIGGER adc_business.adc_test_invoice_failure "+failure);try{assertThrows(org.springframework.dao.DataAccessException.class,()->invoices.issue(command(key),appointment()));}finally{sql.execute("DROP TRIGGER adc_business.adc_test_invoice_failure");}}assertEquals(0,base().db.queryForObject("SELECT COUNT(*) FROM adc_business.Invoice",Integer.class));assertEquals(0,base().db.queryForObject("SELECT COUNT(*) FROM adc_business.InvoiceItem",Integer.class));assertEquals("COMPLETED",base().db.queryForObject("SELECT status FROM adc_business.Appointment WHERE appointment_id=?",String.class,appointment()));}
        assertNotNull(invoices.issue(command("after-failures"),appointment()).get("invoice_id"));
    }
    long anotherScheduled()throws Exception{var booking=fixture.fixture.fixture;return Long.parseLong((String)booking.booking.create(booking.command("createAppointment","another-case"),booking.input("2026-11-12T09:20:00+08:00")).get("appointment_id"));}
    @Test void scheduledAndCorruptCompletedWithoutActualCareCannotBeInvoiced()throws Exception{
        long other=anotherScheduled();assertThrows(DomainFailure.class,()->invoices.issue(command("scheduled"),other));base().db.update("UPDATE adc_business.Appointment SET status='COMPLETED',attended_at=?,completed_at=? WHERE appointment_id=?",StaffAccountsIT.utc(base().now),StaffAccountsIT.utc(base().now),other);assertThrows(DomainFailure.class,()->invoices.issue(command("historical-missing-care"),other));assertEquals(0,base().db.queryForObject("SELECT COUNT(*) FROM adc_business.Invoice",Integer.class));
    }
    @Test void deliberatelyCorruptCrossVisitSnapshotIsRejectedWithoutCreatingAnotherVoucher()throws Exception{
        long other=anotherScheduled();var now=StaffAccountsIT.utc(base().now);base().db.update("UPDATE adc_business.Appointment SET status='INVOICED',attended_at=?,completed_at=? WHERE appointment_id=?",now,now,other);base().db.update("INSERT INTO adc_business.Invoice VALUES (93,'CORRUPT-OWNED-FIXTURE',?,?,15.02,'ISSUED',?)",other,now,now);long applied=base().db.queryForObject("SELECT applied_treatment_id FROM adc_business.AppliedTreatment WHERE appointment_id=? AND treatment_id=71",Long.class,appointment());base().db.update("INSERT INTO adc_business.InvoiceItem VALUES (94,93,?,1,'Corrupt owned source',1.50,10.01,15.02)",applied);assertThrows(DomainFailure.class,()->invoices.issue(command("reject-cross-source"),appointment()));assertThrows(DomainFailure.class,()->invoices.get(cashier,"WEB",93,UUID.randomUUID().toString()));assertEquals(1,base().db.queryForObject("SELECT COUNT(*) FROM adc_business.Invoice",Integer.class));assertEquals("COMPLETED",base().db.queryForObject("SELECT status FROM adc_business.Appointment WHERE appointment_id=?",String.class,appointment()));
    }
    @Test void auditFailureRollsBackTheWholeVoucher()throws Exception{
        try(var connection=base().connection("inspector");var sql=connection.createStatement()){sql.execute("REVOKE INSERT ON adc_audit.* FROM 'adc_runtime_role'");try{assertThrows(org.springframework.dao.DataAccessException.class,()->invoices.issue(command("audit-rollback"),appointment()));}finally{sql.execute("GRANT INSERT ON adc_audit.* TO 'adc_runtime_role'");}}assertEquals(0,base().db.queryForObject("SELECT COUNT(*) FROM adc_business.Invoice",Integer.class));assertEquals(0,base().db.queryForObject("SELECT COUNT(*) FROM adc_business.InvoiceItem",Integer.class));assertEquals("COMPLETED",base().db.queryForObject("SELECT status FROM adc_business.Appointment WHERE appointment_id=?",String.class,appointment()));
    }
    @Test void corruptFrozenTotalIsRejectedAndTheFailedSensitiveReadIsAudited()throws Exception{
        var invoice=invoices.issue(command("valid"),appointment());long id=Long.parseLong((String)invoice.get("invoice_id"));base().db.update("UPDATE adc_business.Invoice SET total_amount=15.01 WHERE invoice_id=?",id);String request=UUID.randomUUID().toString();assertThrows(DomainFailure.class,()->invoices.get(cashier,"WEB",id,request));assertEquals(1,base().db.queryForObject("SELECT COUNT(*) FROM adc_audit.AuditEvent WHERE action='getInvoice' AND request_id=? AND result='FAILURE'",Integer.class,request));
    }
    @Test void treatmentDemoPaymentAndRefundKeepOriginalInvoiceAndAppointmentFacts()throws Exception{
        var base=base();base.context.getEnvironment().getPropertySources().addFirst(new org.springframework.core.env.MapPropertySource("treatment-demo",Map.of("adc.demo-payments.enabled",true,"adc.demo-payments.clinics","FIXTURE")));
        base.db.update("UPDATE adc_business.Clinic SET clinic_code='FIXTURE' WHERE clinic_id=1");
        for(String cap:List.of("billing.read","billing.pay","billing.refund"))base.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('cashier-grant',?)",cap);
        base.context.register(PatientBillingStore.class,PatientBillingService.class);var billing=base.context.getBean(PatientBillingService.class);
        var original=invoices.issue(command("treatment-invoice"),appointment());
        long bill=base.db.queryForObject("SELECT bill_id FROM adc_business.PatientBill WHERE invoice_id=?",Long.class,original.get("invoice_id"));
        assertEquals("PENDING",billing.get(cashier,"WEB",bill,UUID.randomUUID().toString()).get("status"));
        var pay=new AtomicCommandExecutor.Command(cashier,"WEB","payDemoBill","treatment-pay",Crypto.sha256("treatment-pay"),UUID.randomUUID().toString());
        assertEquals("PAID",billing.pay(pay,bill).get("status"));assertEquals("PAID",billing.pay(pay,bill).get("status"));
        var refund=new AtomicCommandExecutor.Command(cashier,"WEB","refundPatientBill","treatment-refund",Crypto.sha256("treatment-refund"),UUID.randomUUID().toString());
        assertEquals("REFUNDED",billing.refund(refund,bill,"虚构诊疗费用退款验收").get("status"));
        assertEquals(original,invoices.get(cashier,"WEB",Long.parseLong((String)original.get("invoice_id")),UUID.randomUUID().toString()));
        assertEquals("INVOICED",base.db.queryForObject("SELECT status FROM adc_business.Appointment WHERE appointment_id=?",String.class,appointment()));
        assertEquals(1,base.db.queryForObject("SELECT COUNT(*) FROM adc_business.PaymentOrder WHERE bill_id=?",Integer.class,bill));
        assertEquals(1,base.db.queryForObject("SELECT COUNT(*) FROM adc_business.RefundOrder",Integer.class));
    }
}
