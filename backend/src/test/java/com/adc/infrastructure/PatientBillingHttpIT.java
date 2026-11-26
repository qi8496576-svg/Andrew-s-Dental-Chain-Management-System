package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import com.adc.AdcApplication;
import jakarta.servlet.http.Cookie;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.core.env.MapPropertySource;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.json.JsonMapper;

/** Positive HTTP cases complement the deny matrix; all security filters and MySQL are real. */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class PatientBillingHttpIT {
    final PatientBillingIT fixture=new PatientBillingIT();static final JsonMapper JSON=JsonMapper.builder().build();
    static final String ORIGIN="https://owned-billing.test";
    @org.springframework.boot.test.context.TestConfiguration(proxyBeanMethods=false)
    static class OwnedClock {
        @org.springframework.context.annotation.Bean @org.springframework.context.annotation.Primary
        Clock billingClock(){return Clock.fixed(Instant.parse("2026-11-11T00:00:00Z"),ZoneOffset.UTC);}
    }
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @BeforeEach void setup()throws Exception{fixture.setup();}
    @AfterEach void close()throws Exception{fixture.close();}
    @Test void validWebFeeConfigurationAndNativePayCancelRefundPassActualSecurityFilters()throws Exception{
        var base=fixture.fixture.fixture.fixture.fixture.fixture;
        try(var credentials=base.runtimeDataSource()){
            var properties=new HashMap<String,Object>();properties.put("server.port",0);properties.put("adc.web-origin",ORIGIN);properties.put("adc.performance.scheduling.enabled",false);properties.put("adc.demo-payments.enabled",true);properties.put("adc.demo-payments.clinics","FIXTURE");properties.put("spring.datasource.url",credentials.getJdbcUrl());properties.put("spring.datasource.username",credentials.getUsername());properties.put("spring.datasource.password",credentials.getPassword());
            try(var app=new SpringApplicationBuilder(AdcApplication.class,OwnedClock.class).initializers(ctx->ctx.getEnvironment().getPropertySources().addFirst(new MapPropertySource("owned-billing",properties))).run()){
                var mvc=MockMvcBuilders.webAppContextSetup((org.springframework.web.context.WebApplicationContext)app).apply(springSecurity()).build();
                var pre=mvc.perform(get("/api/v1/auth/csrf").secure(true)).andReturn().getResponse();String csrf=JSON.readTree(pre.getContentAsString()).get("csrf_token").asText();
                var signed=mvc.perform(post("/api/v1/auth/staff-sessions").secure(true).header("Origin",ORIGIN).header("X-CSRF-Token",csrf).cookie(ApiAuthorizationMatrixIT.cookie(pre,"adc_preauth")).contentType("application/json").content("{\"username\":\"hq\",\"password\":\"fixture-password\"}")).andReturn().getResponse();assertEquals(200,signed.getStatus(),signed.getContentAsString());Cookie cookie=ApiAuthorizationMatrixIT.cookie(signed,"adc_session");csrf=JSON.readTree(signed.getContentAsString()).get("csrf_token").asText();
                var fee=mvc.perform(put("/api/v1/registration-fees/1/21").secure(true).cookie(cookie).header("Origin",ORIGIN).header("X-CSRF-Token",csrf).header("Idempotency-Key",UUID.randomUUID().toString()).contentType("application/json").content("{\"amount_fen\":2000}")).andReturn().getResponse();assertEquals(200,fee.getStatus(),fee.getContentAsString());
                var fraction=mvc.perform(put("/api/v1/registration-fees/1/21").secure(true).cookie(cookie).header("Origin",ORIGIN).header("X-CSRF-Token",csrf).header("Idempotency-Key",UUID.randomUUID().toString()).contentType("application/json").content("{\"amount_fen\":1.5}")).andReturn().getResponse();assertTrue(Set.of(400,422).contains(fraction.getStatus()),"Fractional fen must not be silently truncated");
                String bearer="Bearer "+fixture.token;
                var me=JSON.readTree(mvc.perform(get("/api/v1/me").secure(true).header("Authorization",bearer)).andReturn().getResponse().getContentAsString());String patient=me.get("binding").get("patient_id").asText();
                var profile=JSON.readTree(mvc.perform(get("/api/v1/patients/"+patient).secure(true).header("Authorization",bearer)).andReturn().getResponse().getContentAsString());var details=new LinkedHashMap<String,Object>();for(String field:List.of("full_name","date_of_birth","phone","billing_address","email","emergency_contact_name","emergency_contact_phone"))details.put(field,profile.get(field).isNull()?null:profile.get(field).asText());
                var body=Map.of("clinic_id","1","schedule_id",Long.toString(fixture.fixture.fixture.schedule),"scheduled_at","2026-11-12T09:00:00+08:00","requested_treatment_ids",List.of("71"),"allergy_confirmation_reference",profile.get("allergy_confirmation_reference").asText(),"patient_details",details,"allergy_declaration",Map.of("review_status","NOT_REVIEWED","records",List.of(),"confirmed",true));
                var held=mvc.perform(post("/api/v1/booking-holds").secure(true).header("Authorization",bearer).header("Idempotency-Key",UUID.randomUUID().toString()).contentType("application/json").content(JSON.writeValueAsString(body))).andReturn().getResponse();assertEquals(200,held.getStatus(),held.getContentAsString());String bill=JSON.readTree(held.getContentAsString()).get("bill_id").asText();
                var paid=mvc.perform(post("/api/v1/patient-bills/"+bill+"/demo-payments").secure(true).header("Authorization",bearer).header("Idempotency-Key",UUID.randomUUID().toString()).contentType("application/json").content("{}")).andReturn().getResponse();assertEquals(200,paid.getStatus(),paid.getContentAsString());var payment=JSON.readTree(paid.getContentAsString());assertEquals("PAID",payment.get("status").asText());String appointment=payment.get("appointment_id").asText();
                var cancelled=mvc.perform(post("/api/v1/appointments/"+appointment+"/cancel").secure(true).header("Authorization",bearer).header("Idempotency-Key",UUID.randomUUID().toString()).contentType("application/json").content("{\"reason\":\"虚构支付联调取消\"}")).andReturn().getResponse();assertEquals(200,cancelled.getStatus(),cancelled.getContentAsString());
                var refunded=mvc.perform(get("/api/v1/patient-bills/"+bill).secure(true).header("Authorization",bearer)).andReturn().getResponse();assertEquals(200,refunded.getStatus());assertEquals("REFUNDED",JSON.readTree(refunded.getContentAsString()).get("status").asText());
                assertEquals(200,mvc.perform(get("/api/v1/patient-bills").secure(true).cookie(cookie)).andReturn().getResponse().getStatus());
            }
        }
    }
}
