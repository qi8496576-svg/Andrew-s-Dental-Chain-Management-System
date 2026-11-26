package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.application.performance.*;
import com.adc.support.MySqlFixture;
import java.nio.file.*;
import java.sql.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.core.env.MapPropertySource;
import tools.jackson.databind.json.JsonMapper;

/** Actual dump, closed-binlog archive, off-volume transfer and replay into a fresh MySQL. */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class BackupRecoveryIT {
    final QuarterlyPerformanceIT fixture=new QuarterlyPerformanceIT();
    static final Path ROOT=SchemaBaselineIT.ROOT;
    static final JsonMapper JSON=JsonMapper.builder().build();
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @BeforeEach void setup()throws Exception{fixture.setup();}
    @AfterEach void close(){fixture.close();}
    static String run(MySqlFixture database,String...command)throws Exception{var r=database.exec(command);assertEquals(0,r.getExitCode(),r.getStderr()+r.getStdout());return r.getStdout();}
    static void install(MySqlFixture db)throws Exception{
        run(db,"mkdir","-p","/recovery/ops");
        Path binlog=ROOT.resolve("tmp/backup-tools/mysqlbinlog");assertTrue(Files.isRegularFile(binlog),"Prepare matching signed backup tools with tools/verification/Prepare-BackupTools.ps1");
        db.hostFile(binlog,"/usr/local/bin/mysqlbinlog");run(db,"chmod","0755","/usr/local/bin/mysqlbinlog");run(db,"mysqlbinlog","--version");
        for(String file:List.of("full-backup.sh","verify-manifest.sh","archive-binlog.sh","restore-to-position.sh","verify-consistency.sh"))db.hostFile(ROOT.resolve("ops/backup/"+file),"/recovery/ops/"+file);
        db.textFile("/recovery/client.cnf","[client]\nuser=root\npassword="+db.isolatedRootPassword()+"\nhost=127.0.0.1\n");
    }
    static Map<String,String> digests(Connection c)throws Exception{
        var hashes=new TreeMap<String,String>();var tables=new ArrayList<String>();
        try(var s=c.createStatement();var r=s.executeQuery("SELECT CONCAT(TABLE_SCHEMA,'.',TABLE_NAME) FROM information_schema.TABLES WHERE TABLE_SCHEMA IN ('adc_business','adc_identity','adc_audit') ORDER BY TABLE_SCHEMA,TABLE_NAME")){while(r.next())tables.add(r.getString(1));}
        for(String table:tables){var rows=new ArrayList<String>();try(var s=c.createStatement();var r=s.executeQuery("SELECT * FROM "+table)){
            while(r.next()){var row=new ArrayList<Object>();for(int i=1;i<=r.getMetaData().getColumnCount();i++){
                if(table.equals("adc_identity.Session")&&r.getMetaData().getColumnName(i).equals("revoked_at"))continue;
                Object value=r.getObject(i);row.add(value instanceof byte[] b?HexFormat.of().formatHex(b):value==null?null:value.toString());
            }rows.add(JSON.writeValueAsString(row));}
        }Collections.sort(rows);hashes.put(table,HexFormat.of().formatHex(Crypto.sha256(JSON.writeValueAsString(rows))));}
        return hashes;
    }
    @Test void restoresAllThreeSchemasAtOneExactPositionAndPreservesOriginalRequestReplay()throws Exception{
        var base=fixture.base();var source=base.ownedDatabase();install(source);
        assertEquals(1,base.db.queryForObject("SELECT @@log_bin",Integer.class));
        fixture.ready();var calculated=fixture.calculate("recovery-calculate",fixture.prepare());var result=fixture.dentist(calculated,22);
        fixture.publications.publish(fixture.review("recovery-publish"),Long.parseLong((String)result.get("quarterly_performance_id")),new PerformancePublicationService.Publish((String)result.get("input_hash"),"owned recovery fixture review"));
        base.context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("recovery-demo",Map.of("adc.demo-payments.enabled",true,"adc.demo-payments.clinics","FIXTURE")));
        base.db.update("UPDATE adc_business.Clinic SET clinic_code='FIXTURE' WHERE clinic_id=1");
        for(String cap:List.of("billing.read","billing.pay","billing.refund"))base.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('cashier-grant',?)",cap);
        base.context.register(PatientBillingStore.class,PatientBillingService.class);var billing=base.context.getBean(PatientBillingService.class);
        long bill=base.db.queryForObject("SELECT bill_id FROM adc_business.PatientBill",Long.class);
        run(source,"bash","/recovery/ops/full-backup.sh","/recovery/client.cnf","/recovery/full");
        var pay=new AtomicCommandExecutor.Command(fixture.fixture.cashier,"WEB","payDemoBill","recovery-pay",Crypto.sha256("recovery-pay"),UUID.randomUUID().toString());
        assertEquals("PAID",billing.pay(pay,bill).get("status"));
        try(var c=base.connection("inspector");var s=c.createStatement()){s.execute("FLUSH BINARY LOGS");}
        var refund=new AtomicCommandExecutor.Command(fixture.fixture.cashier,"WEB","refundPatientBill","recovery-refund",Crypto.sha256("recovery-refund"),UUID.randomUUID().toString());
        assertEquals("REFUNDED",billing.refund(refund,bill,"owned recovery refund").get("status"));
        var command=fixture.command("recordCostEntry","recovery-original-key");
        var input=new CostEntryService.Create("1","22",null,null,"OPERATING","1.00","2026-09-01T10:00:00+08:00",null,"recovery-extra-source","recovery-owned","owned recovery cost");
        var cost=fixture.costs.create(command,input);
        String log;long position;Map<String,String> expected;
        try(var c=base.connection("inspector");var s=c.createStatement()){
            try(var r=s.executeQuery("SHOW BINARY LOG STATUS")){assertTrue(r.next());log=r.getString(1);position=r.getLong(2);}expected=digests(c);
        }
        Instant targetTime=Instant.now();base.db.update("UPDATE adc_business.Clinic SET manager_name='AFTER-RECOVERY-TARGET' WHERE clinic_id=1");
        run(source,"bash","/recovery/ops/archive-binlog.sh","/recovery/client.cnf","/recovery/full/MANIFEST","/recovery/logs");
        var report=new LinkedHashMap<String,Object>();report.put("source_kind","owned real MySQL fictional service fixture");report.put("cloud_modified",false);report.put("target",log+":"+position);report.put("rpo_seconds",Duration.between(targetTime,Instant.now()).toMillis()/1000.0);
        Path directory=Files.createTempDirectory(ROOT.resolve("tmp"),"recovery-owned-");
        run(source,"tar","-czf","/recovery/backup.tgz","-C","/recovery","full","logs");source.copyFrom("/recovery/backup.tgz",directory.resolve("backup.tgz"));
        Instant began=Instant.now();
        try(var target=MySqlFixture.start()){
            install(target);target.hostFile(directory.resolve("backup.tgz"),"/recovery/backup.tgz");run(target,"tar","-xzf","/recovery/backup.tgz","-C","/recovery");
            var original=source.exec("bash","/recovery/ops/restore-to-position.sh","/recovery/client.cnf","/recovery/full/MANIFEST","/recovery/logs/CHAIN",log,Long.toString(position));assertNotEquals(0,original.getExitCode());assertTrue(original.getStderr().contains("original instance"));
            run(target,"bash","-c","cp /recovery/full/full.sql.gz /recovery/full/saved.gz; printf broken >> /recovery/full/full.sql.gz");
            assertNotEquals(0,target.exec("bash","/recovery/ops/restore-to-position.sh","/recovery/client.cnf","/recovery/full/MANIFEST","/recovery/logs/CHAIN",log,Long.toString(position)).getExitCode());
            run(target,"mv","/recovery/full/saved.gz","/recovery/full/full.sql.gz");
            run(target,"bash","-c","cp /recovery/logs/CHAIN /recovery/logs/GOOD; sed '4d' /recovery/logs/GOOD > /recovery/logs/CHAIN");
            assertNotEquals(0,target.exec("bash","/recovery/ops/restore-to-position.sh","/recovery/client.cnf","/recovery/full/MANIFEST","/recovery/logs/CHAIN",log,Long.toString(position)).getExitCode());
            run(target,"mv","/recovery/logs/GOOD","/recovery/logs/CHAIN");
            String output=run(target,"bash","/recovery/ops/restore-to-position.sh","/recovery/client.cnf","/recovery/full/MANIFEST","/recovery/logs/CHAIN",log,Long.toString(position));assertTrue(output.contains("15 structure and business checks"));
            try(var c=target.administratorConnection();var s=c.createStatement()){
                assertEquals(expected,digests(c),"Every table must match the same desired point; session revoked_at is intentionally changed");
                try(var r=s.executeQuery("SELECT COUNT(*) FROM adc_identity.Session WHERE revoked_at IS NULL")){r.next();assertEquals(0,r.getInt(1));}
                try(var r=s.executeQuery("SELECT COUNT(*) FROM adc_business.Clinic WHERE manager_name='AFTER-RECOVERY-TARGET'")){r.next();assertEquals(0,r.getInt(1));}
                MigratedDatabaseTest.script(c,"ops/compose/mysql/bootstrap.sql");MigratedDatabaseTest.script(c,"ops/compose/mysql/runtime-grants.sql");
                try(var credentials=base.runtimeDataSource()){
                    s.execute("CREATE USER 'adc_runtime'@'%' IDENTIFIED BY '"+credentials.getPassword()+"'");s.execute("GRANT 'adc_runtime_role' TO 'adc_runtime'@'%'");s.execute("SET DEFAULT ROLE 'adc_runtime_role' TO 'adc_runtime'@'%'");
                    var props=new HashMap<String,Object>();props.put("server.port",0);props.put("spring.datasource.url",target.jdbcUrl());props.put("spring.datasource.username","adc_runtime");props.put("spring.datasource.password",credentials.getPassword());props.put("adc.performance.scheduling.enabled",false);
                    try(var app=new SpringApplicationBuilder(com.adc.AdcApplication.class).initializers(ctx->ctx.getEnvironment().getPropertySources().addFirst(new MapPropertySource("owned-restored",props))).run()){
                        var auth=app.getBean(AuthenticationService.class);assertThrows(com.adc.domain.shared.DomainFailure.class,()->auth.me(base.token,"WEB"));
                        var session=auth.staff("hq","fixture-password",null,UUID.randomUUID().toString());
                        var replay=new AtomicCommandExecutor.Command(session.token(),"WEB",command.operation(),command.key(),command.hash(),UUID.randomUUID().toString());
                        assertEquals(cost,app.getBean(CostEntryService.class).create(replay,input));
                    }
                }
            }
            assertNotEquals(0,target.exec("bash","/recovery/ops/restore-to-position.sh","/recovery/client.cnf","/recovery/full/MANIFEST","/recovery/logs/CHAIN",log,Long.toString(position)).getExitCode());
        }
        double rto=Duration.between(began,Instant.now()).toMillis()/1000.0;assertTrue(rto<=14400);assertTrue(((Number)report.get("rpo_seconds")).doubleValue()<=900);
        report.put("rto_seconds",rto);report.put("tables_compared",expected.size());report.put("replay_is_idempotent_after_fresh_login",true);report.put("expired_or_previous_sessions_rejected",true);report.put("corrupt_snapshot_missing_log_original_and_nonempty_target_refused",true);report.put("status","PASS");report.put("archive_sha256",HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(directory.resolve("backup.tgz")))));
        Path evidence=ROOT.resolve("docs/verification/recovery");Files.createDirectories(evidence);Files.writeString(evidence.resolve("q05-local-drill.json"),JSON.writeValueAsString(report)+"\n");
    }
}
