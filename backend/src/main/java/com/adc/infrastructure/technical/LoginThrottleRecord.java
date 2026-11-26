package com.adc.infrastructure.technical;

/** Immutable row projection; business mutations belong to application services. */
public record LoginThrottleRecord(
    byte[] throttle_key,
    String subject_id,
    Integer consecutive_failures,
    java.time.Instant blocked_until,
    java.time.Instant last_failure_at,
    java.time.Instant updated_at
) { }
