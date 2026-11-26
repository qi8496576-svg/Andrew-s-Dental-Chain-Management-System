package com.adc;

import com.adc.support.BuildProbeMapper;
import java.sql.Connection;
import java.sql.SQLException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import javax.sql.DataSource;
import org.apache.ibatis.session.SqlSessionFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.datasource.AbstractDataSource;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** T001 only: load Boot/MyBatis/XML together, without claiming a database test. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "mybatis.mapper-locations=classpath*:build-probe/*.xml")
@AutoConfigureMockMvc
@Import(BuildSmokeTest.NoDatabase.class)
class BuildSmokeTest {
    @Autowired SqlSessionFactory sessions;
    @Autowired BuildProbeMapper mapper;
    @Autowired MockMvc http;
    @LocalServerPort int port;

    @Test
    void embeddedServerStartsAndRejectsAnonymousHttp() throws Exception {
        try (var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build()) {
            var request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/v1/me"))
                    .timeout(Duration.ofSeconds(5)).GET().build();
            assertThat(client.send(request, HttpResponse.BodyHandlers.discarding()).statusCode()).isEqualTo(401);
        }
    }

    @Test
    void starterCreatesMapperAndParsesXmlWithoutOpeningDatabase() {
        assertThat(mapper).isNotNull();
        var configuration = sessions.getConfiguration();
        assertThat(configuration.hasStatement("com.adc.support.BuildProbeMapper.probe")).isTrue();
        assertThat(configuration.getMappedStatement("com.adc.support.BuildProbeMapper.probe")
                .getBoundSql(null).getSql().strip()).isEqualTo("SELECT 1");
    }

    @Test
    void identityRejectsAnonymousAndCannotExposeDefaultLogin() throws Exception {
        http.perform(get("/api/v1/me")).andExpect(status().isUnauthorized());
        http.perform(get("/login")).andExpect(status().isForbidden());
        http.perform(post("/api/v1/auth/staff-sessions")).andExpect(status().isForbidden());
    }

    @Test
    void workspaceReadRoutesReachTheirOwnIdentityAndScopeChecks() throws Exception {
        for(String path:java.util.List.of(
                "/api/v1/workspace/appointments?role=RECEPTION",
                "/api/v1/workspace/summary?role=HEADQUARTERS&start=2026-11-23T00:00:00Z&end=2026-11-24T00:00:00Z",
                "/api/v1/workspace/applied-treatments",
                "/api/v1/appointments/1/fee-preview")) {
            http.perform(get(path)).andExpect(status().isUnauthorized());
        }
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class NoDatabase {
        @Bean
        DataSource dataSource() {
            return new AbstractDataSource() {
                @Override public Connection getConnection() throws SQLException {
                    throw new SQLException("T001 must not open a database; real MySQL verification belongs to T002/T043");
                }
                @Override public Connection getConnection(String username, String password) throws SQLException {
                    return getConnection();
                }
            };
        }
    }
}
