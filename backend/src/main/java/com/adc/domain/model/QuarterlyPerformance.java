package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record QuarterlyPerformance(
    Long quarterly_performance_id,
    Long dentist_id,
    java.time.LocalDate quarter_start,
    java.time.LocalDate quarter_end,
    java.math.BigDecimal revenue,
    java.math.BigDecimal medical_supply_cost,
    java.math.BigDecimal operating_expense,
    java.math.BigDecimal net_profit,
    java.math.BigDecimal incentive_rate,
    java.math.BigDecimal incentive_amount,
    String calculation_status,
    java.time.Instant calculated_at,
    Integer calculation_version,
    String source_snapshot,
    String input_hash,
    java.time.Instant published_at
) { }
