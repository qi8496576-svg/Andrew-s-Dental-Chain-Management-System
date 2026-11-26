package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record PatientAllergy(
    Long patient_id,
    Long allergy_id,
    java.time.Instant noted_at,
    String severity_note,
    String clinical_note,
    Boolean is_retracted,
    String audit_history,
    java.time.Instant updated_at
) { }
