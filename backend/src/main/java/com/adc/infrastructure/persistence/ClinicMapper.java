package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.Clinic;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface ClinicMapper {
    Clinic findById(@Param("clinic_id") Long clinic_id);
}
