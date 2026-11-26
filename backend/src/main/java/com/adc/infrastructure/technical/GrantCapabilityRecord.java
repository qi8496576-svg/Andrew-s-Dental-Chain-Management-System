package com.adc.infrastructure.technical;

/** Immutable row projection; business mutations belong to application services. */
public record GrantCapabilityRecord(
    String grant_id,
    String capability_code
) { }
