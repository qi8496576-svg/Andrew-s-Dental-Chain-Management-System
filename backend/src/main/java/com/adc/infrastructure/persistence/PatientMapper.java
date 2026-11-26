package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.Patient;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface PatientMapper {
    Patient findById(@Param("patient_id") Long patient_id);
}
