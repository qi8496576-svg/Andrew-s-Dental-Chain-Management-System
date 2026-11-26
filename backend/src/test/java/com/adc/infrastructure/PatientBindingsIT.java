package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.domain.shared.DomainFailure;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class PatientBindingsIT {
    final PatientsIT fixture=new PatientsIT();PatientBindingService bindings;String first=Crypto.token(),second=Crypto.token();Map<String,Object> patient;
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @BeforeEach void setup()throws Exception{
        fixture.setup();var base=fixture.fixture;base.context.register(PatientBindingStore.class,PatientBindingService.class);bindings=base.context.getBean(PatientBindingService.class);
        for(String cap:List.of("listBindingRequests","approvePatientBinding","rebindPatient","revokePatientBinding"))base.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('other',?)",cap);
        nativeSubject("native-a",first);nativeSubject("native-b",second);patient=fixture.create("Binding fixture","patient");
    }
    @AfterEach void close(){fixture.close();}
    void nativeSubject(String subject,String token){var b=fixture.fixture;b.db.update("INSERT INTO adc_identity.Subject VALUES (?,'PATIENT',true,?,NULL)",subject,StaffAccountsIT.utc(b.now));b.db.update("INSERT INTO adc_identity.Session VALUES (?,?,?,'WECHAT',NULL,?,?,?,NULL,NULL)",subject,subject,Crypto.sha256(token),StaffAccountsIT.utc(b.now),StaffAccountsIT.utc(b.now),StaffAccountsIT.utc(b.now.plusSeconds(28800)));}
    AtomicCommandExecutor.Command command(String token,String client,String op,String key){return new AtomicCommandExecutor.Command(token,client,op,key,Crypto.sha256(key),UUID.randomUUID().toString());}
    AtomicCommandExecutor.Command staff(String op,String key){return command(fixture.fixture.other,"WEB",op,key);}
    PatientBindingService.Verification basis(){return new PatientBindingService.Verification(1,true,true,true,"Actual in-person verification fixture");}
    String request(String token,String key)throws Exception{return (String)bindings.request(command(token,"WECHAT","requestPatientBinding",key),(String)patient.get("patient_number"),LocalDate.parse("1990-01-02"),1).get("request_id");}
    long patientId(){return fixture.id(patient);}
    @Test void hintsDoNotAutomaticallyBindAndManualApprovalIsScopedAndIdempotent()throws Exception{
        String request=request(first,"request");assertEquals("PENDING",bindings.list(fixture.fixture.other,"WEB",null,20,UUID.randomUUID().toString()).get("items") instanceof List<?> rows?((Map<?,?>)rows.getFirst()).get("status"):null);
        assertThrows(DomainFailure.class,()->bindings.current(first,"WECHAT",UUID.randomUUID().toString()));
        assertThrows(DomainFailure.class,()->bindings.approve(staff("approvePatientBinding","wrong-basis"),request,patientId(),new PatientBindingService.Verification(1,true,false,true,"fixture"),"fixture"));
        assertThrows(DomainFailure.class,()->bindings.approve(staff("approvePatientBinding","foreign-clinic"),request,patientId(),new PatientBindingService.Verification(2,true,true,true,"fixture"),"fixture"));
        var result=bindings.approve(staff("approvePatientBinding","approve"),request,patientId(),basis(),"本人现场核验");assertEquals("native-a",result.get("subject_id"));assertEquals(result,bindings.approve(staff("approvePatientBinding","approve"),request,patientId(),basis(),"本人现场核验"));
        assertEquals(patient.get("patient_id"),bindings.current(first,"WECHAT",UUID.randomUUID().toString()).get("patient_id"));
        assertThrows(DomainFailure.class,()->request(first,"already-bound"));
        String secondRequest=request(second,"second");assertEquals(409,assertThrows(DomainFailure.class,()->bindings.approve(staff("approvePatientBinding","conflict"),secondRequest,patientId(),basis(),"fixture")).status());
    }
    @Test void rebindImmediatelyRemovesOldSessionAccessAndRevokePreservesHistory()throws Exception{
        String a=request(first,"a");bindings.approve(staff("approvePatientBinding","approve-a"),a,patientId(),basis(),"fixture");String b=request(second,"b");
        bindings.rebind(staff("rebindPatient","rebind"),"native-a","native-b",b,basis(),"本人换号");
        assertThrows(DomainFailure.class,()->fixture.patients.get(first,"WECHAT",patientId(),UUID.randomUUID().toString()));
        assertEquals(patient.get("patient_id"),fixture.patients.get(second,"WECHAT",patientId(),UUID.randomUUID().toString()).get("patient_id"));
        assertThrows(DomainFailure.class,()->bindings.approve(staff("approvePatientBinding","approve-a"),a,patientId(),basis(),"fixture"));
        bindings.revoke(staff("revokePatientBinding","revoke"),"native-b",basis(),"本人申请解绑");bindings.revoke(staff("revokePatientBinding","revoke"),"native-b",basis(),"本人申请解绑");
        assertThrows(DomainFailure.class,()->bindings.current(second,"WECHAT",UUID.randomUUID().toString()));
        assertEquals(3,fixture.fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.BindingEvent",Integer.class));assertEquals(2,fixture.fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.BindingRequest WHERE status='APPROVED'",Integer.class));
    }
    @Test void concurrentApprovalsHaveOnlyOneWinnerEvenWithDifferentApplicantsAndReviewers()throws Exception{
        var db=fixture.fixture.db;db.update("UPDATE adc_identity.AccessGrant SET role_code='RECEPTION' WHERE grant_id='hq'");db.update("INSERT INTO adc_identity.GrantCapability VALUES ('hq','approvePatientBinding')");String a=request(first,"a"),b=request(second,"b");
        try(var pool=Executors.newFixedThreadPool(2)){var start=new CountDownLatch(1);var one=pool.submit(()->{start.await();try{bindings.approve(staff("approvePatientBinding","one"),a,patientId(),basis(),"fixture");return 200;}catch(DomainFailure failure){return failure.status();}});var two=pool.submit(()->{start.await();try{bindings.approve(command(fixture.fixture.token,"WEB","approvePatientBinding","two"),b,patientId(),basis(),"fixture");return 200;}catch(DomainFailure failure){return failure.status();}});start.countDown();var results=new ArrayList<>(List.of(one.get(20,TimeUnit.SECONDS),two.get(20,TimeUnit.SECONDS)));Collections.sort(results);assertEquals(List.of(200,409),results);}
        assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_identity.CurrentPatientBinding",Integer.class));assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_identity.BindingEvent",Integer.class));
    }
    @Test void mismatchedHintsAndAuditFailureLeaveAllRecordsUnchanged()throws Exception{
        String wrong=(String)bindings.request(command(first,"WECHAT","requestPatientBinding","wrong"),"UNKNOWN",LocalDate.parse("1990-01-02"),1).get("request_id");assertThrows(DomainFailure.class,()->bindings.approve(staff("approvePatientBinding","mismatch"),wrong,patientId(),basis(),"fixture"));String right=request(second,"right");
        try(var connection=fixture.fixture.connection("inspector");var sql=connection.createStatement()){sql.execute("REVOKE INSERT ON adc_audit.* FROM 'adc_runtime_role'");try{assertThrows(org.springframework.dao.DataAccessException.class,()->bindings.approve(staff("approvePatientBinding","rollback"),right,patientId(),basis(),"fixture"));}finally{sql.execute("GRANT INSERT ON adc_audit.* TO 'adc_runtime_role'");}}
        assertEquals(0,fixture.fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.CurrentPatientBinding",Integer.class));assertEquals(0,fixture.fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.BindingEvent",Integer.class));assertEquals(2,fixture.fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.BindingRequest WHERE status='PENDING'",Integer.class));
    }
}
