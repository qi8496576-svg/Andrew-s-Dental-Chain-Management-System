package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.domain.organizationresources.ResourceKind;
import com.adc.domain.shared.DomainFailure;
import java.util.*;
import org.junit.jupiter.api.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class OrganizationResourcesIT {
    final StaffAccountsIT fixture=new StaffAccountsIT();ResourceMaintenanceService resources;
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @BeforeEach void setup()throws Exception {
        try(var connection=fixture.connection("inspector");var sql=connection.createStatement()){
            sql.execute("DELETE FROM adc_business.CostEntry WHERE reversal_of_id IS NOT NULL");
            for(String table:List.of("RefundOrder","PaymentOrder","PatientBill","BookingHold","RegistrationFeePolicy","CostEntry","InvoiceItem","Invoice","QuarterlyPerformance","AppliedTreatment","AppointmentRequestedTreatment","AppointmentEvent","Appointment","DentistSchedule","DentistQualification","DentistClinicAssignment","TreatmentQualification","Treatment","Qualification","PatientAllergy","Patient","Allergy","Dentist"))sql.execute("DELETE FROM adc_business.`"+table+"`");
        }
        fixture.setup();fixture.context.register(OrganizationResourceStore.class,BusinessRowLocks.class,ResourceMaintenanceService.class);resources=fixture.context.getBean(ResourceMaintenanceService.class);
        for(String capability:List.of("resource.read","resource.write"))fixture.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('hq',?)",capability);
    }
    @AfterEach void close(){fixture.close();}
    @Test void legitimateReceptionCatalogFallbackDoesNotPoisonTheTransaction()throws Exception{
        fixture.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('other','listSchedules')");
        var catalog=resources.catalog(fixture.other,"WEB",ResourceKind.CLINIC,null,20,UUID.randomUUID().toString());
        assertEquals(1,((List<?>)catalog.get("items")).size());
        assertThrows(DomainFailure.class,()->resources.detail(fixture.other,"WEB",ResourceKind.CLINIC,1,UUID.randomUUID().toString()));
    }
    AtomicCommandExecutor.Command command(String operation,String key){return fixture.command(operation,key,key,null);}
    String etag(Object value){return CanonicalJson.etag(tools.jackson.databind.json.JsonMapper.builder().build().writeValueAsString(value));}
    Map<String,Object> dentist(){return new LinkedHashMap<>(Map.of("employee_number","F-D1","full_name","Fictional Dentist","date_of_birth","1980-01-02","phone","000","hire_date","2020-01-01","is_active",true));}
    long create(ResourceKind kind,Map<String,Object> body,String key)throws Exception{return Long.parseLong((String)resources.create(command("create"+kind.table,key),kind,body).body().get(kind.id));}
    Map<String,Object> detail(ResourceKind kind,long id){return resources.detail(fixture.token,"WEB",kind,id,UUID.randomUUID().toString()).body();}
    long doctor()throws Exception{return create(ResourceKind.DENTIST,dentist(),"doctor");}
    long qualification()throws Exception{return create(ResourceKind.QUALIFICATION,Map.of("qualification_name","Fixture Qualification","is_active",true),"qualification");}
    long treatment()throws Exception{return create(ResourceKind.TREATMENT,Map.of("treatment_code","F-T1","treatment_name","Fixture Treatment","default_unit_price","150.00","is_active",true),"treatment");}
    Map<String,Object> assignment(String end){var input=new LinkedHashMap<String,Object>();input.put("clinic_id","1");input.put("start_date","2020-01-01");input.put("end_date",end);input.put("is_active",true);return input;}
    Map<String,Object> certificate(long qualification,String expiry){var input=new LinkedHashMap<String,Object>();input.put("qualification_id",Long.toString(qualification));input.put("certificate_number","F-CERT");input.put("granted_date","2020-01-01");input.put("expiry_date",expiry);input.put("verification_status","VERIFIED");input.put("verification_reference","verified fictional certificate reference");return input;}
    @Test void catalogMaintenanceUsesOriginalFieldsExactMoneyAndIndependentScopes()throws Exception {
        long dentist=doctor(),qualification=qualification(),treatment=treatment();
        assertEquals("150.00",detail(ResourceKind.TREATMENT,treatment).get("default_unit_price"));
        long allergy=create(ResourceKind.ALLERGY,Map.of("allergy_name","Fixture allergy","description","Catalog only","is_active",true),"allergy");
        var allergyView=detail(ResourceKind.ALLERGY,allergy);assertEquals("Catalog only",allergyView.get("description"));assertFalse(allergyView.containsKey("is_retracted"));
        assertThrows(DomainFailure.class,()->resources.detail(fixture.other,"WEB",ResourceKind.DENTIST,dentist,UUID.randomUUID().toString()));
        assertThrows(DomainFailure.class,()->resources.update(command("updateClinic","outside"),ResourceKind.CLINIC,2,Map.of("phone","999"),"\"x\""));
        assertThrows(DomainFailure.class,()->resources.create(command("createDentist","duplicate-code"),ResourceKind.DENTIST,dentist()));
        assertThrows(DomainFailure.class,()->resources.create(command("createTreatment","float-money"),ResourceKind.TREATMENT,Map.of("treatment_code","F-T2","treatment_name","Bad","default_unit_price",1.25,"is_active",true)));
        var invalid=dentist();invalid.put("termination_date","2019-01-01");invalid.put("employee_number","F-D2");
        assertThrows(DomainFailure.class,()->resources.create(command("createDentist","invalid-dates"),ResourceKind.DENTIST,invalid));
        assertTrue(qualification>0);
    }
    @SuppressWarnings("unchecked") @Test void existingAssignmentIsExplicitAndRelationshipsAreReadableAfterReload()throws Exception {
        long doctor=doctor(),qualification=qualification(),treatment=treatment();
        resources.assignment(command("maintainDentistAssignment","assign"),doctor,assignment(null));
        var row=((List<Map<String,Object>>)detail(ResourceKind.DENTIST,doctor).get("clinic_assignments")).getFirst();
        var shorten=assignment("2026-12-01");shorten.put("assignment_id",row.get("assignment_id"));resources.assignment(command("maintainDentistAssignment","shorten"),doctor,shorten);
        assertEquals(1,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business.DentistClinicAssignment",Integer.class));
        resources.qualification(command("maintainDentistQualification","cert"),doctor,certificate(qualification,null));
        resources.requirements(command("setTreatmentRequirements","requirements"),treatment,List.of(Map.of("qualification_id",Long.toString(qualification),"is_mandatory",true)));
        assertEquals(1,((List<?>)detail(ResourceKind.DENTIST,doctor).get("qualifications")).size());
        assertEquals(true,((List<Map<String,Object>>)detail(ResourceKind.TREATMENT,treatment).get("qualification_requirements")).getFirst().get("is_mandatory"));
        assertThrows(DomainFailure.class,()->resources.qualification(command("maintainDentistQualification","bad-expiry"),doctor,certificate(qualification,"2019-12-31")));
    }
    @SuppressWarnings("unchecked") @Test void shorteningAssignmentShowsActualFutureReferencesWithoutChangingAppointments()throws Exception {
        long doctor=doctor();resources.assignment(command("maintainDentistAssignment","assign"),doctor,assignment(null));
        fixture.db.update("INSERT INTO adc_business.Patient VALUES (1,'F-P1','Fictional Patient','1990-01-01','Fixture','000',NULL,'Fixture','001',?,?,'NOT_REVIEWED')",StaffAccountsIT.utc(fixture.now),StaffAccountsIT.utc(fixture.now));
        fixture.db.update("INSERT INTO adc_business.DentistSchedule VALUES (800,?,1,'2026-11-12','09:00:00','10:00:00',30,'NORMAL',NULL,?)",doctor,StaffAccountsIT.utc(fixture.now));
        fixture.db.update("INSERT INTO adc_business.Appointment (appointment_id,patient_id,clinic_id,dentist_id,schedule_id,scheduled_at,status,created_at,updated_at) VALUES (900,1,1,?,800,'2026-11-12 01:00:00','SCHEDULED',?,?)",doctor,StaffAccountsIT.utc(fixture.now),StaffAccountsIT.utc(fixture.now));
        var row=((List<Map<String,Object>>)detail(ResourceKind.DENTIST,doctor).get("clinic_assignments")).getFirst();var shortEntry=assignment("2026-11-11");shortEntry.put("assignment_id",row.get("assignment_id"));
        var result=resources.assignment(command("maintainDentistAssignment","shorten"),doctor,shortEntry).body();var impacts=(List<Map<String,Object>>)result.get("future_impact");
        assertTrue(impacts.stream().anyMatch(impact->impact.get("object_id").equals("900") && impact.get("object_kind").equals("Appointment")));
        assertTrue(impacts.stream().anyMatch(impact->impact.get("object_id").equals("800") && impact.get("object_kind").equals("DentistSchedule")));
        assertEquals("SCHEDULED",fixture.db.queryForObject("SELECT status FROM adc_business.Appointment WHERE appointment_id=900",String.class));
        assertEquals("NORMAL",fixture.db.queryForObject("SELECT schedule_status FROM adc_business.DentistSchedule WHERE schedule_id=800",String.class));
    }
    @Test void staleVersionAndAuditFailureCannotPartiallyUpdateResources()throws Exception {
        long treatment=treatment();var initial=detail(ResourceKind.TREATMENT,treatment);String version=etag(initial);
        var change=command("updateTreatment","price");resources.update(change,ResourceKind.TREATMENT,treatment,Map.of("default_unit_price","175.25"),version);
        resources.update(change,ResourceKind.TREATMENT,treatment,Map.of("default_unit_price","175.25"),version);
        assertThrows(DomainFailure.class,()->resources.update(command("updateTreatment","stale"),ResourceKind.TREATMENT,treatment,Map.of("default_unit_price","199.00"),version));
        String current=etag(detail(ResourceKind.TREATMENT,treatment));
        try(var connection=fixture.connection("inspector");var sql=connection.createStatement()){
            sql.execute("REVOKE INSERT ON adc_audit.* FROM 'adc_runtime_role'");try{assertThrows(org.springframework.dao.DataAccessException.class,()->resources.update(command("updateTreatment","audit-fail"),ResourceKind.TREATMENT,treatment,Map.of("default_unit_price","199.00"),current));}finally{sql.execute("GRANT INSERT ON adc_audit.* TO 'adc_runtime_role'");}
        }
        assertEquals("175.25",detail(ResourceKind.TREATMENT,treatment).get("default_unit_price"));
    }
    @SuppressWarnings("unchecked") @Test void foreignClinicAssignmentIsNotDisclosedOrMovedThroughAVisibleDentist()throws Exception {
        long doctor=doctor();resources.assignment(command("maintainDentistAssignment","assign"),doctor,assignment(null));
        fixture.db.update("INSERT INTO adc_business.Clinic VALUES (2,'PRIVATE-C2','Fixture',NULL,'000',NULL,NULL,true,?)",StaffAccountsIT.utc(fixture.now));
        fixture.db.update("INSERT INTO adc_business.DentistClinicAssignment VALUES (200,?,2,'2020-01-01',NULL,'outside scope',true)",doctor);
        var visible=(List<Map<String,Object>>)detail(ResourceKind.DENTIST,doctor).get("clinic_assignments");assertEquals(1,visible.size());assertEquals("1",visible.getFirst().get("clinic_id"));
        var forged=assignment(null);forged.put("assignment_id","200");
        assertThrows(DomainFailure.class,()->resources.assignment(command("maintainDentistAssignment","forged"),doctor,forged));
        assertEquals(2,fixture.db.queryForObject("SELECT clinic_id FROM adc_business.DentistClinicAssignment WHERE assignment_id=200",Integer.class));
        var catalog=(List<Map<String,Object>>)resources.catalog(fixture.token,"WEB",ResourceKind.DENTIST,null,20,UUID.randomUUID().toString()).get("items");
        assertEquals(1,catalog.size());assertFalse(catalog.getFirst().containsKey("home_address"));assertFalse(catalog.getFirst().containsKey("date_of_birth"));
    }
    @Test void concurrentDuplicateCodesUseActualUniqueConstraintAndRollbackTheLoser()throws Exception {
        fixture.db.update("UPDATE adc_identity.AccessGrant SET role_code='HEADQUARTERS' WHERE grant_id='other'");fixture.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('other','resource.write')");
        try(var threads=java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var start=new java.util.concurrent.CountDownLatch(1);var input=Map.<String,Object>of("qualification_name","Concurrent fixture","is_active",true);
            var first=threads.submit(()->{start.await();try{resources.create(command("createQualification","race-one"),ResourceKind.QUALIFICATION,input);return 200;}catch(DomainFailure failure){return failure.status();}});
            var second=threads.submit(()->{start.await();try{resources.create(new AtomicCommandExecutor.Command(fixture.other,"WEB","createQualification","race-two",Crypto.sha256("race-two"),UUID.randomUUID().toString()),ResourceKind.QUALIFICATION,input);return 200;}catch(DomainFailure failure){return failure.status();}});
            start.countDown();var statuses=new ArrayList<>(List.of(first.get(15,java.util.concurrent.TimeUnit.SECONDS),second.get(15,java.util.concurrent.TimeUnit.SECONDS)));Collections.sort(statuses);assertEquals(List.of(200,409),statuses);
            assertEquals(1,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business.Qualification",Integer.class));assertEquals(1,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.RequestReceipt",Integer.class));
        }
    }
    @Test void priceChangesNeverRewriteExistingActualTreatmentOrDirectoryReferences()throws Exception {
        long doctor=doctor(),treatment=treatment();resources.assignment(command("maintainDentistAssignment","assign"),doctor,assignment(null));
        fixture.db.update("INSERT INTO adc_business.Patient VALUES (1,'HIST-P1','Fictional Patient','1990-01-01','Fixture','000',NULL,'Fixture','001',?,?,'NOT_REVIEWED')",StaffAccountsIT.utc(fixture.now.minusSeconds(86400)),StaffAccountsIT.utc(fixture.now));
        fixture.db.update("INSERT INTO adc_business.DentistSchedule VALUES (800,?,1,'2026-11-10','09:00:00','10:00:00',30,'NORMAL',NULL,?)",doctor,StaffAccountsIT.utc(fixture.now.minusSeconds(172800)));
        fixture.db.update("INSERT INTO adc_business.Appointment (appointment_id,patient_id,clinic_id,dentist_id,schedule_id,scheduled_at,status,created_at,updated_at,attended_at,completed_at) VALUES (900,1,1,?,800,'2026-11-10 01:00:00','COMPLETED',?,?,'2026-11-10 01:00:00','2026-11-10 01:20:00')",doctor,StaffAccountsIT.utc(fixture.now.minusSeconds(172800)),StaffAccountsIT.utc(fixture.now.minusSeconds(86400)));
        fixture.db.update("INSERT INTO adc_business.AppliedTreatment VALUES (1000,900,?,?,1.00,150.00,150.00,'2026-11-10 01:10:00')",treatment,doctor);
        resources.update(command("updateTreatment","new-price"),ResourceKind.TREATMENT,treatment,Map.of("default_unit_price","199.00","is_active",false),etag(detail(ResourceKind.TREATMENT,treatment)));
        assertEquals("150.00",fixture.db.queryForObject("SELECT CAST(unit_price AS CHAR) FROM adc_business.AppliedTreatment WHERE applied_treatment_id=1000",String.class));
        assertEquals(1,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business.Treatment WHERE treatment_id=?",Integer.class,treatment));
        assertEquals(false,detail(ResourceKind.TREATMENT,treatment).get("is_active"));
    }
    @Test void actualResourceHttpUsesCatalogModelAndExistingClinicScope()throws Exception {
        var mvc=org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(new com.adc.interfaces.ResourceMaintenanceController(resources,fixture.context.getBean(com.adc.identity.AuthSecrets.class))).setControllerAdvice(new com.adc.interfaces.ApiErrors()).build();
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/allergies").cookie(new jakarta.servlet.http.Cookie("adc_session",fixture.token)).header("Idempotency-Key","allergy-http").contentType("application/json").content("{\"allergy_name\":\"HTTP allergy\",\"description\":\"actual catalog\",\"is_active\":true}"))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk()).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.is_active").value(true)).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.description").value("actual catalog")).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.is_retracted").doesNotExist());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/clinics/1").cookie(new jakarta.servlet.http.Cookie("adc_session",fixture.token)))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk()).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().exists("ETag"));
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/allergies").cookie(new jakarta.servlet.http.Cookie("adc_session",fixture.token)).header("Idempotency-Key","allergy-unknown").contentType("application/json").content("{\"allergy_name\":\"Forged\",\"is_active\":true,\"is_retracted\":false}"))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest());
    }
    @SuppressWarnings("unchecked") @Test void qualificationImpactRequiresActualMandatoryValidityAndReplayFiltersCurrentScope()throws Exception {
        long doctor=doctor(),qualification=qualification(),treatment=treatment();
        resources.assignment(command("maintainDentistAssignment","assign"),doctor,assignment(null));
        fixture.db.update("INSERT INTO adc_business.Clinic VALUES (2,'IMPACT-C2','Fixture',NULL,'000',NULL,NULL,true,?)",StaffAccountsIT.utc(fixture.now));
        fixture.db.update("INSERT INTO adc_business.DentistClinicAssignment VALUES (200,?,2,'2020-01-01',NULL,NULL,true)",doctor);
        fixture.db.update("INSERT INTO adc_business.Patient VALUES (1,'IMPACT-P1','Fictional Patient','1990-01-01','Fixture','000',NULL,'Fixture','001',?,?,'NOT_REVIEWED')",StaffAccountsIT.utc(fixture.now),StaffAccountsIT.utc(fixture.now));
        for(int clinic=1;clinic<=2;clinic++) {
            fixture.db.update("INSERT INTO adc_business.DentistSchedule VALUES (?,?,?,'2026-11-12',?,?,30,'NORMAL',NULL,?)",800+clinic,doctor,clinic,clinic==1?"09:00:00":"11:00:00",clinic==1?"10:00:00":"12:00:00",StaffAccountsIT.utc(fixture.now));
            fixture.db.update("INSERT INTO adc_business.Appointment (appointment_id,patient_id,clinic_id,dentist_id,schedule_id,scheduled_at,status,created_at,updated_at) VALUES (?,1,?,?,?,?,'SCHEDULED',?,?)",900+clinic,clinic,doctor,800+clinic,clinic==1?"2026-11-12 01:00:00":"2026-11-12 03:00:00",StaffAccountsIT.utc(fixture.now),StaffAccountsIT.utc(fixture.now));
            fixture.db.update("INSERT INTO adc_business.AppointmentRequestedTreatment VALUES (?,?,NULL)",900+clinic,treatment);
        }
        resources.qualification(command("maintainDentistQualification","verified"),doctor,certificate(qualification,"2027-01-01"));
        var valid=resources.requirements(command("setTreatmentRequirements","required"),treatment,List.of(Map.of("qualification_id",Long.toString(qualification),"is_mandatory",true))).body();assertTrue(((List<?>)valid.get("future_impact")).isEmpty());
        var expire=command("maintainDentistQualification","expire");var expired=certificate(qualification,"2026-11-11");
        var affected=resources.qualification(expire,doctor,expired).body();var impacts=(List<Map<String,Object>>)affected.get("future_impact");assertEquals(1,impacts.size());assertEquals("901",impacts.getFirst().get("object_id"));
        fixture.db.update("DELETE FROM adc_identity.GrantClinicScope WHERE grant_id='hq'");fixture.db.update("INSERT INTO adc_identity.GrantClinicScope VALUES ('hq',2)");
        var replay=resources.qualification(expire,doctor,expired).body();assertTrue(((List<?>)replay.get("future_impact")).isEmpty());
        assertEquals("2",((List<Map<String,Object>>)replay.get("clinic_assignments")).getFirst().get("clinic_id"));
        assertThrows(DomainFailure.class,()->resources.assignment(command("maintainDentistAssignment","assign"),doctor,assignment(null)));
        assertEquals(2,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business.Appointment WHERE status='SCHEDULED'",Integer.class));
    }
    @Test void clinicCreationPersistsExactAreaWithoutImplicitManagementScope()throws Exception {
        var body=Map.<String,Object>of("clinic_code","NEW-C2","postal_address","Fictional second clinic","phone","000-2000","office_area_sqm","125.50","is_active",true);
        var request=command("createClinic","new-clinic");var first=resources.create(request,ResourceKind.CLINIC,body);
        long clinic=Long.parseLong((String)first.body().get("clinic_id"));assertEquals(first.body(),resources.create(request,ResourceKind.CLINIC,body).body());
        assertEquals("125.50",fixture.db.queryForObject("SELECT CAST(office_area_sqm AS CHAR) FROM adc_business.Clinic WHERE clinic_id=?",String.class,clinic));
        assertEquals(0,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.GrantClinicScope WHERE clinic_id=?",Integer.class,clinic));
        assertThrows(DomainFailure.class,()->resources.detail(fixture.token,"WEB",ResourceKind.CLINIC,clinic,UUID.randomUUID().toString()));
        assertEquals(1,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business.Clinic WHERE clinic_code='NEW-C2'",Integer.class));
    }
}
