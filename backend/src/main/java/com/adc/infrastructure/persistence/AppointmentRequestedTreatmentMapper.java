package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.AppointmentRequestedTreatment;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface AppointmentRequestedTreatmentMapper {
    AppointmentRequestedTreatment findById(@Param("appointment_id") Long appointment_id, @Param("treatment_id") Long treatment_id);
}
