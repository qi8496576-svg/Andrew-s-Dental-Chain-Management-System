package com.adc.domain.shared;

import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;
import java.time.*;
import org.junit.jupiter.api.Test;

class BusinessValuesTest {
    @Test void decimalInputRejectsOverflowExtraScaleAndNonDecimalNotation() {
        assertEquals("999999999999.99",BusinessValues.money("999999999999.99").toPlainString());
        assertEquals("-10.00",BusinessValues.money("-10").toPlainString());
        for(String text:new String[]{"1000000000000.00","1.001","1e2","NaN"," 1.00","1,000.00"})
            assertThrows(IllegalArgumentException.class,()->BusinessValues.money(text),text);
        assertThrows(IllegalArgumentException.class,()->BusinessValues.unitPrice("-0.01"));
        assertThrows(IllegalArgumentException.class,()->BusinessValues.units("0"));
        assertThrows(IllegalArgumentException.class,()->BusinessValues.units("100000000.00"));
    }
    @Test void treatmentSubtotalAndR1UseExactDecimalRounding() {
        assertEquals(new BigDecimal("0.03"),BusinessValues.subtotal("1.50","0.02"));
        assertEquals(new BigDecimal("0.02"),BusinessValues.subtotal("1.50","0.01"));
        assertEquals(new BigDecimal("10.01"),BusinessValues.incentive("100.05"));
        assertEquals(new BigDecimal("0.00"),BusinessValues.incentive("-100.00"));
        assertEquals(new BigDecimal("0.00"),BusinessValues.incentive("0"));
        assertThrows(IllegalArgumentException.class,()->BusinessValues.subtotal("99999999.99","9999999999.99"));
    }
    @Test void idsKeepBigintPrecisionAndRejectInvalidValues() {
        assertEquals(Long.MAX_VALUE,BusinessValues.id("9223372036854775807"));
        for(String text:new String[]{"0","-1","1.0","9223372036854775808","01"})
            assertThrows(IllegalArgumentException.class,()->BusinessValues.id(text));
    }
    @Test void shanghaiDayAndQuarterUseHalfOpenUtcBoundaries() {
        var range=BusinessTime.day(LocalDate.of(2026,11,11));
        assertEquals(Instant.parse("2026-11-10T16:00:00Z"),range.start());
        assertEquals(Instant.parse("2026-11-11T16:00:00Z"),range.end());
        assertTrue(range.contains(range.start())); assertFalse(range.contains(range.end()));
        assertEquals(Instant.parse("2026-12-31T16:00:00Z"),BusinessTime.quarter(LocalDate.of(2026,11,11)).end());
        assertThrows(IllegalArgumentException.class,()->BusinessTime.timestamp("2026-11-11T09:00:00"));
        assertEquals(Instant.parse("2026-11-11T01:00:00Z"),BusinessTime.timestamp("2026-11-11T09:00:00+08:00"));
    }
}
