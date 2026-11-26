package com.adc.domain.model;

/** Immutable row projection; mutations use transactional billing services. */
public record PaymentOrder(
    Long payment_id,
    Long bill_id,
    Long amount_fen,
    String mode,
    String status,
    java.time.LocalDateTime paid_at,
    java.time.LocalDateTime created_at
) { }
