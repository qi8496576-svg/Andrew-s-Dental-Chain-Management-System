package com.adc.domain.model;

/** Immutable row projection; mutations use transactional billing services. */
public record BookingHold(
    Long hold_id,
    Long patient_id,
    Long clinic_id,
    Long dentist_id,
    Long schedule_id,
    java.time.LocalDateTime scheduled_at,
    Short slot_minutes,
    String requested_treatment_ids,
    byte[] confirmation_digest,
    java.time.LocalDateTime expires_at,
    String status,
    Long appointment_id,
    java.time.LocalDateTime created_at,
    java.time.LocalDateTime updated_at
) { }
