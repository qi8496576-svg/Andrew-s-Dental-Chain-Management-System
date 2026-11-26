package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record Treatment(
    Long treatment_id,
    String treatment_code,
    String treatment_name,
    String description,
    java.math.BigDecimal default_unit_price,
    Boolean is_active
) { }
