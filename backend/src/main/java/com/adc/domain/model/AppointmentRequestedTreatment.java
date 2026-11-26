package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record AppointmentRequestedTreatment(
    Long appointment_id,
    Long treatment_id,
    String request_note
) { }
