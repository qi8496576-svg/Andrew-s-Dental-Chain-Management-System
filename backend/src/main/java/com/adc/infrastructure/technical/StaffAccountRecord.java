package com.adc.infrastructure.technical;

/** Immutable row projection; business mutations belong to application services. */
public record StaffAccountRecord(
    String subject_id,
    String username,
    String staff_reference,
    Long dentist_id,
    String password_hash,
    Boolean requires_reset,
    java.time.Instant credential_changed_at,
    String verification_reference
) { }
