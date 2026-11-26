package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record Clinic(
    Long clinic_id,
    String clinic_code,
    String postal_address,
    String manager_name,
    String phone,
    String email,
    java.math.BigDecimal office_area_sqm,
    Boolean is_active,
    java.time.Instant created_at
) { }
