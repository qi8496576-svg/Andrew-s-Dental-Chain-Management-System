package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.identity.*;
import com.adc.domain.shared.DomainFailure;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

class AuthenticationIT extends MigratedDatabaseTest {
    @Configuration @EnableTransactionManagement static class Transactions { }
    static final Instant NOW=Instant.parse("2026-11-11T00:00:00Z");
    static class TestClock extends Clock {
        volatile Instant now=NOW;
        public ZoneId getZone(){return ZoneOffset.UTC;} public Clock withZone(ZoneId zone){return this;} public Instant instant(){return now;}
    }
    AnnotationConfigApplicationContext context;JdbcTemplate db;TestClock clock;AuthenticationService auth;
    @BeforeEach void setup() throws Exception {
        context=new AnnotationConfigApplicationContext();var pool=runtimeDataSource();clock=new TestClock();
        context.register(Transactions.class);
        context.registerBean(com.zaxxer.hikari.HikariDataSource.class,()->pool);context.registerBean(JdbcTemplate.class,()->new JdbcTemplate(pool));
        context.registerBean(DataSourceTransactionManager.class,()->new DataSourceTransactionManager(pool));context.registerBean(Clock.class,()->clock);
        context.registerBean(AuthSecrets.class,()->new AuthSecrets(Crypto.sha256("isolated-fixture-signing-secret")));
        context.registerBean(TransactionLocks.class,()->new TransactionLocks(pool));
        context.registerBean(WechatCodeExchange.class,()->code->{
            if(code.equals("invalid"))throw new DomainFailure(401,"AUTH_REQUIRED");
            return new WechatCodeExchange.TrustedIdentity("fixture-appid",code.equals("different-case")?"OpenId-A":"openid-a");
        });
        context.register(IdentityGate.class,PasswordHasher.class,AuditWriter.class,RequestReceiptStore.class,AtomicCommandExecutor.class,AuthenticationTransactions.class,AuthenticationService.class);
        context.refresh();db=context.getBean(JdbcTemplate.class);auth=context.getBean(AuthenticationService.class);
        try(var c=connection("inspector");var s=c.createStatement()) {
            for(String table:List.of("RequestReceipt","LoginThrottle","Session","ExternalIdentity","CurrentPatientBinding","StaffAccount","GrantCapability","GrantClinicScope","AccessGrant"))s.execute("DELETE FROM adc_identity.`"+table+"`");
            s.execute("DELETE FROM adc_audit.AuditEvent");s.execute("DELETE FROM adc_identity.Subject");
        }
        db.update("INSERT INTO adc_identity.Subject VALUES ('fixture-staff','STAFF',true,?,NULL)",utc(NOW));
        db.update("INSERT INTO adc_identity.StaffAccount VALUES ('fixture-staff','FixtureUser','verified fixture',NULL,?,false,?,'fixture-reference')",context.getBean(PasswordHasher.class).encode("fixture-password"),utc(NOW));
    }
    @AfterEach void shutdown(){if(context!=null)context.close();}
    static LocalDateTime utc(Instant instant){return LocalDateTime.ofInstant(instant,ZoneOffset.UTC);}
    static String request(){return UUID.randomUUID().toString();}
    @Test void staffSessionUsesHashOnlyAndDoesNotAcquireBusinessPrivileges() {
        var session=auth.staff("FixtureUser","fixture-password",null,request());
        assertTrue(session.token().matches("[A-Za-z0-9_-]{43}"));assertEquals(NOW.plusSeconds(28800),session.expiresAt());
        assertArrayEquals(Crypto.sha256(session.token()),db.queryForObject("SELECT token_hash FROM adc_identity.Session",byte[].class));
        assertArrayEquals(Crypto.sha256(session.csrf()),db.queryForObject("SELECT csrf_secret_hash FROM adc_identity.Session",byte[].class));
        var me=auth.me(session.token(),"WEB");assertEquals(List.of(),me.get("roles"));assertEquals(List.of(),me.get("capabilities"));assertNull(me.get("binding"));
        assertFalse(session.toString().contains(session.token()));assertFalse(session.toString().contains(session.csrf()));
        clock.now=NOW.plusSeconds(1800);
        assertEquals("SESSION_EXPIRED",assertThrows(DomainFailure.class,()->auth.me(session.token(),"WEB")).code());
    }
    @Test void badUnknownAndDisabledAccountsHaveSamePublicFailureAndFifthAttemptCommitsLimit() {
        assertEquals("AUTH_REQUIRED",assertThrows(DomainFailure.class,()->auth.staff("unknown","wrong",null,request())).code());
        assertEquals("AUTH_REQUIRED",assertThrows(DomainFailure.class,()->auth.staff("fixtureuser","fixture-password",null,request())).code());
        for(int attempt=1;attempt<=5;attempt++) {
            var failure=assertThrows(DomainFailure.class,()->auth.staff("FixtureUser","wrong",null,request()));
            assertEquals(attempt<5?401:429,failure.status());
        }
        assertEquals(429,assertThrows(DomainFailure.class,()->auth.staff("FixtureUser","fixture-password",null,request())).status());
        clock.now=NOW.plusSeconds(900);
        var session=auth.staff("FixtureUser","fixture-password",null,request());assertNotNull(session.token());
        db.update("UPDATE adc_identity.Subject SET is_enabled=false,disabled_at=? WHERE subject_id='fixture-staff'",utc(clock.now));
        assertEquals("AUTH_REQUIRED",assertThrows(DomainFailure.class,()->auth.staff("FixtureUser","fixture-password",null,request())).code());
        assertEquals("ACCOUNT_DISABLED",assertThrows(DomainFailure.class,()->auth.me(session.token(),"WEB")).code());
    }
    @Test void concurrentFirstWechatLoginHasOneSubjectAndByteExactExternalIdentity() throws Exception {
        try(var threads=Executors.newFixedThreadPool(2)) {
            var a=threads.submit(()->auth.wechat("code-a","fixture-source",request()));
            var b=threads.submit(()->auth.wechat("code-b","fixture-source",request()));
            var first=a.get(15,TimeUnit.SECONDS);var second=b.get(15,TimeUnit.SECONDS);
            assertEquals(first.subjectId(),second.subjectId());assertNotEquals(first.token(),second.token());
            assertNull(auth.me(first.token(),"WECHAT").get("binding"));
            var different=auth.wechat("different-case","fixture-source",request());assertNotEquals(first.subjectId(),different.subjectId());
            assertEquals(2,db.queryForObject("SELECT COUNT(*) FROM adc_identity.ExternalIdentity",Integer.class));
            db.update("UPDATE adc_identity.Subject SET is_enabled=false,disabled_at=? WHERE subject_id=?",utc(NOW),first.subjectId());
            assertThrows(DomainFailure.class,()->auth.wechat("code-c","fixture-source",request()));
            assertEquals(2,db.queryForObject("SELECT COUNT(*) FROM adc_identity.ExternalIdentity",Integer.class));
        }
    }
    @Test void providerFailureLimitsAnonymousSourceAndLogoutRevokesOldToken() throws Exception {
        for(int attempt=1;attempt<=5;attempt++)assertEquals(attempt<5?401:429,assertThrows(DomainFailure.class,()->auth.wechat("invalid","fixture-source",request())).status());
        assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_identity.Session",Integer.class));
        assertEquals(429,assertThrows(DomainFailure.class,()->auth.wechat("valid","fixture-source",request())).status());
        var session=auth.staff("FixtureUser","fixture-password",null,request());
        auth.logout(session.token(),"WEB","logout-fixture-key",request());
        assertThrows(DomainFailure.class,()->auth.me(session.token(),"WEB"));
        assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_identity.RequestReceipt WHERE operation_id='logout'",Integer.class));
        assertTrue(db.queryForObject("SELECT COUNT(*) FROM adc_audit.AuditEvent WHERE action='logout' AND result='SUCCESS'",Integer.class)>0);
    }
    @Test void failedSessionAuditRollsBackIdentityAndSessionWrites() throws Exception {
        try(var c=connection("inspector");var s=c.createStatement()) {
            s.execute("REVOKE INSERT ON adc_audit.* FROM 'adc_runtime_role'");
            try {
                assertThrows(org.springframework.dao.DataAccessException.class,()->auth.staff("FixtureUser","fixture-password",null,request()));
                assertThrows(org.springframework.dao.DataAccessException.class,()->auth.wechat("valid","fixture-source",request()));
                assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_identity.Session",Integer.class));
                assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_identity.ExternalIdentity",Integer.class));
                assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_identity.LoginThrottle",Integer.class));
                assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_identity.Subject",Integer.class));
            } finally {s.execute("GRANT INSERT ON adc_audit.* TO 'adc_runtime_role'");}
        }
    }
}
