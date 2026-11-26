package com.adc.infrastructure;

import java.sql.DriverManager;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.testcontainers.mysql.MySQLContainer;
import org.testcontainers.utility.DockerImageName;

import static org.assertj.core.api.Assertions.assertThat;

/** T002: a real, disposable Linux MySQL instance; never silently skip absent Docker. */
class MySqlEnvironmentIT {
    // Same approved digest as Compose; Testcontainers parses a digest without a tag prefix.
    private static final String IMAGE = "mysql@sha256:72c368d898861f3b3a07af0e6d690400f44f048799ed46822783d9224cc2c86d";

    @Test
    void realMysqlRunsWithRequiredPlatformCaseTimeAndStorageSettings() throws Exception {
        try (var mysql = new MySQLContainer(DockerImageName.parse(IMAGE))
                .withDatabaseName("adc_business")
                .withUsername("adc_environment_probe")
                .withPassword(UUID.randomUUID().toString())
                .withCommand("--lower-case-table-names=0", "--default-time-zone=+00:00",
                        "--default-storage-engine=InnoDB")) {
            mysql.start();
            try (var connection = DriverManager.getConnection(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword());
                 var statement = connection.createStatement();
                 var rows = statement.executeQuery("SELECT VERSION(), @@version_compile_os, "
                         + "@@lower_case_table_names, @@global.time_zone, @@session.time_zone, @@default_storage_engine")) {
                assertThat(rows.next()).isTrue();
                assertThat(rows.getString(1)).startsWith("8.4.");
                assertThat(rows.getString(2)).startsWithIgnoringCase("Linux");
                assertThat(rows.getInt(3)).isZero();
                assertThat(rows.getString(4)).isEqualTo("+00:00");
                assertThat(rows.getString(5)).isEqualTo("+00:00");
                assertThat(rows.getString(6)).isEqualToIgnoringCase("InnoDB");
            }
        }
    }
}
