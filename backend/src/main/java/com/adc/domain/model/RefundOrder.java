package com.adc.domain.model;

/** Immutable row projection; mutations use transactional billing services. */
public record RefundOrder(
    Long refund_id,
    Long payment_id,
    Long amount_fen,
    String reason,
    String actor_subject_id,
    String status,
    java.time.LocalDateTime created_at
) { }
