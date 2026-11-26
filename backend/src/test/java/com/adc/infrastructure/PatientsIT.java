package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.domain.shared.DomainFailure;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class PatientsIT {
    final StaffAccountsIT fixture=new StaffAccountsIT();PatientService patients;
    static final Set<String> CAPABILITIES=Set.of("createPatient","getPatient","updatePatient","reviewPatientAllergies","addPatientAllergy","listPatientAllergies","correctPatientAllergy","retractPatientAllergy");
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @BeforeEach void setup()throws Exception {
        try(var connection=fixture.connection("inspector");var sql=connection.createStatement()) {
            for(String table:List.of("CurrentPatientBinding","BindingEvent","BindingRequest"))sql.execute("DELETE FROM adc_identity.`"+table+"`");
            for(String table:List.of("PatientAllergy","Patient","Allergy"))sql.execute("DELETE FROM adc_business.`"+table+"`");
        }
        fixture.setup();fixture.context.register(PatientStore.class,PatientService.class,OrganizationResourceService.class);patients=fixture.context.getBean(PatientService.class);
        for(String capability:CAPABILITIES)fixture.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('other',?)",capability);
        fixture.db.update("INSERT INTO adc_business.Allergy VALUES (1,'Fixture allergy',NULL,true)");
    }
    @AfterEach void close(){fixture.close();}
    AtomicCommandExecutor.Command command(String operation,String key){return new AtomicCommandExecutor.Command(fixture.other,"WEB",operation,key,Crypto.sha256(key),UUID.randomUUID().toString());}
    PatientService.Verification verification(){return new PatientService.Verification(1,true,"verified in-person fixture service");}
    Map<String,Object> details(String name){return new LinkedHashMap<>(Map.of("full_name",name,"date_of_birth","1990-01-02","phone","000","billing_address","Fictional address","emergency_contact_name","Fictional contact","emergency_contact_phone","001"));}
    Map<String,Object> create(String name,String key)throws Exception{return patients.create(command("createPatient",key),details(name),verification(),false,null);}
    long id(Map<String,Object> patient){return Long.parseLong((String)patient.get("patient_id"));}
    String etag(Object value){return CanonicalJson.etag(tools.jackson.databind.json.JsonMapper.builder().build().writeValueAsString(value));}
    String verify(Map<String,Object> patient,String key)throws Exception{return (String)patients.lookup(command("lookupPatient",key),(String)patient.get("patient_number"),LocalDate.parse("1990-01-02"),verification()).get("verification_reference");}
    @Test void completeCreationIsIdempotentPhoneIsNotUniqueAndDuplicateNeedsManualReview()throws Exception {
        var first=create("Fictional One","one");assertEquals(first,create("Fictional One","one"));
        var second=create("Fictional Two","two");assertNotEquals(first.get("patient_id"),second.get("patient_id"));
        assertEquals("NOT_REVIEWED",first.get("allergy_review_status"));assertNull(first.get("allergy_confirmation_reference"));
        assertEquals(409,assertThrows(DomainFailure.class,()->create("Fictional One","suspected-duplicate")).status());
        patients.create(command("createPatient","reviewed-duplicate"),details("Fictional One"),verification(),true,"Two distinct people were manually verified");
        var missing=details("Incomplete");missing.remove("phone");assertThrows(DomainFailure.class,()->patients.create(command("createPatient","missing"),missing,verification(),false,null));
        assertEquals(3,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business.Patient",Integer.class));
        assertEquals(0,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business.Patient WHERE email IS NOT NULL",Integer.class));
    }
    @Test void lookupRequiresRealScopeAndMatchingDetailsAndReferencesAreActorObjectBound()throws Exception {
        var patient=create("Fictional Patient","patient");long patientId=id(patient);String proof=verify(patient,"verify");
        assertEquals(patientId,id(patients.get(fixture.other,"WEB",patientId,UUID.randomUUID().toString())));
        assertEquals(404,assertThrows(DomainFailure.class,()->patients.lookup(command("lookupPatient","bad-birthday"),(String)patient.get("patient_number"),LocalDate.parse("1991-01-02"),verification())).status());
        assertThrows(DomainFailure.class,()->patients.lookup(command("lookupPatient","wrong-clinic"),(String)patient.get("patient_number"),LocalDate.parse("1990-01-02"),new PatientService.Verification(2,true,"fixture")));
        assertThrows(DomainFailure.class,()->patients.review(command("reviewPatientAllergies","invented-proof"),patientId,"NO_KNOWN","client-says-verified","fixture"));
        assertEquals("NO_KNOWN",patients.review(command("reviewPatientAllergies","valid-proof"),patientId,"NO_KNOWN",proof,"Asked patient").get("allergy_review_status"));
        var another=create("Another Patient","another");assertThrows(DomainFailure.class,()->patients.review(command("reviewPatientAllergies","other-object"),id(another),"NO_KNOWN",proof,"fixture"));
        assertThrows(DomainFailure.class,()->patients.get(fixture.token,"WEB",patientId,UUID.randomUUID().toString()));
        fixture.db.update("UPDATE adc_identity.AccessGrant SET revoked_at=?,revoked_by='hq' WHERE grant_id='other'",StaffAccountsIT.utc(fixture.now));
        assertThrows(DomainFailure.class,()->patients.get(fixture.other,"WEB",patientId,UUID.randomUUID().toString()));
        assertThrows(DomainFailure.class,()->verify(patient,"verify"));
    }
    @SuppressWarnings("unchecked") @Test void allergyStatesAndCorrectionRetractionKeepEvidenceAndInvalidateOldConfirmation()throws Exception {
        var patient=create("Allergy Patient","patient");long patientId=id(patient);String proof=verify(patient,"verify");
        assertThrows(DomainFailure.class,()->patients.review(command("reviewPatientAllergies","empty-recorded"),patientId,"RECORDED",proof,"fixture"));
        var none=patients.review(command("reviewPatientAllergies","no-known"),patientId,"NO_KNOWN",proof,"Asked patient");assertNotNull(none.get("allergy_confirmation_reference"));
        var recorded=patients.addAllergy(command("addPatientAllergy","add"),patientId,1,"mild","fixture note",proof,"Confirmed allergy");
        assertEquals("RECORDED",recorded.get("allergy_review_status"));assertNotEquals(none.get("allergy_confirmation_reference"),recorded.get("allergy_confirmation_reference"));
        assertThrows(DomainFailure.class,()->patients.review(command("reviewPatientAllergies","cannot-ignore-active"),patientId,"NO_KNOWN",proof,"fixture"));
        var item=((List<Map<String,Object>>)patients.allergies(fixture.other,"WEB",patientId,null,20,UUID.randomUUID().toString()).get("items")).getFirst();
        String oldEtag=(String)item.get("etag");patients.correctAllergy(command("correctPatientAllergy","correct"),patientId,1,Map.of("severity_note","severe"),proof,"Patient corrected severity",oldEtag);
        assertThrows(DomainFailure.class,()->patients.correctAllergy(command("correctPatientAllergy","stale"),patientId,1,Map.of("severity_note","mild"),proof,"fixture",oldEtag));
        item=((List<Map<String,Object>>)patients.allergies(fixture.other,"WEB",patientId,null,20,UUID.randomUUID().toString()).get("items")).getFirst();
        var retracted=patients.retractAllergy(command("retractPatientAllergy","retract"),patientId,1,proof,"Incorrect record verified",(String)item.get("etag"));
        assertEquals("NOT_REVIEWED",retracted.get("allergy_review_status"));assertNull(retracted.get("allergy_confirmation_reference"));
        String history=fixture.db.queryForObject("SELECT audit_history FROM adc_business.PatientAllergy WHERE patient_id=?",String.class,patientId);
        var chain=tools.jackson.databind.json.JsonMapper.builder().build().readTree(history);assertEquals(3,chain.size());assertTrue(history.contains("mild"));assertTrue(history.contains("severe"));assertTrue(history.contains("other"));assertTrue(history.contains(proof));
        assertEquals(1,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business.PatientAllergy WHERE patient_id=? AND is_retracted=true",Integer.class,patientId));
    }
    @Test void minimalReceiptsAndAuditFailureCannotLeavePatientOrPartialEdit()throws Exception {
        var patient=create("Private Fixture Name","patient");long patientId=id(patient);String proof=verify(patient,"verify");
        String receipt=fixture.db.queryForList("SELECT response_summary,result_refs FROM adc_identity.RequestReceipt").toString();assertFalse(receipt.contains("Private Fixture Name"));assertFalse(receipt.contains("Fictional address"));
        try(var connection=fixture.connection("inspector");var sql=connection.createStatement()) {
            sql.execute("REVOKE INSERT ON adc_audit.* FROM 'adc_runtime_role'");
            try {
                assertThrows(org.springframework.dao.DataAccessException.class,()->create("Rollback Patient","rollback-create"));
                assertThrows(org.springframework.dao.DataAccessException.class,()->patients.update(command("updatePatient","rollback-edit"),patientId,Map.of("phone","999"),etag(patient)));
            } finally {sql.execute("GRANT INSERT ON adc_audit.* TO 'adc_runtime_role'");}
        }
        assertEquals(1,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business.Patient",Integer.class));assertEquals("000",fixture.db.queryForObject("SELECT phone FROM adc_business.Patient WHERE patient_id=?",String.class,patientId));
    }
    @Test void concurrentEditsUseRealPatientLockAndEtagRatherThanLostUpdate()throws Exception {
        var patient=create("Concurrent Patient","patient");long patientId=id(patient);verify(patient,"verify");
        fixture.db.update("UPDATE adc_identity.AccessGrant SET role_code='RECEPTION' WHERE grant_id='hq'");for(String capability:CAPABILITIES)fixture.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('hq',?)",capability);
        var otherCommand=new AtomicCommandExecutor.Command(fixture.token,"WEB","lookupPatient","verify-hq",Crypto.sha256("verify-hq"),UUID.randomUUID().toString());
        patients.lookup(otherCommand,(String)patient.get("patient_number"),LocalDate.parse("1990-01-02"),verification());
        String etag=etag(patient);
        try(var threads=java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var start=new java.util.concurrent.CountDownLatch(1);
            var first=threads.submit(()->{start.await();try{patients.update(command("updatePatient","edit-one"),patientId,Map.of("phone","111"),etag);return 200;}catch(DomainFailure failure){return failure.status();}});
            var second=threads.submit(()->{start.await();try{patients.update(new AtomicCommandExecutor.Command(fixture.token,"WEB","updatePatient","edit-two",Crypto.sha256("edit-two"),UUID.randomUUID().toString()),patientId,Map.of("phone","222"),etag);return 200;}catch(DomainFailure failure){return failure.status();}});
            start.countDown();var statuses=new ArrayList<>(List.of(first.get(15,java.util.concurrent.TimeUnit.SECONDS),second.get(15,java.util.concurrent.TimeUnit.SECONDS)));Collections.sort(statuses);assertEquals(List.of(200,412),statuses);
        }
    }
    @Test void nativePatientReadsOnlyItsCurrentBindingAndCannotWriteStaffCommands()throws Exception {
        var patient=create("Bound Patient","bound");var otherPatient=create("Other Patient","other-patient");long patientId=id(patient);String nativeToken=Crypto.token();
        fixture.db.update("INSERT INTO adc_identity.Subject VALUES ('native-patient','PATIENT',true,?,NULL)",StaffAccountsIT.utc(fixture.now));
        fixture.db.update("INSERT INTO adc_identity.Session VALUES ('native-session','native-patient',?,'WECHAT',NULL,?,?,?,NULL,NULL)",Crypto.sha256(nativeToken),StaffAccountsIT.utc(fixture.now),StaffAccountsIT.utc(fixture.now),StaffAccountsIT.utc(fixture.now.plusSeconds(28800)));
        String binding=UUID.randomUUID().toString();
        fixture.db.update("INSERT INTO adc_identity.BindingRequest VALUES (?,'native-patient',?,'1990-01-02',1,?,'APPROVED',?,'other',?,?,'isolated verified fixture')",binding,patient.get("patient_number"),patientId,StaffAccountsIT.utc(fixture.now),StaffAccountsIT.utc(fixture.now),"{\"person_confirmed\":true,\"clinic_id\":\"1\",\"service_basis\":\"isolated fixture\"}");
        fixture.db.update("INSERT INTO adc_identity.CurrentPatientBinding VALUES ('native-patient',?,'other',?,?)",patientId,StaffAccountsIT.utc(fixture.now),binding);
        assertEquals(patient.get("patient_number"),patients.get(nativeToken,"WECHAT",patientId,UUID.randomUUID().toString()).get("patient_number"));
        assertThrows(DomainFailure.class,()->patients.get(nativeToken,"WECHAT",id(otherPatient),UUID.randomUUID().toString()));
        var mutation=new AtomicCommandExecutor.Command(nativeToken,"WECHAT","updatePatient","native-write",Crypto.sha256("native-write"),UUID.randomUUID().toString());
        assertThrows(DomainFailure.class,()->patients.update(mutation,patientId,Map.of("phone","999"),etag(patient)));
        fixture.db.update("DELETE FROM adc_identity.CurrentPatientBinding WHERE subject_id='native-patient'");
        assertThrows(DomainFailure.class,()->patients.get(nativeToken,"WECHAT",patientId,UUID.randomUUID().toString()));
    }
    @Test void creationCapabilityDoesNotImplicitlyRequireOrGrantSeparateReadCapability()throws Exception {
        fixture.db.update("DELETE FROM adc_identity.GrantCapability WHERE grant_id='other' AND capability_code='getPatient'");
        var patient=create("Creation-only fixture","creation-only");assertNotNull(patient.get("patient_id"));
        assertThrows(DomainFailure.class,()->patients.get(fixture.other,"WEB",id(patient),UUID.randomUUID().toString()));
    }
    @Test void patientHttpEnforcesEtagTypedPayloadAndPrivateReceipt()throws Exception {
        var mvc=org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(new com.adc.interfaces.PatientController(patients,fixture.context.getBean(com.adc.identity.AuthSecrets.class))).setControllerAdvice(new com.adc.interfaces.ApiErrors()).build();
        var body=details("HTTP Patient");body.put("verification_basis",Map.of("clinic_id","1","person_confirmed",true,"service_basis","in person fixture"));
        var json=tools.jackson.databind.json.JsonMapper.builder().build();
        var result=mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/patients").cookie(new jakarta.servlet.http.Cookie("adc_session",fixture.other)).header("Idempotency-Key","http-create").contentType("application/json").content(json.writeValueAsString(body)))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk()).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().exists("ETag")).andReturn();
        String patientId=json.readTree(result.getResponse().getContentAsString()).get("patient_id").asText();
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/patients/"+patientId).cookie(new jakarta.servlet.http.Cookie("adc_session",fixture.other)).header("Idempotency-Key","http-no-version").contentType("application/json").content("{\"phone\":\"999\"}"))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/patients/"+patientId).cookie(new jakarta.servlet.http.Cookie("adc_session",fixture.other)).header("Idempotency-Key","http-version").header("If-Match",result.getResponse().getHeader("ETag")).contentType("application/json").content("{\"phone\":\"999\"}"))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk()).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.phone").value("999"));
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/patients/"+patientId).cookie(new jakarta.servlet.http.Cookie("adc_session",fixture.other)).header("Idempotency-Key","http-version").header("If-Match",result.getResponse().getHeader("ETag")).contentType("application/json").content("{\"phone\":\"999\"}"))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/patients/"+patientId).cookie(new jakarta.servlet.http.Cookie("adc_session",fixture.other)).header("Idempotency-Key","http-version").header("If-Match",result.getResponse().getHeader("ETag")).contentType("application/json").content("{\"phone\":\"111\"}"))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isConflict());
    }
    @SuppressWarnings("unchecked") @Test void allergyCatalogIsActualMinimalDataAndInactiveAllergyCannotBeReactivated()throws Exception {
        var resources=fixture.context.getBean(OrganizationResourceService.class);
        var catalog=resources.allergies(fixture.other,"WEB",null,20,UUID.randomUUID().toString());
        var items=(List<Map<String,Object>>)catalog.get("items");assertEquals(List.of(Map.of("id","1","label","Fixture allergy","active",true)),items);
        assertThrows(DomainFailure.class,()->resources.allergies(fixture.token,"WEB",null,20,UUID.randomUUID().toString()));
        var patient=create("Catalog Patient","catalog-patient");String proof=verify(patient,"catalog-verification");long patientId=id(patient);
        patients.addAllergy(command("addPatientAllergy","catalog-add"),patientId,1,null,null,proof,"Confirmed");
        var row=((List<Map<String,Object>>)patients.allergies(fixture.other,"WEB",patientId,null,20,UUID.randomUUID().toString()).get("items")).getFirst();
        patients.retractAllergy(command("retractPatientAllergy","catalog-retract"),patientId,1,proof,"Corrected",(String)row.get("etag"));
        fixture.db.update("UPDATE adc_business.Allergy SET is_active=false WHERE allergy_id=1");
        assertTrue(((List<?>)resources.allergies(fixture.other,"WEB",null,20,UUID.randomUUID().toString()).get("items")).isEmpty());
        assertThrows(DomainFailure.class,()->patients.addAllergy(command("addPatientAllergy","inactive-reactivation"),patientId,1,null,null,proof,"New confirmation"));
    }
}
