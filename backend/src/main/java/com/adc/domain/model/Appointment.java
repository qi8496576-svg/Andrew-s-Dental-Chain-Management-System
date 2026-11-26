package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record Appointment(
    Long appointment_id,
    Long patient_id,
    Long clinic_id,
    Long dentist_id,
    Long schedule_id,
    java.time.Instant scheduled_at,
    String status,
    String problems_or_special_needs,
    java.time.Instant completed_at,
    java.time.Instant created_at,
    java.time.Instant updated_at,
    java.time.Instant attended_at,
    java.time.Instant cancelled_at,
    String cancellation_reason,
    String cancellation_kind,
    Long rescheduled_from_id
) { }
