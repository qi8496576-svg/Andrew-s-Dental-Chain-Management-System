package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.TreatmentQualification;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface TreatmentQualificationMapper {
    TreatmentQualification findById(@Param("treatment_id") Long treatment_id, @Param("qualification_id") Long qualification_id);
}
