package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record DentistClinicAssignment(
    Long assignment_id,
    Long dentist_id,
    Long clinic_id,
    java.time.LocalDate start_date,
    java.time.LocalDate end_date,
    String availability_note,
    Boolean is_active
) { }
