package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record AppointmentEvent(
    Long appointment_event_id,
    Long appointment_id,
    String event_type,
    String from_status,
    String to_status,
    java.time.Instant occurred_at,
    String actor_role,
    String actor_reference,
    String reason,
    String request_key,
    String details
) { }
