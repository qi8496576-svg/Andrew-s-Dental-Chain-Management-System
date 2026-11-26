package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record DentistQualification(
    Long dentist_id,
    Long qualification_id,
    String certificate_number,
    java.time.LocalDate granted_date,
    java.time.LocalDate expiry_date,
    String verification_status
) { }
