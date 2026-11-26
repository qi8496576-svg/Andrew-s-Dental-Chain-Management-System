package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record TreatmentQualification(
    Long treatment_id,
    Long qualification_id,
    Boolean is_mandatory
) { }
