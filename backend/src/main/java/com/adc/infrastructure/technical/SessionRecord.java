package com.adc.infrastructure.technical;

/** Immutable row projection; business mutations belong to application services. */
public record SessionRecord(
    String session_id,
    String subject_id,
    byte[] token_hash,
    String client_type,
    byte[] csrf_secret_hash,
    java.time.Instant created_at,
    java.time.Instant last_activity_at,
    java.time.Instant absolute_expires_at,
    java.time.Instant revoked_at,
    String revoked_reason
) { }
