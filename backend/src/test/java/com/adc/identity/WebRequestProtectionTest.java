package com.adc.identity;

import static org.junit.jupiter.api.Assertions.*;
import java.time.*;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.*;

class WebRequestProtectionTest {
    static class TestClock extends Clock {
        Instant now=Instant.parse("2026-11-11T00:00:00Z");
        public ZoneId getZone(){return ZoneOffset.UTC;}public Clock withZone(ZoneId zone){return this;}public Instant instant(){return now;}
    }
    @Test void signedAnonymousCsrfExpiresAndCannotBeForgedOrMovedAcrossOrigins() {
        var clock=new TestClock();
        var protection=new WebRequestProtection(new JdbcTemplate(),new AuthSecrets(new byte[32]),clock,new MockEnvironment().withProperty("adc.web-origin","https://adc.fixture"));
        var response=new MockHttpServletResponse();String token=protection.initializeAnonymous(response);
        var cookie=response.getCookie("adc_preauth");assertNotNull(cookie);assertTrue(cookie.getSecure());assertTrue(cookie.isHttpOnly());
        var request=new MockHttpServletRequest("POST","/api/v1/auth/staff-sessions");request.setCookies(cookie);request.addHeader("X-CSRF-Token",token);request.addHeader("Origin","https://adc.fixture");
        assertEquals(token,protection.loadToken(request).getToken());assertDoesNotThrow(()->protection.checkOrigin(request));
        request.removeHeader("Origin");request.addHeader("Origin","https://attacker.fixture");assertThrows(com.adc.domain.shared.DomainFailure.class,()->protection.checkOrigin(request));
        request.removeHeader("X-CSRF-Token");request.addHeader("X-CSRF-Token","forged");assertNull(protection.loadToken(request));
        request.removeHeader("X-CSRF-Token");request.addHeader("X-CSRF-Token",token);clock.now=clock.now.plusSeconds(300);assertNull(protection.loadToken(request));
    }
    @Test void nativeExemptionRequiresNoBrowserOriginAndNoWebCookie() {
        var request=new MockHttpServletRequest("POST","/api/v1/auth/wechat-sessions");assertTrue(WebRequestProtection.nativeRequest(request));
        request.addHeader("Origin","null");assertFalse(WebRequestProtection.nativeRequest(request));request.removeHeader("Origin");
        request.setCookies(new jakarta.servlet.http.Cookie("adc_session","opaque"));assertFalse(WebRequestProtection.nativeRequest(request));
    }
}
