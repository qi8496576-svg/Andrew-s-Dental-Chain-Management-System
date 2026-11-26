package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record DentistSchedule(
    Long schedule_id,
    Long dentist_id,
    Long clinic_id,
    java.time.LocalDate schedule_date,
    java.time.LocalTime start_time,
    java.time.LocalTime end_time,
    Short slot_minutes,
    String schedule_status,
    String note,
    java.time.Instant created_at
) { }
