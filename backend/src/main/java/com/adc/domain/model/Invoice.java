package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record Invoice(
    Long invoice_id,
    String invoice_number,
    Long appointment_id,
    java.time.Instant issued_at,
    java.math.BigDecimal total_amount,
    String invoice_status,
    java.time.Instant created_at
) { }
