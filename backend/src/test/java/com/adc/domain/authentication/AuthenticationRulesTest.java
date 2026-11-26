package com.adc.domain.authentication;

import static org.junit.jupiter.api.Assertions.*;
import java.time.*;
import org.junit.jupiter.api.Test;

class AuthenticationRulesTest {
    @Test void fifthFailureStartsFixedFifteenMinuteWindowAndExpiryStartsNewCount() {
        var now=Instant.parse("2026-11-11T00:00:00Z");
        var state=new AuthenticationRules.Throttle(4,null);
        var fifth=AuthenticationRules.failed(state,now);
        assertEquals(5,fifth.failures());assertEquals(now.plusSeconds(900),fifth.blockedUntil());
        assertTrue(AuthenticationRules.blocked(fifth,now.plusSeconds(899)));
        assertEquals(fifth,AuthenticationRules.failed(fifth,now.plusSeconds(10)));
        assertFalse(AuthenticationRules.blocked(fifth,now.plusSeconds(900)));
        assertEquals(1,AuthenticationRules.failed(fifth,now.plusSeconds(900)).failures());
    }
}
