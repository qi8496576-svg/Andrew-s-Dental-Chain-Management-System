package com.adc.domain.invoicing;
import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
class InvoiceRulesTest {
    @Test void sumsAlreadyRoundedLinesAndRejectsTotalsOutsideTheOriginalDecimalRange(){assertEquals(new BigDecimal("15.02"),InvoiceRules.sum(List.of(new BigDecimal("15.02"),new BigDecimal("0.00"))));assertThrows(IllegalArgumentException.class,()->InvoiceRules.sum(List.of(new BigDecimal("999999999999.99"),new BigDecimal("0.01"))));}
}
