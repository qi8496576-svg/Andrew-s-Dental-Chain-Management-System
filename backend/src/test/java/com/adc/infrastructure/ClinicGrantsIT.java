package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.domain.shared.DomainFailure;
import com.adc.identity.IdentityGate;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.transaction.support.TransactionTemplate;

/** Reuses setup only; none of the older account tests are rerun here. */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ClinicGrantsIT {
    final StaffAccountsIT fixture=new StaffAccountsIT();ClinicGrantService grants;
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @BeforeEach void setup()throws Exception {
        fixture.setup();fixture.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('hq','authorization.manage')");
        fixture.context.register(ClinicGrantStore.class,ClinicGrantService.class);grants=fixture.context.getBean(ClinicGrantService.class);
    }
    @AfterEach void close(){fixture.close();}
    ClinicGrantService.GrantInput input(Set<Long> clinics,Set<String> capabilities,Instant until){return new ClinicGrantService.GrantInput("other","RECEPTION",clinics,capabilities,fixture.now,until);}
    AtomicCommandExecutor.Command command(String operation,String key){return fixture.command(operation,key,key,"other");}
    @Test void grantUsesExistingStaffAndClinicAndRevocationImmediatelyChangesOldSessionRights()throws Exception {
        var command=command("createClinicGrant","grant");var body=input(Set.of(1L),Set.of("createAppointment"),fixture.now.plusSeconds(3600));
        var first=grants.create(command,body);assertEquals(first,grants.create(command,body));assertEquals(List.of("createAppointment"),first.get("capabilities"));String grant=(String)first.get("grant_id");
        var tx=new TransactionTemplate(fixture.context.getBean(org.springframework.jdbc.datasource.DataSourceTransactionManager.class));var gate=fixture.context.getBean(IdentityGate.class);
        tx.executeWithoutResult(status->gate.requireStaff(gate.authenticate(fixture.other,"WEB"),"RECEPTION","createAppointment",1));
        grants.revoke(command("revokeClinicGrant","revoke"),grant,new StaffAccountService.ChangeReason("verified role change","verified fixture"));
        assertThrows(DomainFailure.class,()->tx.executeWithoutResult(status->gate.requireStaff(gate.authenticate(fixture.other,"WEB"),"RECEPTION","createAppointment",1)));
        assertEquals(2,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.StaffAccount",Integer.class));
    }
    @Test void outsideScopeExpiryUnknownCapabilityAndInvalidDentistRoleAreRejected()throws Exception {
        assertEquals(403,assertThrows(DomainFailure.class,()->grants.create(command("createClinicGrant","outside"),input(Set.of(2L),Set.of("createAppointment"),null))).status());
        assertEquals(400,assertThrows(DomainFailure.class,()->grants.create(command("createClinicGrant","unknown"),input(Set.of(1L),Set.of("*"),null))).status());
        fixture.db.update("UPDATE adc_identity.AccessGrant SET valid_until=? WHERE grant_id='hq'",StaffAccountsIT.utc(fixture.now.plusSeconds(600)));
        assertEquals(403,assertThrows(DomainFailure.class,()->grants.create(command("createClinicGrant","expiry"),input(Set.of(1L),Set.of("createAppointment"),fixture.now.plusSeconds(900)))).status());
        assertEquals(422,assertThrows(DomainFailure.class,()->grants.create(command("createClinicGrant","dentist"),new ClinicGrantService.GrantInput("other","DENTIST",Set.of(1L),Set.of("recordAppliedTreatment"),fixture.now,fixture.now.plusSeconds(300)))).status());
        assertEquals(2,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.AccessGrant",Integer.class));
    }
    @Test void selfRevocationCommitsAndCannotBeReplayedWithLostAuthority()throws Exception {
        var command=command("revokeClinicGrant","self-revoke");
        assertEquals(true,grants.revoke(command,"hq",new StaffAccountService.ChangeReason("verified self revocation","fixture")).get("revoked"));
        assertThrows(DomainFailure.class,()->grants.revoke(command,"hq",new StaffAccountService.ChangeReason("verified self revocation","fixture")));
    }
    @Test void approvedSubjectFilterAcceptsUuidAndReturnsOnlyItsGrants()throws Exception {
        String target=(String)fixture.service.create(fixture.command("createStaffAccount","uuid-target","body",null),new StaffAccountService.NewAccount("verified fixture","UUIDTarget",null)).get("subject_id");
        grants.create(command("createClinicGrant","uuid-grant"),new ClinicGrantService.GrantInput(target,"RECEPTION",Set.of(1L),Set.of("createAppointment"),fixture.now,null));
        var mvc=org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(new com.adc.interfaces.ClinicGrantController(grants)).setControllerAdvice(new com.adc.interfaces.ApiErrors()).build();
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/identity/grants").param("subject_id",target).cookie(new jakarta.servlet.http.Cookie("adc_session",fixture.token)))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.items.length()").value(1))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.items[0].subject_id").value(target))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.items[0].capabilities[0]").value("createAppointment"));
    }

    @Test void auditFailureRollsBackGrantChildrenAndRevocation()throws Exception {
        int before=fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.AccessGrant",Integer.class);
        int scopes=fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.GrantClinicScope",Integer.class);
        int capabilities=fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.GrantCapability",Integer.class);
        try(var connection=fixture.connection("inspector");var sql=connection.createStatement()) {
            sql.execute("REVOKE INSERT ON adc_audit.* FROM 'adc_runtime_role'");
            try {
                assertThrows(org.springframework.dao.DataAccessException.class,()->grants.create(command("createClinicGrant","audit-create"),input(Set.of(1L),Set.of("createAppointment"),null)));
                assertThrows(org.springframework.dao.DataAccessException.class,()->grants.revoke(command("revokeClinicGrant","audit-revoke"),"other",new StaffAccountService.ChangeReason("verified change","fixture")));
            } finally {sql.execute("GRANT INSERT ON adc_audit.* TO 'adc_runtime_role'");}
        }
        assertEquals(before,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.AccessGrant",Integer.class));
        assertEquals(scopes,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.GrantClinicScope",Integer.class));
        assertEquals(capabilities,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.GrantCapability",Integer.class));
        assertNull(fixture.db.queryForObject("SELECT revoked_at FROM adc_identity.AccessGrant WHERE grant_id='other'",Object.class));
        assertEquals(0,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.RequestReceipt",Integer.class));
    }

    @Test void concurrentCrossManagerMutationUsesStableSubjectOrderAndCurrentAuthority()throws Exception {
        fixture.db.update("UPDATE adc_identity.AccessGrant SET role_code='HEADQUARTERS' WHERE grant_id='other'");
        fixture.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('other','authorization.manage')");
        var revoke=new AtomicCommandExecutor.Command(fixture.other,"WEB","revokeClinicGrant","cross-revoke",Crypto.sha256("revoke"),UUID.randomUUID().toString());
        try(var threads=java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var start=new java.util.concurrent.CountDownLatch(1);
            var create=threads.submit(()->{start.await();try{return grants.create(command("createClinicGrant","cross-create"),input(Set.of(1L),Set.of("createAppointment"),null));}catch(DomainFailure failure){assertEquals(403,failure.status());return null;}});
            var remove=threads.submit(()->{start.await();return grants.revoke(revoke,"hq",new StaffAccountService.ChangeReason("verified cross manager revocation","fixture"));});
            start.countDown();var created=create.get(15,java.util.concurrent.TimeUnit.SECONDS);assertEquals(true,remove.get(15,java.util.concurrent.TimeUnit.SECONDS).get("revoked"));
            int successful=created==null?1:2;
            assertEquals(successful,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.RequestReceipt",Integer.class));
            assertEquals(created==null?2:3,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.AccessGrant",Integer.class));
            assertThrows(DomainFailure.class,()->grants.create(command("createClinicGrant","after-revoke"),input(Set.of(1L),Set.of("createAppointment"),null)));
        }
    }

    @Test void expiredManagementGrantCannotCreateOrList()throws Exception {
        fixture.db.update("UPDATE adc_identity.AccessGrant SET valid_from=?,valid_until=? WHERE grant_id='hq'",StaffAccountsIT.utc(fixture.now.minusSeconds(3600)),StaffAccountsIT.utc(fixture.now));
        assertEquals(403,assertThrows(DomainFailure.class,()->grants.create(command("createClinicGrant","expired"),input(Set.of(1L),Set.of("createAppointment"),null))).status());
        assertEquals(403,assertThrows(DomainFailure.class,()->grants.list(fixture.token,"WEB",null,null,20,UUID.randomUUID().toString())).status());
        assertEquals(2,fixture.db.queryForObject("SELECT COUNT(*) FROM adc_identity.AccessGrant",Integer.class));
    }
}
