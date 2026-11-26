package com.adc.infrastructure.technical;

/** Immutable row projection; business mutations belong to application services. */
public record RequestReceiptRecord(
    String subject_id,
    String operation_id,
    String request_key,
    byte[] content_hash,
    String request_id,
    String result_refs,
    String response_summary,
    Short response_status,
    java.time.Instant created_at,
    java.time.Instant completed_at
) { }
