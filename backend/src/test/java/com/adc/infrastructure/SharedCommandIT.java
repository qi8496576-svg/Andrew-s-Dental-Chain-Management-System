package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.AtomicCommandExecutor;
import com.adc.application.AtomicCommandExecutor.*;
import com.adc.identity.IdentityGate;
import com.adc.application.SharedReadQueries;
import com.adc.application.ReceiptPolicy;
import com.adc.domain.shared.DomainFailure;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.support.TransactionTemplate;

class SharedCommandIT extends MigratedDatabaseTest {
    @Configuration @EnableTransactionManagement static class Transactions { }
    private AnnotationConfigApplicationContext context;
    private JdbcTemplate db;
    private static final Instant NOW=Instant.parse("2026-11-11T00:00:00Z");
    private static final String TOKEN=Base64.getUrlEncoder().withoutPadding().encodeToString(new byte[32]);
    @BeforeEach void services() throws Exception {
        var pool=runtimeDataSource();
        context=new AnnotationConfigApplicationContext();
        context.register(Transactions.class);
        context.registerBean(com.zaxxer.hikari.HikariDataSource.class,()->pool);
        context.registerBean(JdbcTemplate.class,()->new JdbcTemplate(pool));
        context.registerBean(DataSourceTransactionManager.class,()->new DataSourceTransactionManager(pool));
        context.registerBean(Clock.class,()->Clock.fixed(NOW,ZoneOffset.UTC));
        context.registerBean(TransactionLocks.class,()->new TransactionLocks(pool));
        context.registerBean(ReceiptPolicy.class,()->new ReceiptPolicy() {
            public Set<String> operations() { return Set.of("fixture.write"); }
            public void authorize(IdentityGate.Identity identity,String operation,String refs) { authorized(identity); }
        });
        context.register(IdentityGate.class,AuditWriter.class,RequestReceiptStore.class,AuditEventStore.class,AtomicCommandExecutor.class,SharedReadQueries.class);
        context.refresh(); db=context.getBean(JdbcTemplate.class);
        try(var c=connection("inspector");var s=c.createStatement()) {
            s.execute("DELETE FROM adc_identity.RequestReceipt"); s.execute("DELETE FROM adc_audit.AuditEvent");
            s.execute("DELETE FROM adc_identity.GrantCapability"); s.execute("DELETE FROM adc_identity.GrantClinicScope");
            s.execute("DELETE FROM adc_identity.AccessGrant"); s.execute("DELETE FROM adc_identity.Session");
            s.execute("DELETE FROM adc_identity.StaffAccount"); s.execute("DELETE FROM adc_identity.Subject");
            s.execute("DELETE FROM adc_business.Patient"); s.execute("DELETE FROM adc_business.Clinic");
        }
        db.update("INSERT INTO adc_business.Clinic VALUES (1,'FICT-C','Fixture',NULL,'000',NULL,NULL,true,?)",utc(NOW));
        db.update("INSERT INTO adc_identity.Subject VALUES ('staff','STAFF',true,?,NULL)",utc(NOW));
        db.update("INSERT INTO adc_identity.StaffAccount VALUES ('staff','fixture','verified',NULL,'fixture-test-not-login',false,?,'fixture')",utc(NOW));
        db.update("INSERT INTO adc_identity.Session VALUES ('session','staff',?,'WEB',?,?,?, ?,NULL,NULL)",Crypto.sha256(TOKEN),new byte[32],utc(NOW.minusSeconds(60)),utc(NOW.minusSeconds(60)),utc(NOW.plusSeconds(28740)));
        db.update("INSERT INTO adc_identity.AccessGrant VALUES ('grant','staff','HEADQUARTERS','staff',?,NULL,NULL,NULL,'fixture',?)",utc(NOW.minusSeconds(1)),utc(NOW));
        db.update("INSERT INTO adc_identity.GrantClinicScope VALUES ('grant',1)");
        db.update("INSERT INTO adc_identity.GrantCapability VALUES ('grant','resource.write')");
    }
    @AfterEach void closeServices() { if(context!=null)context.close(); }
    static LocalDateTime utc(Instant instant) { return LocalDateTime.ofInstant(instant,ZoneOffset.UTC); }
    private Command command(String key,String body) { return new Command(TOKEN,"WEB","fixture.write",key,Crypto.sha256(body),UUID.randomUUID().toString()); }
    private void authorized(IdentityGate.Identity identity) { context.getBean(IdentityGate.class).requireStaff(identity,"HEADQUARTERS","resource.write",1L); }
    private Result result() { return new Result("[\"patients/88\"]","{}",201,"Patient","88",List.of(1L)); }
    @Test void exactExpiryAndRevocationAreCheckedBeforeActivityRefresh() {
        var tx=new TransactionTemplate(context.getBean(DataSourceTransactionManager.class));
        var gate=context.getBean(IdentityGate.class);
        db.update("UPDATE adc_identity.Session SET last_activity_at=?",utc(NOW.minusSeconds(1800)));
        assertEquals("SESSION_EXPIRED",assertThrows(DomainFailure.class,()->tx.execute(s->gate.authenticate(TOKEN,"WEB"))).code());
        assertEquals(utc(NOW.minusSeconds(1800)),db.queryForObject("SELECT last_activity_at FROM adc_identity.Session",LocalDateTime.class));
        db.update("UPDATE adc_identity.Session SET last_activity_at=?",utc(NOW.minusSeconds(1)));
        tx.executeWithoutResult(s->authorized(gate.authenticate(TOKEN,"WEB")));
        db.update("UPDATE adc_identity.AccessGrant SET revoked_at=?,revoked_by='staff'",utc(NOW));
        assertEquals("ACCESS_DENIED",assertThrows(DomainFailure.class,()->tx.execute(s->{authorized(gate.authenticate(TOKEN,"WEB"));return null;})).code());
    }
    @Test void replayRechecksAuthorizationAndSkipsFirstExecutionPreconditions() throws Exception {
        var executor=context.getBean(AtomicCommandExecutor.class); var calls=new AtomicInteger();
        var first=executor.execute(command("key","original-etag"),this::authorized,id->{calls.incrementAndGet();return result();});
        assertEquals(first,executor.execute(command("key","original-etag"),this::authorized,id->{fail("Replay must skip the already changed ETag");return null;}));
        assertEquals(1,calls.get());
        assertEquals("IDEMPOTENCY_CONTENT_CONFLICT",assertThrows(DomainFailure.class,()->executor.execute(command("key","new-etag"),this::authorized,id->result())).code());
        db.update("UPDATE adc_identity.AccessGrant SET revoked_at=?,revoked_by='staff'",utc(NOW));
        assertEquals("ACCESS_DENIED",assertThrows(DomainFailure.class,()->executor.execute(command("key","original-etag"),this::authorized,id->result())).code());
        assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_identity.RequestReceipt",Integer.class));
    }
    @Test void concurrentSameKeyExecutesOnceAndCheckedFailureLeavesNoSuccess() throws Exception {
        var executor=context.getBean(AtomicCommandExecutor.class); var calls=new AtomicInteger();
        try(var threads=Executors.newFixedThreadPool(2)) {
            var ready=new CountDownLatch(2); var start=new CountDownLatch(1);
            Callable<Result> action=()->{ready.countDown();start.await();return executor.execute(command("parallel","same"),this::authorized,id->{calls.incrementAndGet();return result();});};
            var a=threads.submit(action); var b=threads.submit(action);assertTrue(ready.await(5,TimeUnit.SECONDS));start.countDown();
            assertEquals(a.get(15,TimeUnit.SECONDS),b.get(15,TimeUnit.SECONDS));assertEquals(1,calls.get());
        }
        assertThrows(Exception.class,()->executor.execute(command("failure","same"),this::authorized,id->{
            db.update("INSERT INTO adc_business.Patient VALUES (88,'FICT-88','Fixture','2000-01-01','Fixture','000',NULL,'Fixture','000',?,?,'NOT_REVIEWED')",utc(NOW),utc(NOW));
            throw new Exception("Injected checked failure");
        }));
        assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_business.Patient",Integer.class));
        assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_identity.RequestReceipt WHERE request_key='failure'",Integer.class));
        assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_audit.AuditEvent WHERE action='fixture.write' AND result='SUCCESS'",Integer.class));
        assertTrue(db.queryForObject("SELECT COUNT(*) FROM adc_audit.AuditEvent WHERE result='FAILURE'",Integer.class)>0);
    }
    @Test void auditFailurePreventsBusinessAndReceiptCommit() throws Exception {
        try(var admin=connection("inspector");var s=admin.createStatement()) {
            s.execute("REVOKE INSERT ON adc_audit.* FROM 'adc_runtime_role'");
            try {
                assertThrows(org.springframework.dao.DataAccessException.class,()->context.getBean(AtomicCommandExecutor.class).execute(command("audit-failure","same"),this::authorized,id->{
                    db.update("INSERT INTO adc_business.Patient VALUES (88,'FICT-88','Fixture','2000-01-01','Fixture','000',NULL,'Fixture','000',?,?,'NOT_REVIEWED')",utc(NOW),utc(NOW));
                    return result();
                }));
                assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_business.Patient",Integer.class));
                assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_identity.RequestReceipt",Integer.class));
            } finally { s.execute("GRANT INSERT ON adc_audit.* TO 'adc_runtime_role'"); }
        }
    }
    @Test void receiptLookupRechecksPolicyAndAuditSearchFiltersWholeScopeBeforeReturning() throws Exception {
        var reads=context.getBean(SharedReadQueries.class);
        assertEquals("UNKNOWN",reads.requestResult(TOKEN,"WEB","fixture.write","absent",UUID.randomUUID().toString()).get("status"));
        context.getBean(AtomicCommandExecutor.class).execute(command("done","same"),this::authorized,id->result());
        assertEquals(List.of("patients/88"),reads.requestResult(TOKEN,"WEB","fixture.write","done",UUID.randomUUID().toString()).get("resource_references"));
        assertThrows(DomainFailure.class,()->reads.auditEvents(TOKEN,"WEB",null,null,null,null,null,20,UUID.randomUUID().toString()));
        db.update("INSERT INTO adc_identity.GrantCapability VALUES ('grant','audit.read')");
        db.update("INSERT INTO adc_audit.AuditEvent VALUES (999,'staff','STAFF','fixture.hidden','Patient','hidden',JSON_ARRAY('1','2'),?,'fixture-hidden','SUCCESS',NULL,NULL,NULL)",utc(NOW));
        var page=reads.auditEvents(TOKEN,"WEB",null,null,"fixture.write",null,null,20,UUID.randomUUID().toString());
        var items=(List<?>)page.get("items"); assertEquals(1,items.size());
        assertFalse(page.toString().contains("hidden"));
        assertTrue(db.queryForObject("SELECT COUNT(*) FROM adc_audit.AuditEvent WHERE action='searchAuditEvents'",Integer.class)>0);
        db.update("UPDATE adc_identity.AccessGrant SET revoked_at=?,revoked_by='staff'",utc(NOW));
        assertThrows(DomainFailure.class,()->reads.requestResult(TOKEN,"WEB","fixture.write","done",UUID.randomUUID().toString()));
    }
    @Test void httpTransportRejectsSpoofedOrConflictingCredentialsAndUsesContractErrors() throws Exception {
        var mvc=org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(new com.adc.interfaces.SharedReadController(context.getBean(SharedReadQueries.class)))
            .setControllerAdvice(new com.adc.interfaces.ApiErrors()).build();
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/audit-events").header("X-Role","HEADQUARTERS"))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnauthorized())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.code").value("AUTH_REQUIRED"));
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/audit-events").cookie(new jakarta.servlet.http.Cookie("adc_session",TOKEN)).header("Authorization","Bearer "+TOKEN))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/requests/key").param("operation","fixture.write").cookie(new jakarta.servlet.http.Cookie("adc_session",TOKEN)))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.status").value("UNKNOWN"))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Cache-Control","no-store"));
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/audit-events").param("limit","bad").cookie(new jakarta.servlet.http.Cookie("adc_session",TOKEN)))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.request_id").isString());
    }
    @Test void concurrentRejectionsPersistFailureAuditsWithoutNeedingSparePoolConnections() throws Exception {
        var pool=context.getBean(com.zaxxer.hikari.HikariDataSource.class);pool.setConnectionTimeout(1000);
        var executor=context.getBean(AtomicCommandExecutor.class);
        try(var threads=Executors.newFixedThreadPool(2)) {
            var ready=new CountDownLatch(2);var start=new CountDownLatch(1);
            Callable<Void> reject=()->{
                ready.countDown();start.await();
                assertThrows(DomainFailure.class,()->executor.execute(command(UUID.randomUUID().toString(),"rejected"),identity->{
                    long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(3);
                    while(pool.getHikariPoolMXBean().getActiveConnections()<2 && System.nanoTime()<deadline)java.util.concurrent.locks.LockSupport.parkNanos(TimeUnit.MILLISECONDS.toNanos(10));
                    throw new DomainFailure(403,"ACCESS_DENIED");
                },identity->result()));return null;
            };
            var a=threads.submit(reject);var b=threads.submit(reject);assertTrue(ready.await(3,TimeUnit.SECONDS));start.countDown();a.get(10,TimeUnit.SECONDS);b.get(10,TimeUnit.SECONDS);
        }
        assertEquals(2,db.queryForObject("SELECT COUNT(*) FROM adc_audit.AuditEvent WHERE result='FAILURE'",Integer.class));
    }
}
