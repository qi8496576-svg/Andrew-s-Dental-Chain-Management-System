package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import com.adc.AdcApplication;
import com.adc.identity.PasswordHasher;
import jakarta.servlet.http.Cookie;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.core.env.MapPropertySource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.json.JsonMapper;

class AuthenticationHttpIT extends MigratedDatabaseTest {
    @Test void realSecurityChainAndMysqlCompleteWebLoginCsrfRotationAndLogout() throws Exception {
        try(var credentials=runtimeDataSource()) {
            var properties=new HashMap<String,Object>();properties.put("server.port",0);
            properties.put("spring.datasource.url",credentials.getJdbcUrl());properties.put("spring.datasource.username",credentials.getUsername());properties.put("spring.datasource.password",credentials.getPassword());
            properties.put("adc.web-origin","https://adc.fixture");
            try(var app=new SpringApplicationBuilder(AdcApplication.class).initializers(context->context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("owned-mysql-fixture",properties))).run()) {
                var db=app.getBean(JdbcTemplate.class);
                db.update("INSERT INTO adc_identity.Subject VALUES ('http-fixture','STAFF',true,UTC_TIMESTAMP(),NULL)");
                db.update("INSERT INTO adc_identity.StaffAccount VALUES ('http-fixture','http-fixture','verified fixture',NULL,?,false,UTC_TIMESTAMP(),'fixture')",app.getBean(PasswordHasher.class).encode("fixture-password"));
                var mvc=MockMvcBuilders.webAppContextSetup((WebApplicationContext)app).apply(springSecurity()).build();
                var json=JsonMapper.builder().build();
                var anonymous=mvc.perform(get("/api/v1/auth/csrf")).andExpect(status().isOk()).andReturn().getResponse();
                String preauthToken=json.readTree(anonymous.getContentAsString()).path("csrf_token").asText();Cookie preauth=anonymous.getCookie("adc_preauth");assertNotNull(preauth);assertTrue(preauth.isHttpOnly());assertTrue(preauth.getSecure());
                String body="{\"username\":\"http-fixture\",\"password\":\"fixture-password\"}";
                mvc.perform(post("/api/v1/auth/staff-sessions").header("Origin","https://attacker.fixture").cookie(preauth).header("X-CSRF-Token",preauthToken).contentType("application/json").content(body)).andExpect(status().isForbidden());
                mvc.perform(post("/api/v1/auth/staff-sessions").header("Origin","https://adc.fixture").cookie(preauth).contentType("application/json").content(body)).andExpect(status().isForbidden());
                assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_identity.LoginThrottle",Integer.class));
                var login=mvc.perform(post("/api/v1/auth/staff-sessions").header("Origin","https://adc.fixture").cookie(preauth).header("X-CSRF-Token",preauthToken).contentType("application/json").content(body))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.access_token").doesNotExist()).andExpect(jsonPath("$.roles").isEmpty()).andExpect(header().string("Cache-Control","no-store")).andReturn().getResponse();
                Cookie session=login.getCookie("adc_session");assertNotNull(session);assertTrue(session.getSecure());assertTrue(session.isHttpOnly());assertTrue(login.getHeaders("Set-Cookie").stream().anyMatch(value->value.contains("SameSite=Lax")));
                String csrf=json.readTree(login.getContentAsString()).path("csrf_token").asText();assertNotEquals(preauthToken,csrf);
                assertArrayEquals(Crypto.sha256(session.getValue()),db.queryForObject("SELECT token_hash FROM adc_identity.Session",byte[].class));
                mvc.perform(get("/api/v1/me").cookie(session)).andExpect(status().isOk()).andExpect(jsonPath("$.subject_type").value("STAFF")).andExpect(jsonPath("$.binding").isEmpty());
                mvc.perform(delete("/api/v1/auth/session").cookie(session).header("Origin","https://adc.fixture").header("X-CSRF-Token",preauthToken).header("Idempotency-Key","logout-http-fixture")).andExpect(status().isForbidden());
                mvc.perform(delete("/api/v1/auth/session").header("Authorization","Bearer "+session.getValue()).header("Idempotency-Key","logout-http-fixture")).andExpect(status().isUnauthorized());
                var rotated=mvc.perform(get("/api/v1/auth/csrf").cookie(session)).andExpect(status().isOk()).andReturn().getResponse();
                String fresh=json.readTree(rotated.getContentAsString()).path("csrf_token").asText();assertNotEquals(csrf,fresh);
                mvc.perform(delete("/api/v1/auth/session").cookie(session).header("Origin","https://adc.fixture").header("X-CSRF-Token",csrf).header("Idempotency-Key","logout-http-fixture")).andExpect(status().isForbidden());
                mvc.perform(delete("/api/v1/auth/session").cookie(session).header("Origin","https://adc.fixture").header("X-CSRF-Token",fresh).header("Idempotency-Key","logout-http-fixture")).andExpect(status().isNoContent());
                mvc.perform(get("/api/v1/me").cookie(session)).andExpect(status().isUnauthorized());
                var extra=mvc.perform(get("/api/v1/auth/csrf")).andReturn().getResponse();
                mvc.perform(post("/api/v1/auth/staff-sessions").header("Origin","https://adc.fixture").cookie(extra.getCookie("adc_preauth")).header("X-CSRF-Token",json.readTree(extra.getContentAsString()).path("csrf_token").asText()).contentType("application/json").content(body.substring(0,body.length()-1)+",\"role\":\"HEADQUARTERS\"}" )).andExpect(status().isBadRequest());
                assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_identity.RequestReceipt WHERE operation_id='logout'",Integer.class));
            }
        }
    }
}
