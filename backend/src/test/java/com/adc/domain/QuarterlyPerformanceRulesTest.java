package com.adc.domain;
import static org.junit.jupiter.api.Assertions.*;
import com.adc.domain.performance.QuarterlyPerformanceRules;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
class QuarterlyPerformanceRulesTest {
    @Test void largestRemainderConservesSignedCentsAndUsesStableDentistTieBreak(){
        var shares=QuarterlyPerformanceRules.allocate(new BigDecimal("100.01"),Map.of(2L,60L,1L,60L));assertEquals(new BigDecimal("50.01"),shares.get(1L));assertEquals(new BigDecimal("50.00"),shares.get(2L));var negative=QuarterlyPerformanceRules.allocate(new BigDecimal("-100.01"),Map.of(2L,60L,1L,60L));assertEquals(shares.get(1L).negate(),negative.get(1L));assertEquals(new BigDecimal("-100.01"),negative.values().stream().reduce(BigDecimal.ZERO,BigDecimal::add));assertThrows(IllegalArgumentException.class,()->QuarterlyPerformanceRules.allocate(BigDecimal.ONE,Map.of(1L,0L)));
    }
    @Test void shanghaiHalfOpenNaturalQuarterAndNonnegativeTenPercent(){
        var quarter=QuarterlyPerformanceRules.quarter("2026-07-01","2026-10-01",Instant.parse("2026-11-11T00:00:00Z"));assertEquals(Instant.parse("2026-06-30T16:00:00Z"),quarter.start());assertEquals(Instant.parse("2026-09-30T16:00:00Z"),quarter.end());assertEquals("70.00",QuarterlyPerformanceRules.incentive(new BigDecimal("700.00")).toPlainString());assertEquals("0.00",QuarterlyPerformanceRules.incentive(new BigDecimal("-100.00")).toPlainString());assertThrows(IllegalArgumentException.class,()->QuarterlyPerformanceRules.quarter("2026-07-02","2026-10-01",Instant.now()));
    }
}
