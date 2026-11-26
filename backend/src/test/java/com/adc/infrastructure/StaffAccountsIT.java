package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.domain.shared.DomainFailure;
import com.adc.identity.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

class StaffAccountsIT extends MigratedDatabaseTest {
    @Configuration @EnableTransactionManagement(proxyTargetClass=true) static class Transactions { }
    AnnotationConfigApplicationContext context;JdbcTemplate db;StaffAccountService service;
    String token=Crypto.token(),other=Crypto.token();final Instant now=Instant.parse("2026-11-11T00:00:00Z");
    Clock testClock=Clock.fixed(now,ZoneOffset.UTC);
    WechatCodeExchange testWechat=code->{throw new DomainFailure(503,"IDENTITY_UNAVAILABLE");};
    @BeforeEach void setup()throws Exception {
        context=new AnnotationConfigApplicationContext();var pool=runtimeDataSource();context.register(Transactions.class);
        context.registerBean(com.zaxxer.hikari.HikariDataSource.class,()->pool);context.registerBean(JdbcTemplate.class,()->new JdbcTemplate(pool));
        context.registerBean(DataSourceTransactionManager.class,()->new DataSourceTransactionManager(pool));context.registerBean(Clock.class,()->testClock);
        context.registerBean(AuthSecrets.class,()->new AuthSecrets(Crypto.sha256("isolated-account-fixture-signing-secret")));context.registerBean(TransactionLocks.class,()->new TransactionLocks(pool));
        context.registerBean(WechatCodeExchange.class,()->testWechat);
        context.register(IdentityGate.class,PasswordHasher.class,AuditWriter.class,RequestReceiptStore.class,AtomicCommandExecutor.class,AuthenticationTransactions.class,AuthenticationService.class,StaffAccountStore.class,StaffAccountService.class);
        context.refresh();db=context.getBean(JdbcTemplate.class);service=context.getBean(StaffAccountService.class);
        try(var c=connection("inspector");var s=c.createStatement()) {
            for(String table:List.of("RequestReceipt","LoginThrottle","Session","ExternalIdentity","StaffAccount","GrantCapability","GrantClinicScope","AccessGrant"))s.execute("DELETE FROM adc_identity.`"+table+"`");
            s.execute("DELETE FROM adc_audit.AuditEvent");s.execute("DELETE FROM adc_identity.Subject");s.execute("DELETE FROM adc_business.Clinic");
        }
        db.update("INSERT INTO adc_business.Clinic VALUES (1,'ACCT-C1','Fixture',NULL,'000',NULL,NULL,true,?)",utc(now));
        for(String id:List.of("hq","other")) {
            db.update("INSERT INTO adc_identity.Subject VALUES (?,'STAFF',true,?,NULL)",id,utc(now));
            db.update("INSERT INTO adc_identity.StaffAccount VALUES (?,?,?,NULL,?,false,?,'fixture')",id,id,"verified "+id,context.getBean(PasswordHasher.class).encode("fixture-password"),utc(now));
            db.update("INSERT INTO adc_identity.Session VALUES (?,?,?,'WEB',?,?,?,?,NULL,NULL)",id,id,Crypto.sha256(id.equals("hq")?token:other),new byte[32],utc(now),utc(now),utc(now.plusSeconds(28800)));
            db.update("INSERT INTO adc_identity.AccessGrant VALUES (?,?,?,?,?,NULL,NULL,NULL,'fixture',?)",id,id,id.equals("hq")?"HEADQUARTERS":"RECEPTION","hq",utc(now),utc(now));
            db.update("INSERT INTO adc_identity.GrantClinicScope VALUES (?,1)",id);db.update("INSERT INTO adc_identity.GrantCapability VALUES (?,'account.manage')",id);
        }
    }
    @AfterEach void close(){if(context!=null)context.close();}
    static LocalDateTime utc(Instant i){return LocalDateTime.ofInstant(i,ZoneOffset.UTC);}
    AtomicCommandExecutor.Command command(String operation,String key,String content,String target) {
        return new AtomicCommandExecutor.Command(token,"WEB",operation,key,Crypto.sha256(content),UUID.randomUUID().toString(),target==null?Set.of():Set.of(target));
    }
    StaffAccountService.NewAccount newAccount(){return new StaffAccountService.NewAccount("verified employee reference","NewUser",null);}
    @Test void creationIsIdempotentHasNoCredentialsOrGrantsAndDoesNotCreateDentist()throws Exception {
        var command=command("createStaffAccount","create-fixture","body",null);
        var first=service.create(command,newAccount());assertEquals(first,service.create(command,newAccount()));
        String subject=(String)first.get("subject_id");
        assertNull(db.queryForObject("SELECT password_hash FROM adc_identity.StaffAccount WHERE subject_id=?",String.class,subject));
        assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_identity.AccessGrant WHERE subject_id=?",Integer.class,subject));
        assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_business.Dentist",Integer.class));
        assertEquals("STATE_CONFLICT",assertThrows(DomainFailure.class,()->service.create(command("createStaffAccount","different","same",null),newAccount())).code());
        assertThrows(DomainFailure.class,()->context.getBean(AuthenticationService.class).staff("NewUser","anything",null,UUID.randomUUID().toString()));
        assertEquals("ACCESS_DENIED",assertThrows(DomainFailure.class,()->service.create(new AtomicCommandExecutor.Command(other,"WEB","createStaffAccount","unauthorized",Crypto.sha256("body"),UUID.randomUUID().toString()),newAccount())).code());
    }
    @Test void verifiedRecoveryAndDisableRevokeOldSessionsWithoutLeakingSecrets()throws Exception {
        String subject=(String)service.create(command("createStaffAccount","create","body",null),newAccount()).get("subject_id");
        var recovery=new StaffAccountService.Recovery("verified-person-and-employee","fixture verified recovery","new-fixture-password");
        service.recover(command("credentialrecoveryStaffAccount","recover","keyed-sensitive-digest",subject),subject,recovery);
        var session=context.getBean(AuthenticationService.class).staff("NewUser","new-fixture-password",null,UUID.randomUUID().toString());
        service.deactivate(command("deactivateStaffAccount","disable","body",subject),subject,new StaffAccountService.ChangeReason("verified departure","verified-reference"));
        assertThrows(DomainFailure.class,()->context.getBean(AuthenticationService.class).me(session.token(),"WEB"));
        service.activate(command("activateStaffAccount","enable","body",subject),subject,new StaffAccountService.ChangeReason("verified return","verified-reference"));
        assertThrows(DomainFailure.class,()->context.getBean(AuthenticationService.class).me(session.token(),"WEB"));
        var receipts=db.queryForList("SELECT response_summary,result_refs FROM adc_identity.RequestReceipt").toString();
        var audits=db.queryForList("SELECT reason,change_summary,verification_reference FROM adc_audit.AuditEvent").toString();
        assertFalse(receipts.contains("new-fixture-password"));assertFalse(audits.contains("new-fixture-password"));assertFalse(receipts.contains("$argon2"));
        assertTrue(audits.contains("verified departure"));assertTrue(audits.contains("verified-reference"));
    }
    @Test void revokedManagerCannotReplayAndAuditFailureRollsBackAccountCreation()throws Exception {
        var command=command("createStaffAccount","create","body",null);service.create(command,newAccount());
        db.update("UPDATE adc_identity.AccessGrant SET revoked_at=?,revoked_by='hq' WHERE grant_id='hq'",utc(now));
        assertThrows(DomainFailure.class,()->service.create(command,newAccount()));
        db.update("UPDATE adc_identity.AccessGrant SET revoked_at=NULL,revoked_by=NULL WHERE grant_id='hq'");
        int before=db.queryForObject("SELECT COUNT(*) FROM adc_identity.Subject",Integer.class);
        try(var c=connection("inspector");var s=c.createStatement()) {
            s.execute("REVOKE INSERT ON adc_audit.* FROM 'adc_runtime_role'");
            try {assertThrows(org.springframework.dao.DataAccessException.class,()->service.create(command("createStaffAccount","failure","other",null),new StaffAccountService.NewAccount("verified","OtherUser",null)));}
            finally{s.execute("GRANT INSERT ON adc_audit.* TO 'adc_runtime_role'");}
        }
        assertEquals(before,db.queryForObject("SELECT COUNT(*) FROM adc_identity.Subject",Integer.class));
    }
    @Test void credentialReceiptUsesKeyedDigestAndDetectsChangedReplacementSecret()throws Exception {
        String subject=(String)service.create(command("createStaffAccount","create","body",null),newAccount()).get("subject_id");
        var mvc=org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(new com.adc.interfaces.StaffAccountController(service,context.getBean(AuthSecrets.class))).setControllerAdvice(new com.adc.interfaces.ApiErrors()).build();
        String path="/api/v1/identity/staff-accounts/"+subject+"/credential-recovery";
        String body="{\"verification_reference\":\"verified\",\"reason\":\"verified recovery\",\"replacement_password\":\"replacement-fixture-A\"}";
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path).cookie(new jakarta.servlet.http.Cookie("adc_session",token)).header("Idempotency-Key","keyed-recovery").contentType("application/json").content(body)).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
        byte[] stored=db.queryForObject("SELECT content_hash FROM adc_identity.RequestReceipt WHERE request_key='keyed-recovery'",byte[].class);
        assertFalse(java.util.Arrays.equals(stored,CanonicalJson.requestHash("POST",path,null,body)));
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path).cookie(new jakarta.servlet.http.Cookie("adc_session",token)).header("Idempotency-Key","keyed-recovery").contentType("application/json").content(body.replace("replacement-fixture-A","replacement-fixture-B"))).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isConflict());
    }
    @Test void twoManagersCannotCreateDuplicateUsernameOrLeaveOrphanSubjects()throws Exception {
        db.update("UPDATE adc_identity.AccessGrant SET role_code='HEADQUARTERS' WHERE grant_id='other'");
        try(var threads=java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var start=new java.util.concurrent.CountDownLatch(1);
            java.util.concurrent.Callable<Object> first=()->{start.await();try{return service.create(command("createStaffAccount","concurrent-a","body",null),newAccount());}catch(DomainFailure failure){return failure.code();}};
            java.util.concurrent.Callable<Object> second=()->{start.await();try{return service.create(new AtomicCommandExecutor.Command(other,"WEB","createStaffAccount","concurrent-b",Crypto.sha256("body"),UUID.randomUUID().toString()),newAccount());}catch(DomainFailure failure){return failure.code();}};
            var a=threads.submit(first);var b=threads.submit(second);start.countDown();var results=List.of(a.get(15,java.util.concurrent.TimeUnit.SECONDS),b.get(15,java.util.concurrent.TimeUnit.SECONDS));
            assertEquals(1,results.stream().filter(Map.class::isInstance).count());assertEquals(1,results.stream().filter("STATE_CONFLICT"::equals).count());
        }
        assertEquals(3,db.queryForObject("SELECT COUNT(*) FROM adc_identity.StaffAccount",Integer.class));
        assertEquals(3,db.queryForObject("SELECT COUNT(*) FROM adc_identity.Subject",Integer.class));
    }
}
