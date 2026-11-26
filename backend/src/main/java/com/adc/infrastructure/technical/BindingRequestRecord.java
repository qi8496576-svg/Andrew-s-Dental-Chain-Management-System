package com.adc.infrastructure.technical;

/** Immutable row projection; business mutations belong to application services. */
public record BindingRequestRecord(
    String request_id,
    String applicant_subject_id,
    String patient_number_hint,
    java.time.LocalDate date_of_birth_hint,
    Long service_clinic_id,
    Long candidate_patient_id,
    String status,
    java.time.Instant submitted_at,
    String reviewed_by,
    java.time.Instant reviewed_at,
    String verification_basis,
    String reason
) { }
