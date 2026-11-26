package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.identity.PasswordHasher;
import com.adc.identity.bootstrap.HeadquartersBootstrap;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

class HeadquartersBootstrapIT extends MigratedDatabaseTest {
    @BeforeEach void clearOwnedFixture()throws Exception {
        try(var c=connection("inspector");var s=c.createStatement()) {
            for(String table:java.util.List.of("GrantCapability","GrantClinicScope","AccessGrant","StaffAccount"))s.execute("DELETE FROM adc_identity.`"+table+"`");
            s.execute("DELETE FROM adc_audit.AuditEvent");s.execute("DELETE FROM adc_identity.Subject");s.execute("DELETE FROM adc_business.Clinic");
        }
    }
    @Test void verifiedOperatorInitializesExactlyOnceAndInvalidScopeCreatesNothing()throws Exception {
        var passwords=new PasswordHasher();
        try(var c=connection("runtime");var s=c.createStatement()) {
            var invalid=new HeadquartersBootstrap.Input("verified-admin","verified staff reference","verified operator reference",Set.of("999"),Set.of("account.manage","authorization.manage"),null);
            assertThrows(Exception.class,()->HeadquartersBootstrap.initialize(c,invalid,"fixture-bootstrap-secret",passwords));
            assertEquals(Set.of("0"),SchemaBaselineIT.query(c,"SELECT COUNT(*) FROM adc_identity.Subject"));
            s.executeUpdate("INSERT INTO adc_business.Clinic VALUES (1,'BOOT-C1','Fixture',NULL,'000',NULL,NULL,true,UTC_TIMESTAMP())");
            var input=new HeadquartersBootstrap.Input("verified-admin","verified staff reference","verified operator reference",Set.of("1"),Set.of("account.manage","authorization.manage"),null);
            String subject=HeadquartersBootstrap.initialize(c,input,"fixture-bootstrap-secret",passwords);
            assertEquals(Set.of("1"),SchemaBaselineIT.query(c,"SELECT COUNT(*) FROM adc_identity.StaffAccount"));
            assertEquals(Set.of("HEADQUARTERS"),SchemaBaselineIT.query(c,"SELECT role_code FROM adc_identity.AccessGrant"));
            assertEquals(Set.of("0"),SchemaBaselineIT.query(c,"SELECT COUNT(*) FROM adc_business.Dentist"));
            assertEquals(Set.of("verified operator reference"),SchemaBaselineIT.query(c,"SELECT verification_reference FROM adc_audit.AuditEvent WHERE action='bootstrapHeadquarters'"));
            try(var statement=c.prepareStatement("SELECT password_hash FROM adc_identity.StaffAccount WHERE subject_id=?")){statement.setString(1,subject);try(var result=statement.executeQuery()){assertTrue(result.next());assertTrue(passwords.matches("fixture-bootstrap-secret",result.getString(1)));}}
            assertThrows(IllegalStateException.class,()->HeadquartersBootstrap.initialize(c,input,"other-fixture-secret",passwords));
            assertEquals(Set.of("1"),SchemaBaselineIT.query(c,"SELECT COUNT(*) FROM adc_identity.StaffAccount"));
        }
    }
    @Test void packagedCommandReadsSecretFilesWithoutPrintingThem()throws Exception {
        var root=SchemaBaselineIT.ROOT;var temporary=java.nio.file.Files.createTempDirectory(root.resolve("tmp/build-temp"),"bootstrap-command-");
        var dbSecret=temporary.resolve("db.secret");var accountSecret=temporary.resolve("account.secret");var metadata=temporary.resolve("input.json");
        String password=Crypto.token();
        try(var credentials=runtimeDataSource();var c=connection("runtime");var s=c.createStatement()) {
            s.executeUpdate("INSERT INTO adc_business.Clinic VALUES (1,'BOOT-C1','Fixture',NULL,'000',NULL,NULL,true,UTC_TIMESTAMP())");
            java.nio.file.Files.writeString(dbSecret,credentials.getPassword());java.nio.file.Files.writeString(accountSecret,password+"\n");
            java.nio.file.Files.writeString(metadata,"{\"username\":\"verified-command-admin\",\"staff_reference\":\"verified fixture\",\"operator_reference\":\"verified test operator\",\"clinic_ids\":[\"1\"],\"capabilities\":[\"account.manage\"],\"valid_until\":null}");
            String javaCommand=System.getProperty("os.name").startsWith("Windows")?"java.exe":"java";
            var command=new ProcessBuilder(java.nio.file.Path.of(System.getProperty("java.home"),"bin",javaCommand).toString(),"-Dloader.main=com.adc.identity.bootstrap.HeadquartersBootstrap","-cp",root.resolve("backend/target/adc-backend-0.1.0-SNAPSHOT.jar").toString(),"org.springframework.boot.loader.launch.PropertiesLauncher");
            command.environment().putAll(java.util.Map.of("ADC_DB_URL",credentials.getJdbcUrl(),"ADC_DB_USERNAME",credentials.getUsername(),"ADC_BOOTSTRAP_DB_PASSWORD_FILE",dbSecret.toString(),"ADC_BOOTSTRAP_PASSWORD_FILE",accountSecret.toString(),"ADC_BOOTSTRAP_INPUT_FILE",metadata.toString()));
            var output=root.resolve("docs/verification/database/bootstrap-command-output.log");command.redirectErrorStream(true).redirectOutput(output.toFile());var process=command.start();
            try {assertTrue(process.waitFor(30,java.util.concurrent.TimeUnit.SECONDS));assertEquals(0,process.exitValue());}finally{if(process.isAlive())process.destroyForcibly();}
            String result=java.nio.file.Files.readString(output);assertTrue(result.contains("Headquarters initialized:"));assertFalse(result.contains(password));assertFalse(result.contains(credentials.getPassword()));
            assertEquals(Set.of("1"),SchemaBaselineIT.query(c,"SELECT COUNT(*) FROM adc_identity.StaffAccount WHERE username='verified-command-admin'"));
        } finally {java.nio.file.Files.deleteIfExists(dbSecret);java.nio.file.Files.deleteIfExists(accountSecret);java.nio.file.Files.deleteIfExists(metadata);java.nio.file.Files.deleteIfExists(temporary);}
    }
}
