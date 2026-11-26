package com.adc.infrastructure.technical;

/** Immutable row projection; business mutations belong to application services. */
public record BindingEventRecord(
    String event_id,
    String action,
    Long patient_id,
    String old_subject_id,
    String new_subject_id,
    String operator_subject_id,
    String binding_request_id,
    java.time.Instant occurred_at,
    String reason,
    String verification_basis,
    String request_key
) { }
