package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.domain.organizationresources.ResourceKind;
import com.adc.domain.shared.DomainFailure;
import com.adc.identity.bootstrap.NewClinicManagement;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;

/** Owner-authorized control-plane boundary, on an owned real MySQL database. */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class NewClinicInitializationIT {
    final OrganizationResourcesIT fixture=new OrganizationResourcesIT();long clinic;long readyNanos;
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @BeforeEach void setup()throws Exception{
        fixture.setup();var b=fixture.fixture;
        b.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('hq','authorization.manage')");
        // Existing, verified control-plane SYSTEM from an earlier owned headquarters initialization.
        b.db.update("INSERT INTO adc_identity.Subject VALUES ('operator-system','SYSTEM',true,?,NULL)",StaffAccountsIT.utc(b.now));
        b.db.update("INSERT INTO adc_audit.AuditEvent (audit_id,subject_id,actor_kind,action,object_kind,object_id,clinic_scope,occurred_at,request_id,result) VALUES (?,'operator-system','SYSTEM','bootstrapHeadquarters','StaffAccount','hq','[\"1\"]',?,?,'SUCCESS')",Crypto.id(),StaffAccountsIT.utc(b.now),UUID.randomUUID().toString());
        clinic=fixture.create(ResourceKind.CLINIC,Map.of("clinic_code","FIRST-MGMT","postal_address","Owned new clinic","phone","000","is_active",true),"new-managed-clinic");
        readyNanos=System.nanoTime();b.context.register(ClinicGrantStore.class,ClinicGrantService.class,PatientStore.class,PatientService.class,ScheduleStore.class,ScheduleService.class,AppointmentBookingStore.class,AppointmentBookingService.class);
    }
    @AfterEach void close(){fixture.close();}
    NewClinicManagement.Input input(String key){return new NewClinicManagement.Input(Long.toString(clinic),"hq","verified hq","owner verification reference","owner approval record","verified operator",fixture.fixture.now.plusSeconds(86400).toString(),key);}
    String run(NewClinicManagement.Input input)throws Exception{try(var c=fixture.fixture.connection("runtime")){return NewClinicManagement.initialize(c,input,Clock.fixed(fixture.fixture.now,ZoneOffset.UTC));}}
    @Test void explicitFirstGrantDoesNotModifyAnyExistingGrantAndHasCompleteEvidence()throws Exception{
        var b=fixture.fixture;String before=b.db.queryForObject("SELECT JSON_ARRAYAGG(clinic_id) FROM adc_identity.GrantClinicScope WHERE grant_id='hq'",String.class);
        String grant=run(input("first"));assertEquals(before,b.db.queryForObject("SELECT JSON_ARRAYAGG(clinic_id) FROM adc_identity.GrantClinicScope WHERE grant_id='hq'",String.class));
        assertEquals(Set.of("authorization.manage","resource.read","resource.write"),new HashSet<>(b.db.queryForList("SELECT capability_code FROM adc_identity.GrantCapability WHERE grant_id=?",String.class,grant)));
        assertEquals(List.of(clinic),b.db.queryForList("SELECT clinic_id FROM adc_identity.GrantClinicScope WHERE grant_id=?",Long.class,grant));
        assertEquals("operator-system",b.db.queryForObject("SELECT granted_by FROM adc_identity.AccessGrant WHERE grant_id=?",String.class,grant));
        assertEquals(1,b.db.queryForObject("SELECT COUNT(*) FROM adc_identity.RequestReceipt WHERE operation_id='initializeNewClinicManagement'",Integer.class));
        var audit=b.db.queryForMap("SELECT * FROM adc_audit.AuditEvent WHERE action='initializeNewClinicManagement' AND result='SUCCESS'");assertEquals("SYSTEM",audit.get("actor_kind"));assertEquals("owner approval record",audit.get("verification_reference"));assertTrue(audit.get("change_summary").toString().contains("verified operator"));assertTrue(audit.get("change_summary").toString().contains("owner verification reference"));
    }
    @Test void sameKeyReplaysButOtherContentOrSecondInitializationCannotExpandAuthority()throws Exception{
        var b=fixture.fixture;var first=input("repeat");String grant=run(first);assertEquals(grant,run(first));assertEquals(1,b.db.queryForObject("SELECT COUNT(*) FROM adc_identity.GrantClinicScope WHERE clinic_id=?",Integer.class,clinic));
        assertEquals(409,assertThrows(DomainFailure.class,()->run(input("another-key"))).status());
        var changed=new NewClinicManagement.Input(first.clinic_id(),first.target_subject_id(),first.target_staff_reference(),first.owner_reference(),"another approval",first.operator_reference(),first.valid_until(),first.idempotency_key());assertEquals(409,assertThrows(DomainFailure.class,()->run(changed)).status());
    }
    @Test void missingOwnerVerificationInactiveTargetExpiredValidityAndLegacyClinicAreRejected()throws Exception{
        var b=fixture.fixture;var a=input("invalid");
        assertThrows(IllegalArgumentException.class,()->run(new NewClinicManagement.Input(a.clinic_id(),a.target_subject_id(),a.target_staff_reference(),"",a.verification_reference(),a.operator_reference(),a.valid_until(),a.idempotency_key())));
        assertThrows(IllegalArgumentException.class,()->run(new NewClinicManagement.Input(a.clinic_id(),a.target_subject_id(),a.target_staff_reference(),a.owner_reference(),a.verification_reference(),a.operator_reference(),b.now.toString(),a.idempotency_key())));
        assertThrows(IllegalArgumentException.class,()->run(new NewClinicManagement.Input(a.clinic_id(),a.target_subject_id(),a.target_staff_reference(),a.owner_reference(),a.verification_reference(),a.operator_reference(),null,a.idempotency_key())));
        assertEquals(403,assertThrows(DomainFailure.class,()->run(new NewClinicManagement.Input(a.clinic_id(),"other","verified other",a.owner_reference(),a.verification_reference(),a.operator_reference(),a.valid_until(),a.idempotency_key()))).status());
        assertEquals(403,assertThrows(DomainFailure.class,()->run(new NewClinicManagement.Input(a.clinic_id(),a.target_subject_id(),"wrong employee verification",a.owner_reference(),a.verification_reference(),a.operator_reference(),a.valid_until(),a.idempotency_key()))).status());
        b.db.update("UPDATE adc_identity.Subject SET is_enabled=false WHERE subject_id='hq'");assertEquals(403,assertThrows(DomainFailure.class,()->run(a)).status());b.db.update("UPDATE adc_identity.Subject SET is_enabled=true WHERE subject_id='hq'");
        assertEquals(409,assertThrows(DomainFailure.class,()->run(new NewClinicManagement.Input("1",a.target_subject_id(),a.target_staff_reference(),a.owner_reference(),a.verification_reference(),a.operator_reference(),a.valid_until(),a.idempotency_key()))).status());
        assertEquals(0,b.db.queryForObject("SELECT COUNT(*) FROM adc_identity.GrantClinicScope WHERE clinic_id=?",Integer.class,clinic));
    }
    @Test void revokedOrExpiredInitializationCannotBeReactivatedByReplay()throws Exception{
        var b=fixture.fixture;var a=input("no-reactivate");String grant=run(a);b.context.getBean(ClinicGrantService.class).revoke(fixture.command("revokeClinicGrant","normal-revocation"),grant,new StaffAccountService.ChangeReason("owner withdraws initial authorization","owned revocation evidence"));assertEquals(403,assertThrows(DomainFailure.class,()->run(a)).status());
    }
    @Test void expiredGrantCannotBeReactivatedEvenWithTheOriginalApprovedInput()throws Exception{
        var b=fixture.fixture;var a=input("expired-original");String grant=run(a);try(var c=b.connection("runtime")){assertThrows(IllegalArgumentException.class,()->NewClinicManagement.initialize(c,a,Clock.fixed(b.now.plusSeconds(86401),ZoneOffset.UTC)));}assertEquals(StaffAccountsIT.utc(b.now.plusSeconds(86400)),b.db.queryForObject("SELECT valid_until FROM adc_identity.AccessGrant WHERE grant_id=?",LocalDateTime.class,grant));
    }
    @Test void auditAndReceiptFailuresRollbackTheEntireGrantAndPermitOriginalKeyRetry()throws Exception{
        var b=fixture.fixture;for(String table:List.of("adc_audit.AuditEvent","adc_identity.RequestReceipt")){
            try(var c=b.connection("inspector");var sql=c.createStatement()){
                sql.execute("CREATE TRIGGER "+table.substring(0,table.indexOf('.'))+".reject_initialization BEFORE INSERT ON "+table+" FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='owned failure injection'");
                try{assertThrows(Exception.class,()->run(input("atomic")));}finally{sql.execute("DROP TRIGGER "+table.substring(0,table.indexOf('.'))+".reject_initialization");}
            }
            assertEquals(0,b.db.queryForObject("SELECT COUNT(*) FROM adc_identity.GrantClinicScope WHERE clinic_id=?",Integer.class,clinic));assertEquals(0,b.db.queryForObject("SELECT COUNT(*) FROM adc_identity.RequestReceipt WHERE operation_id='initializeNewClinicManagement'",Integer.class));
        }assertNotNull(run(input("atomic")));
    }
    @Test void concurrentFirstInitializationsAcrossOwnedConnectionsCreateOnlyOneGrant()throws Exception{
        try(var pool=Executors.newFixedThreadPool(2)){var start=new CountDownLatch(1);Callable<Integer> call=()->{start.await();try{run(input(UUID.randomUUID().toString()));return 200;}catch(DomainFailure denial){return denial.status();}};var a=pool.submit(call);var b=pool.submit(call);start.countDown();assertEquals(Set.of(200,409),Set.of(a.get(20,TimeUnit.SECONDS),b.get(20,TimeUnit.SECONDS)));}
        assertEquals(1,fixture.fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.GrantClinicScope WHERE clinic_id=?",Integer.class,clinic));
    }
    AtomicCommandExecutor.Command reception(String operation,String key){return new AtomicCommandExecutor.Command(fixture.fixture.other,"WEB",operation,key,Crypto.sha256(key),UUID.randomUUID().toString());}
    @Test void ownerInitializedNewClinicUsesNormalServicesForQualificationAllergyScheduleAndBooking()throws Exception{
        var b=fixture.fixture;run(input("extension-init"));var grants=b.context.getBean(ClinicGrantService.class);
        grants.create(fixture.command("createClinicGrant","new-clinic-reception"),new ClinicGrantService.GrantInput("other","RECEPTION",Set.of(clinic),Set.of("createPatient","getPatient","addPatientAllergy","reviewPatientAllergies","createSchedule","listSchedules","createAppointment","searchAppointmentCandidates"),b.now,b.now.plusSeconds(3600)));
        long dentist=fixture.doctor(),qualification=fixture.qualification(),treatment=fixture.treatment();var assignment=fixture.assignment(null);assignment.put("clinic_id",Long.toString(clinic));fixture.resources.assignment(fixture.command("maintainDentistAssignment","new-clinic-assignment"),dentist,assignment);fixture.resources.qualification(fixture.command("maintainDentistQualification","new-qualification"),dentist,fixture.certificate(qualification,null));fixture.resources.requirements(fixture.command("setTreatmentRequirements","new-required-qualification"),treatment,List.of(Map.of("qualification_id",Long.toString(qualification),"is_mandatory",true)));
        long allergy=fixture.create(ResourceKind.ALLERGY,Map.of("allergy_name","Extension fictional allergy","is_active",true),"new-allergy");var patients=b.context.getBean(PatientService.class);var details=new LinkedHashMap<String,Object>(Map.of("full_name","Fictional extension patient","date_of_birth","1990-01-02","phone","000","billing_address","Owned test address","emergency_contact_name","Fixture","emergency_contact_phone","000"));var patient=patients.create(reception("createPatient","new-patient"),details,new PatientService.Verification(clinic,true,"in person verified"),false,null);long patientId=Long.parseLong((String)patient.get("patient_id"));var proof=patients.lookup(reception("lookupPatient","verify-new-patient"),(String)patient.get("patient_number"),LocalDate.parse("1990-01-02"),new PatientService.Verification(clinic,true,"verified own patient"));String verification=(String)proof.get("verification_reference");patients.addAllergy(reception("addPatientAllergy","record-new-allergy"),patientId,allergy,"owned fictional severity",null,verification,"patient confirms allergy");patient=patients.review(reception("reviewPatientAllergies","confirm-new-allergy"),patientId,"RECORDED",verification,"all known allergies confirmed");
        var schedules=b.context.getBean(ScheduleService.class);long schedule=Long.parseLong((String)schedules.create(reception("createSchedule","new-clinic-schedule"),new ScheduleService.Creation(dentist,clinic,LocalDate.parse("2026-11-12"),LocalTime.of(9,0),LocalTime.of(10,0),20,null)).get("schedule_id"));var booking=b.context.getBean(AppointmentBookingService.class);var candidates=booking.candidates(b.other,"WEB",clinic,List.of(treatment),Instant.parse("2026-11-12T01:00:00Z"),Instant.parse("2026-11-12T02:00:00Z"),null,20,UUID.randomUUID().toString());assertFalse(((List<?>)candidates.get("items")).isEmpty());
        var booked=booking.create(reception("createAppointment","new-clinic-booking"),new AppointmentBookingService.Creation(clinic,schedule,Instant.parse("2026-11-12T01:00:00Z"),List.of(treatment),(String)patient.get("allergy_confirmation_reference"),patientId,verification,details,new AppointmentBookingService.Declaration("RECORDED",List.of(Map.of("allergy_id",Long.toString(allergy),"severity_note","owned fictional severity")),true)));assertEquals("SCHEDULED",booked.get("status"));assertEquals(Long.toString(clinic),booked.get("clinic_id"));assertEquals(0,b.db.queryForObject("SELECT COUNT(*) FROM adc_business.Invoice",Integer.class));assertEquals(0,b.db.queryForObject("SELECT COUNT(*) FROM adc_business.AppliedTreatment",Integer.class));
        var after=booking.candidates(b.other,"WEB",clinic,List.of(treatment),Instant.parse("2026-11-12T01:00:00Z"),Instant.parse("2026-11-12T02:00:00Z"),null,20,UUID.randomUUID().toString());assertTrue(((List<?>)after.get("items")).stream().noneMatch(row->Instant.parse((String)((Map<?,?>)row).get("starts_at")).equals(Instant.parse("2026-11-12T01:00:00Z"))));
        long elapsed=Duration.ofNanos(System.nanoTime()-readyNanos).toMillis();var evidence=Map.of("date","2026-11-14","kind","real_mysql_authorized_new_clinic_extension","elapsed_from_clinic_ready_to_booked_ms",elapsed,"clinic",Long.toString(clinic),"schedule",Long.toString(schedule),"appointment",booked.get("appointment_id"),"schema_or_business_code_changed",false,"original_scope_still",b.db.queryForList("SELECT clinic_id FROM adc_identity.GrantClinicScope WHERE grant_id='hq'",Long.class),"real_wechat_verified",false);java.nio.file.Files.createDirectories(SchemaBaselineIT.ROOT.resolve("docs/verification/quality"));java.nio.file.Files.writeString(SchemaBaselineIT.ROOT.resolve("docs/verification/quality/q02-q09-extension.json"),tools.jackson.databind.json.JsonMapper.builder().build().writerWithDefaultPrettyPrinter().writeValueAsString(evidence));
    }
}
