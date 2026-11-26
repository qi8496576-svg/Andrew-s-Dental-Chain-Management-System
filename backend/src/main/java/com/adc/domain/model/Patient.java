package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record Patient(
    Long patient_id,
    String patient_number,
    String full_name,
    java.time.LocalDate date_of_birth,
    String billing_address,
    String phone,
    String email,
    String emergency_contact_name,
    String emergency_contact_phone,
    java.time.Instant created_at,
    java.time.Instant updated_at,
    String allergy_review_status
) { }
