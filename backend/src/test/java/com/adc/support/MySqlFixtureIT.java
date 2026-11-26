package com.adc.support;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MySqlFixtureIT {
    @Test
    void isolatedMysqlRollsBackAndDoesNotShareTemporaryTablesBetweenConnections() throws Exception {
        var fixture = MySqlFixture.start();
        try (fixture; var first = fixture.connection(); var second = fixture.connection();
             var sql = first.createStatement(); var other = second.createStatement()) {
            sql.execute("CREATE TEMPORARY TABLE fixture_probe (id BIGINT PRIMARY KEY) ENGINE=InnoDB");
            first.setAutoCommit(false);
            sql.executeUpdate("INSERT INTO fixture_probe VALUES (1)");
            first.rollback();
            try (var rows = sql.executeQuery("SELECT COUNT(*) FROM fixture_probe")) {
                assertThat(rows.next()).isTrue();
                assertThat(rows.getInt(1)).isZero();
            }
            assertThatThrownBy(() -> other.executeQuery("SELECT * FROM fixture_probe"))
                    .isInstanceOf(java.sql.SQLException.class);
            try (var rows = sql.executeQuery("SELECT @@global.time_zone, @@lower_case_table_names")) {
                assertThat(rows.next()).isTrue();
                assertThat(rows.getString(1)).isEqualTo("+00:00");
                assertThat(rows.getInt(2)).isZero();
            }
        }
        assertThatThrownBy(fixture::connection).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void fixtureDataIsFreshAndStaffAreNotInventedDentists() throws Exception {
        var data = MySqlFixture.data();
        assertThat(data.path("patients").size()).isEqualTo(3);
        assertThat(data.path("staff").size()).isEqualTo(4);
        for (var staff : data.path("staff")) {
            if (!staff.path("role_code").asString().equals("DENTIST"))
                assertThat(staff.has("dentist_id")).isFalse();
        }
        assertThat(MySqlFixture.data()).isNotSameAs(data);
        assertThat(data.path("appointment_cases").size()).isEqualTo(8);
    }
}
