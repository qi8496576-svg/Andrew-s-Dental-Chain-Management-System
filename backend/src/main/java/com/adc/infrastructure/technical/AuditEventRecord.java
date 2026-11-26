package com.adc.infrastructure.technical;

/** Immutable row projection; business mutations belong to application services. */
public record AuditEventRecord(
    Long audit_id,
    String subject_id,
    String actor_kind,
    String action,
    String object_kind,
    String object_id,
    String clinic_scope,
    java.time.Instant occurred_at,
    String request_id,
    String result,
    String reason,
    String change_summary,
    String verification_reference
) { }
