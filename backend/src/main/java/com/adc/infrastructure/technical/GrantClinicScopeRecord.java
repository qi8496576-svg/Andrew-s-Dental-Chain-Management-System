package com.adc.infrastructure.technical;

/** Immutable row projection; business mutations belong to application services. */
public record GrantClinicScopeRecord(
    String grant_id,
    Long clinic_id
) { }
