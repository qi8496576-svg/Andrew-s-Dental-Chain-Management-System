package com.adc.infrastructure.technical;

/** Immutable row projection; business mutations belong to application services. */
public record SubjectRecord(
    String subject_id,
    String subject_type,
    Boolean is_enabled,
    java.time.Instant created_at,
    java.time.Instant disabled_at
) { }
