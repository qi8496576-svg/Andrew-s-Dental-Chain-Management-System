package com.adc.domain;
import static org.junit.jupiter.api.Assertions.*;
import com.adc.domain.analytics.AnalyticsRules;
import java.math.BigDecimal;
import java.util.*;
import org.junit.jupiter.api.Test;
class AnalyticsRulesTest {
    @Test void ratiosDoNotReplaceUnknownOrEmptyDenominatorsWithZero(){assertEquals("0.200000",AnalyticsRules.ratio(2,10));assertNull(AnalyticsRules.ratio(0,0));assertEquals("17.50",AnalyticsRules.weighted(new BigDecimal("70.00"),new BigDecimal("4.00")));assertNull(AnalyticsRules.weighted(BigDecimal.ZERO,BigDecimal.ZERO));}
    @Test void allSevenActualTreatmentFactsAreRequired(){var facts=new ArrayList<Object>(List.of("patient","appointment","performer","treatment","1.00","10.00","2026-11-10T01:00:00Z"));assertTrue(AnalyticsRules.traceable(facts));for(int i=0;i<7;i++){var missing=new ArrayList<>(facts);missing.set(i,null);assertFalse(AnalyticsRules.traceable(missing));}}
}
