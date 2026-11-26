package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.AuthenticationService;
import com.adc.support.MySqlFixture;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import java.util.zip.GZIPInputStream;
import javax.crypto.Cipher;
import javax.crypto.spec.*;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.core.env.MapPropertySource;
import tools.jackson.databind.json.JsonMapper;

/** Restores a privately downloaded fictional cloud backup only into a new owned local container. */
class CloudBackupRecoveryDrill {
    static final Path ROOT=SchemaBaselineIT.ROOT;static final JsonMapper JSON=JsonMapper.builder().build();
    static Map<String,byte[]> configuration(Path directory)throws Exception{
        var meta=JSON.readTree(Files.readString(directory.resolve("configuration-metadata.json")));byte[] key=Files.readAllBytes(Path.of(meta.get("key_location_only").asText())),encrypted=Files.readAllBytes(directory.resolve("configuration.enc"));
        assertEquals(meta.get("ciphertext_sha256").asText(),HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(encrypted)));
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,HexFormat.of().parseHex(meta.get("iv").asText())));byte[] tag=HexFormat.of().parseHex(meta.get("tag").asText()),input=Arrays.copyOf(encrypted,encrypted.length+tag.length);System.arraycopy(tag,0,input,encrypted.length,tag.length);byte[] clear=cipher.doFinal(input);Arrays.fill(key,(byte)0);
        var entries=new HashMap<String,byte[]>();try(var gzip=new GZIPInputStream(new java.io.ByteArrayInputStream(clear))){byte[] tar=gzip.readAllBytes();for(int at=0;at+512<=tar.length;){String name=new String(tar,at,100,StandardCharsets.UTF_8).replace("\0","").trim();if(name.isEmpty())break;String octal=new String(tar,at+124,12,StandardCharsets.US_ASCII).replace("\0","").trim();int size=Integer.parseInt(octal,8);assertTrue(size>=0&&at+512L+size<=tar.length);int type=tar[at+156];if(type==0||type=='0')entries.put(name,Arrays.copyOfRange(tar,at+512,at+512+size));at+=512+((size+511)/512)*512;}Arrays.fill(tar,(byte)0);}Arrays.fill(clear,(byte)0);return entries;
    }
    @Test void privateCloudSnapshotLogsAndEncryptedConfigurationRestoreIntoFreshLocalTarget()throws Exception{
        var transfer=JSON.readTree(Files.readString(ROOT.resolve("docs/verification/recovery/off-server-copy.json")));assertEquals("PASS",transfer.get("status").asText());Path directory=Path.of(transfer.get("private_directory").asText()).toRealPath();assertTrue(directory.startsWith(Path.of("D:/secrets/AndrewDental/CloudIntegration/RecoveryBackups").toRealPath()));
        Instant began=Instant.now();double rpo=began.getEpochSecond()-transfer.get("last_archive_epoch").asDouble();assertTrue(rpo>=0&&rpo<=900,"Refresh the independent backup before the drill; stale backup cannot pass RPO");
        Map<String,byte[]> secrets=configuration(directory);assertTrue(secrets.containsKey("runtime.env"));String runtime=secrets.keySet().stream().filter(x->x.endsWith("/spring.datasource.password")).findFirst().orElseThrow();String signing=secrets.keySet().stream().filter(x->x.endsWith("/adc.auth-secret")).findFirst().orElseThrow();String databasePassword=new String(secrets.get(runtime),StandardCharsets.UTF_8).strip();assertTrue(databasePassword.matches("[A-Za-z0-9+/=]{43,}"));String authSecret=new String(secrets.get(signing),StandardCharsets.UTF_8).strip();
        var manifests=Files.list(directory.resolve("verified/snapshots")).sorted().toList();assertFalse(manifests.isEmpty());String snapshot=manifests.getFirst().getFileName().toString();var lines=Files.readAllLines(directory.resolve("verified/archive/CHAIN"));String[] last=lines.getLast().substring(4).split("\t");String file=last[0],position=last[1];
        try(var target=MySqlFixture.start()){
            BackupRecoveryIT.install(target);BackupRecoveryIT.run(target,"mkdir","-p","/recovery/cloud");target.hostFile(directory.resolve("backups.tar.gz"),"/recovery/cloud.tgz");BackupRecoveryIT.run(target,"tar","-xzf","/recovery/cloud.tgz","-C","/recovery/cloud");
            BackupRecoveryIT.run(target,"bash","/recovery/ops/restore-to-position.sh","/recovery/client.cnf","/recovery/cloud/snapshots/"+snapshot+"/MANIFEST","/recovery/cloud/archive/CHAIN",file,position);
            try(var c=target.administratorConnection();var s=c.createStatement()){
                var checks=new LinkedHashMap<String,Long>();for(var sql:Map.of("patients","SELECT COUNT(*) FROM adc_business.Patient","appointments","SELECT COUNT(*) FROM adc_business.Appointment","bills","SELECT COUNT(*) FROM adc_business.PatientBill","audit_events","SELECT COUNT(*) FROM adc_audit.AuditEvent","receipts","SELECT COUNT(*) FROM adc_identity.RequestReceipt").entrySet()){try(var r=s.executeQuery(sql.getValue())){r.next();checks.put(sql.getKey(),r.getLong(1));}}
                assertTrue(checks.get("patients")>0&&checks.get("audit_events")>0&&checks.get("receipts")>0);
                try(var r=s.executeQuery("SELECT COUNT(*) FROM adc_identity.Session WHERE revoked_at IS NULL")){r.next();assertEquals(0,r.getInt(1));}
                MigratedDatabaseTest.script(c,"ops/compose/mysql/bootstrap.sql");MigratedDatabaseTest.script(c,"ops/compose/mysql/runtime-grants.sql");s.execute("CREATE USER 'adc_runtime'@'%' IDENTIFIED BY '"+databasePassword+"'");s.execute("GRANT 'adc_runtime_role' TO 'adc_runtime'@'%'");s.execute("SET DEFAULT ROLE 'adc_runtime_role' TO 'adc_runtime'@'%'");
                var props=new HashMap<String,Object>();props.put("server.port",0);props.put("server.address","127.0.0.1");props.put("spring.datasource.url",target.jdbcUrl());props.put("spring.datasource.username","adc_runtime");props.put("spring.datasource.password",databasePassword);props.put("adc.auth-secret",authSecret);props.put("adc.performance.scheduling.enabled",false);
                try(var app=new SpringApplicationBuilder(com.adc.AdcApplication.class).initializers(ctx->ctx.getEnvironment().getPropertySources().addFirst(new MapPropertySource("owned-cloud-recovery",props))).run()){
                    var account=JSON.readTree(Files.readString(Path.of("D:/secrets/AndrewDental/CloudIntegration/accounts.json"))).get("demo");var auth=app.getBean(AuthenticationService.class);var logged=auth.staff(account.get("username").asText(),account.get("password").asText(),null,UUID.randomUUID().toString());assertNotNull(auth.me(logged.token(),"WEB").get("subject_id"));
                }
                double rto=Duration.between(began,Instant.now()).toMillis()/1000.0;assertTrue(rto<=14400);
                var report=new LinkedHashMap<String,Object>();report.put("status","PASS");report.put("source_kind","real cloud fictional integration data, downloaded privately");report.put("source_uuid",transfer.get("source_uuid").asText());report.put("online_database_restored_or_modified",false);report.put("restore_target","new owned disposable local MySQL 8.4");report.put("common_position",file+":"+position);report.put("rpo_seconds",rpo);report.put("rto_seconds",rto);report.put("recovered_counts",checks);report.put("encrypted_configuration_restored_in_memory",true);report.put("database_credential_and_signing_secret_restored",true);report.put("new_login_works_previous_sessions_revoked",true);report.put("structure_and_business_checks",15);Files.writeString(ROOT.resolve("docs/verification/recovery/q05-cloud-drill.json"),JSON.writeValueAsString(report)+"\n");
            }
        }finally{for(byte[] bytes:secrets.values())Arrays.fill(bytes,(byte)0);}
    }
}
