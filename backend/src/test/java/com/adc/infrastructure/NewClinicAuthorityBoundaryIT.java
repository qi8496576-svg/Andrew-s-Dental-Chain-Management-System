package com.adc.infrastructure;
import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.domain.organizationresources.ResourceKind;
import com.adc.domain.shared.DomainFailure;
import java.util.*;
import org.junit.jupiter.api.*;

/** Records the existing approved boundary; does not weaken it to make extension appear successful. */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class NewClinicAuthorityBoundaryIT {
    final OrganizationResourcesIT fixture=new OrganizationResourcesIT();
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @BeforeEach void setup()throws Exception{fixture.setup();fixture.fixture.context.register(ClinicGrantStore.class,ClinicGrantService.class);fixture.fixture.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('hq','authorization.manage')");}
    @AfterEach void close(){fixture.close();}
    @Test void creatingAClinicDoesNotInventItsFirstManagementAuthority()throws Exception{var base=fixture.fixture;long clinic=fixture.create(ResourceKind.CLINIC,Map.of("clinic_code","Q09-NEW","postal_address","Owned extension clinic address","phone","000","is_active",true),"new-clinic");assertNotEquals(1,clinic);var grants=base.context.getBean(ClinicGrantService.class);var denied=assertThrows(DomainFailure.class,()->grants.create(fixture.command("createClinicGrant","new-clinic-frontdesk"),new ClinicGrantService.GrantInput("other","RECEPTION",Set.of(clinic),Set.of("createSchedule","listSchedules"),base.now,null)));assertEquals(403,denied.status());assertEquals(0,base.db.queryForObject("SELECT COUNT(*) FROM adc_identity.GrantClinicScope WHERE clinic_id=?",Integer.class,clinic));assertTrue(base.context.getBean(ClinicGrantStore.class).authority("hq").stream().noneMatch(a->a.clinic()==clinic));var record=Map.of("date","2026-11-14","kind","real_mysql_new_clinic_authority_boundary","clinic_created_through_existing_service",Long.toString(clinic),"existing_management_scope",List.of("1"),"normal_grant_attempt_status",denied.status(),"new_scope_rows",0,"q09_ready_for_scheduling",false,"not_a_q09_pass",true);java.nio.file.Files.writeString(SchemaBaselineIT.ROOT.resolve("docs/verification/database/new-clinic-authority-boundary.json"),tools.jackson.databind.json.JsonMapper.builder().build().writerWithDefaultPrettyPrinter().writeValueAsString(record));}
}
