package com.adc.infrastructure;

import com.adc.support.MySqlFixture;
import java.nio.file.Files;
import java.sql.*;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;

/** Owns its database: no external URL, persistent volume, or production credentials. */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
abstract class MigratedDatabaseTest {
    private MySqlFixture fixture;
    private final String runtimePassword = UUID.randomUUID().toString();
    @BeforeAll void migrate() throws Exception {
        fixture = MySqlFixture.start();
        try (var c = fixture.administratorConnection()) {
            script(c, "ops/compose/mysql/bootstrap.sql");
            try (var s = c.createStatement()) {
                s.execute("CREATE USER 'adc_migrator'@'%' IDENTIFIED BY '" + runtimePassword + "'");
                s.execute("GRANT 'adc_migration_role' TO 'adc_migrator'@'%'");
                s.execute("SET DEFAULT ROLE 'adc_migration_role' TO 'adc_migrator'@'%'");
            }
            Flyway.configure().dataSource(fixture.jdbcUrl(), "adc_migrator", runtimePassword)
                .defaultSchema("adc_identity").schemas("adc_business", "adc_identity", "adc_audit")
                .createSchemas(false).cleanDisabled(true).locations("classpath:db/migration").load().migrate();
            script(c, "ops/compose/mysql/runtime-grants.sql");
            try (var s = c.createStatement()) {
                s.execute("CREATE USER 'adc_runtime'@'%' IDENTIFIED BY '" + runtimePassword + "'");
                s.execute("GRANT 'adc_runtime_role' TO 'adc_runtime'@'%'");
                s.execute("SET DEFAULT ROLE 'adc_runtime_role' TO 'adc_runtime'@'%'");
            }
        } catch (Exception e) { fixture.close(); throw e; }
    }
    static void script(Connection c, String path) throws Exception {
        String sql = Files.readString(SchemaBaselineIT.ROOT.resolve(path)).replaceAll("(?m)--.*$", "");
        try (var s = c.createStatement()) {
            for (String command : sql.split(";")) if (!command.isBlank()) s.execute(command);
        }
    }
    Connection connection(String role) throws Exception {
        return role.equals("runtime")
            ? DriverManager.getConnection(fixture.jdbcUrl(), "adc_runtime", runtimePassword)
            : fixture.administratorConnection();
    }
    MySqlFixture ownedDatabase(){ return fixture; }
    com.zaxxer.hikari.HikariDataSource runtimeDataSource() {
        var config=new com.zaxxer.hikari.HikariConfig();
        config.setJdbcUrl(fixture.jdbcUrl());
        config.setUsername("adc_runtime"); config.setPassword(runtimePassword);
        config.setMaximumPoolSize(2); config.setConnectionInitSql("SET time_zone='+00:00'");
        return new com.zaxxer.hikari.HikariDataSource(config);
    }
    @AfterAll void dispose() { if (fixture != null) fixture.close(); }
}
