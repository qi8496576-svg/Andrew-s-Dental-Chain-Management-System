package com.adc.infrastructure.technical;

/** Immutable row projection; business mutations belong to application services. */
public record AccessGrantRecord(
    String grant_id,
    String subject_id,
    String role_code,
    String granted_by,
    java.time.Instant valid_from,
    java.time.Instant valid_until,
    java.time.Instant revoked_at,
    String revoked_by,
    String reason,
    java.time.Instant created_at
) { }
