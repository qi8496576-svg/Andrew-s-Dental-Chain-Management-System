package com.adc.domain.model;

/** Immutable row projection; mutations use transactional billing services. */
public record RegistrationFeePolicy(
    Long clinic_id,
    Long dentist_id,
    Long amount_fen,
    java.time.LocalDateTime updated_at
) { }
