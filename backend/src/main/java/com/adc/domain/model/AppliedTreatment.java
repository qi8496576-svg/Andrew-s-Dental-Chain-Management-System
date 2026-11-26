package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record AppliedTreatment(
    Long applied_treatment_id,
    Long appointment_id,
    Long treatment_id,
    Long dentist_id,
    java.math.BigDecimal standard_units,
    java.math.BigDecimal unit_price,
    java.math.BigDecimal subtotal,
    java.time.Instant performed_at
) { }
