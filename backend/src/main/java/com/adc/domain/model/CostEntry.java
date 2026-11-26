package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record CostEntry(
    Long cost_entry_id,
    Long dentist_id,
    Long clinic_id,
    Long appointment_id,
    Long applied_treatment_id,
    String cost_type,
    java.math.BigDecimal amount,
    java.time.Instant incurred_at,
    String description,
    String source_reference,
    String source_batch,
    java.time.Instant confirmed_at,
    String confirmed_by,
    Long reversal_of_id
) { }
