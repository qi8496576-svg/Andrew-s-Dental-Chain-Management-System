package com.adc.infrastructure.technical;

/** Immutable row projection; business mutations belong to application services. */
public record CurrentPatientBindingRecord(
    String subject_id,
    Long patient_id,
    String verified_by,
    java.time.Instant verified_at,
    String verification_reference
) { }
