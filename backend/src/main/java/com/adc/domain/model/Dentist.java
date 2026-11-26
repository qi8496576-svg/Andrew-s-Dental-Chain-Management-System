package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record Dentist(
    Long dentist_id,
    String employee_number,
    String full_name,
    java.time.LocalDate date_of_birth,
    String home_address,
    String phone,
    String email,
    java.time.LocalDate hire_date,
    Boolean is_active,
    java.time.Instant created_at,
    java.time.LocalDate termination_date,
    String professional_title,
    String specialty,
    String introduction
) { }
