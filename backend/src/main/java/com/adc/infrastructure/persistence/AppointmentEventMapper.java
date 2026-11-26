package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.AppointmentEvent;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface AppointmentEventMapper {
    AppointmentEvent findById(@Param("appointment_event_id") Long appointment_event_id);
}
