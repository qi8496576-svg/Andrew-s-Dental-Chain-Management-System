package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record Allergy(
    Long allergy_id,
    String allergy_name,
    String description,
    Boolean is_active
) { }
