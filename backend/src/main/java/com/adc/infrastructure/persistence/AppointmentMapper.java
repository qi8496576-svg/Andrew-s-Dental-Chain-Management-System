package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.Appointment;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface AppointmentMapper {
    Appointment findById(@Param("appointment_id") Long appointment_id);
}
