package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.domain.shared.DomainFailure;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class PatientRegistrationIT {
    final AppointmentBookingIT fixture=new AppointmentBookingIT();PatientRegistrationService registration;String token=Crypto.token();
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @BeforeEach void setup()throws Exception{
        fixture.setup();var base=fixture.fixture.fixture.fixture;
        base.context.register(PatientBindingStore.class,PatientRegistrationService.class);registration=base.context.getBean(PatientRegistrationService.class);
        base.db.update("INSERT INTO adc_identity.Subject VALUES ('new-native','PATIENT',true,?,NULL)",StaffAccountsIT.utc(base.now));
        base.db.update("INSERT INTO adc_identity.Session VALUES ('new-session','new-native',?,'WECHAT',NULL,?,?,?,NULL,NULL)",Crypto.sha256(token),StaffAccountsIT.utc(base.now),StaffAccountsIT.utc(base.now),StaffAccountsIT.utc(base.now.plusSeconds(28800)));
    }
    @AfterEach void close()throws Exception{try(var connection=fixture.fixture.fixture.fixture.connection("inspector");var sql=connection.createStatement()){sql.execute("DELETE FROM adc_identity.BindingEvent WHERE new_subject_id='new-native'");sql.execute("DELETE FROM adc_identity.CurrentPatientBinding WHERE subject_id='new-native'");sql.execute("DELETE FROM adc_identity.BindingRequest WHERE applicant_subject_id='new-native'");}finally{fixture.close();}}
    AtomicCommandExecutor.Command command(String operation,String key){return new AtomicCommandExecutor.Command(token,"WECHAT",operation,key,Crypto.sha256(key),UUID.randomUUID().toString());}
    Map<String,Object> details(){var details=new LinkedHashMap<>(fixture.details);details.put("full_name","Self registration fixture");return details;}
    @Test void nativeRegistrationImmediatelyBooksWithoutNumberOrStaffApprovalAndDoesNotFalselyVerifyAllergies()throws Exception{
        assertFalse(((List<?>)fixture.fixture.fixture.resources.catalog(token,"WECHAT",com.adc.domain.organizationresources.ResourceKind.TREATMENT,null,100,UUID.randomUUID().toString()).get("items")).isEmpty());
        assertThrows(DomainFailure.class,()->fixture.fixture.fixture.resources.catalog(token,"WECHAT",com.adc.domain.organizationresources.ResourceKind.DENTIST,null,100,UUID.randomUUID().toString()));
        assertFalse(((List<?>)fixture.booking.candidates(token,"WECHAT",1,List.of(71L),Instant.parse("2026-11-12T01:00:00Z"),Instant.parse("2026-11-12T02:00:00Z"),null,20,UUID.randomUUID().toString()).get("items")).isEmpty());
        var input=details();var command=command("registerSelfPatient","register");var patient=registration.register(command,1,input,"UNSURE","不确定既往过敏情况",true);
        assertEquals(patient,registration.register(command,1,input,"UNSURE","不确定既往过敏情况",true));assertNotNull(patient.get("patient_number"));assertEquals("SELF_DECLARED",patient.get("registration_method"));assertEquals("NOT_REVIEWED",patient.get("allergy_review_status"));assertTrue(((String)patient.get("allergy_confirmation_reference")).startsWith("SD1:"));
        var request=new AppointmentBookingService.Creation(1,fixture.schedule,OffsetDateTime.parse("2026-11-12T09:00:00+08:00").toInstant(),List.of(71L),(String)patient.get("allergy_confirmation_reference"),null,null,input,new AppointmentBookingService.Declaration("NOT_REVIEWED",List.of(),true));
        var booking=fixture.booking.create(command("createAppointment","book"),request);assertEquals("SCHEDULED",booking.get("status"));
        var db=fixture.fixture.fixture.fixture.db;assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_identity.BindingRequest WHERE applicant_subject_id='new-native' AND JSON_EXTRACT(verification_basis,'$.person_confirmed')=true",Integer.class));
        assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_business.PatientAllergy WHERE patient_id=?",Integer.class,patient.get("patient_id")));
        assertEquals(patient.get("patient_id"),fixture.patients.get(token,"WECHAT",Long.parseLong((String)patient.get("patient_id")),UUID.randomUUID().toString()).get("patient_id"));
        assertThrows(DomainFailure.class,()->fixture.patients.get(token,"WECHAT",Long.parseLong((String)fixture.patient.get("patient_id")),UUID.randomUUID().toString()));
        assertThrows(DomainFailure.class,()->registration.register(command("registerSelfPatient","another"),1,input,"UNSURE","不确定",true));
        db.update("DELETE FROM adc_identity.CurrentPatientBinding WHERE subject_id='new-native'");
        assertThrows(DomainFailure.class,()->registration.register(command,1,input,"UNSURE","不确定既往过敏情况",true));
    }
    @Test void concurrentRegistrationCreatesOnlyOnePatientAndBinding()throws Exception{
        var db=fixture.fixture.fixture.fixture.db;int before=db.queryForObject("SELECT COUNT(*) FROM adc_business.Patient",Integer.class);
        try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)){
            var start=new java.util.concurrent.CountDownLatch(1);var futures=new ArrayList<java.util.concurrent.Future<Integer>>();
            for(String key:List.of("first","second"))futures.add(pool.submit(()->{start.await();try{registration.register(command("registerSelfPatient",key),1,details(),"NONE",null,true);return 200;}catch(DomainFailure failure){return failure.status();}}));
            start.countDown();var statuses=new ArrayList<Integer>();for(var future:futures)statuses.add(future.get(30,java.util.concurrent.TimeUnit.SECONDS));Collections.sort(statuses);assertEquals(List.of(200,409),statuses);
        }
        assertEquals(before+1,db.queryForObject("SELECT COUNT(*) FROM adc_business.Patient",Integer.class));assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_identity.CurrentPatientBinding WHERE subject_id='new-native'",Integer.class));assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_identity.BindingRequest WHERE applicant_subject_id='new-native'",Integer.class));
    }
    @Test void existingPatientCannotBeClaimedByGuessingDetailsAndRegistrationRollbackIsAtomic()throws Exception{
        var db=fixture.fixture.fixture.fixture.db;int before=db.queryForObject("SELECT COUNT(*) FROM adc_business.Patient",Integer.class);
        assertThrows(DomainFailure.class,()->registration.register(command("registerSelfPatient","duplicate"),1,fixture.details,"NONE",null,true));
        assertEquals(before,db.queryForObject("SELECT COUNT(*) FROM adc_business.Patient",Integer.class));
        assertThrows(DomainFailure.class,()->registration.register(command("registerSelfPatient","no-consent"),1,details(),"NONE",null,false));
        assertThrows(DomainFailure.class,()->registration.register(command("registerSelfPatient","no-allergy-note"),1,details(),"KNOWN",null,true));
        var staff=fixture.command("registerSelfPatient","staff");assertThrows(DomainFailure.class,()->registration.register(staff,1,details(),"NONE",null,true));
        try(var connection=fixture.fixture.fixture.fixture.connection("inspector");var sql=connection.createStatement()){
            sql.execute("REVOKE INSERT ON adc_audit.* FROM 'adc_runtime_role'");
            try{assertThrows(org.springframework.dao.DataAccessException.class,()->registration.register(command("registerSelfPatient","audit-failure"),1,details(),"NONE",null,true));}finally{sql.execute("GRANT INSERT ON adc_audit.* TO 'adc_runtime_role'");}
        }
        assertEquals(before,db.queryForObject("SELECT COUNT(*) FROM adc_business.Patient",Integer.class));assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_identity.CurrentPatientBinding WHERE subject_id='new-native'",Integer.class));assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_identity.BindingRequest WHERE applicant_subject_id='new-native'",Integer.class));
    }
}
