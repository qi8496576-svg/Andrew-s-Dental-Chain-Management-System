package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record Qualification(
    Long qualification_id,
    String qualification_name,
    String description,
    Boolean is_active
) { }
