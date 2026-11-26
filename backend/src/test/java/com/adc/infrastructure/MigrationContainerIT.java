package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.support.MySqlFixture;
import com.github.dockerjava.api.model.Capability;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.startupcheck.OneShotStartupCheckStrategy;
import org.testcontainers.containers.BindMode;

class MigrationContainerIT {
    @Test void independentNonrootContainerMigratesWithOnlyMigrationRole() throws Exception {
        String password=UUID.randomUUID().toString();
        var secret=java.nio.file.Files.createTempFile(SchemaBaselineIT.ROOT.resolve("tmp/build-temp"),"migration-fixture-",".secret");
        java.nio.file.Files.writeString(secret,password);
        try(var fixture=MySqlFixture.start(); var c=fixture.administratorConnection()) {
            MigratedDatabaseTest.script(c,"ops/compose/mysql/bootstrap.sql");
            try(var s=c.createStatement()) {
                s.execute("CREATE USER 'adc_migrator'@'%' IDENTIFIED BY '"+password+"'");
                s.execute("GRANT 'adc_migration_role' TO 'adc_migrator'@'%'");
                s.execute("SET DEFAULT ROLE 'adc_migration_role' TO 'adc_migrator'@'%'");
            }
            try(var runner=new GenericContainer<>("eclipse-temurin:21.0.9_10-jre-jammy@sha256:5cbbc80ec3f79faeba17a0551a77b260040da7a9e3b398dac0e681e84a4d8032")
                .withFileSystemBind(Path.of("target/adc-backend-0.1.0-SNAPSHOT.jar").toAbsolutePath().toString(),"/app/backend.jar",BindMode.READ_ONLY)
                .withFileSystemBind(secret.toString(),"/run/secrets/migration_password",BindMode.READ_ONLY)
                .withEnv("ADC_MIGRATION_URL",fixture.internalJdbcUrl())
                .withEnv("ADC_MIGRATION_USERNAME","adc_migrator")
                .withEnv("ADC_MIGRATION_PASSWORD_FILE","/run/secrets/migration_password")
                .withCreateContainerCmdModifier(cmd->{
                    cmd.withUser("10001:10001").withEntrypoint("java");
                    cmd.getHostConfig().withReadonlyRootfs(true).withCapDrop(Capability.ALL)
                        .withTmpFs(Map.of("/tmp","rw,size=64m,mode=1777"));
                })
                .withCommand("-Dloader.main=com.adc.infrastructure.MigrationMain","-cp","/app/backend.jar","org.springframework.boot.loader.launch.PropertiesLauncher")
                .withStartupCheckStrategy(new OneShotStartupCheckStrategy().withTimeout(Duration.ofMinutes(2)))) {
                runner.start();
                assertEquals(0L,runner.getCurrentContainerInfo().getState().getExitCodeLong(),runner.getLogs());
                assertTrue(runner.getLogs().contains("Successfully applied 34 migrations"),runner.getLogs());
                java.nio.file.Files.writeString(SchemaBaselineIT.ROOT.resolve("docs/verification/database/migration-container-output.log"),runner.getLogs());
            }
            assertEquals(java.util.Set.of("34"),SchemaBaselineIT.query(c,"SELECT COUNT(*) FROM adc_identity.flyway_schema_history WHERE success=1 AND version IS NOT NULL"));
        } finally { java.nio.file.Files.deleteIfExists(secret); }
    }
}
