package com.adc.infrastructure.technical;

/** Immutable row projection; business mutations belong to application services. */
public record ExternalIdentityRecord(
    Long external_identity_id,
    String subject_id,
    String provider,
    byte[] appid,
    byte[] openid,
    java.time.Instant created_at
) { }
