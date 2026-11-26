package com.adc.domain.model;

/** Immutable row projection; mutations use transactional billing services. */
public record PatientBill(
    Long bill_id,
    Long patient_id,
    Long clinic_id,
    String kind,
    Long hold_id,
    Long appointment_id,
    Long invoice_id,
    Long amount_fen,
    String status,
    java.time.LocalDateTime created_at,
    java.time.LocalDateTime updated_at
) { }
