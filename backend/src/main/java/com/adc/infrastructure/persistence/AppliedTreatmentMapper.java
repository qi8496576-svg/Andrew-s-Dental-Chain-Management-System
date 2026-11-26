package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.AppliedTreatment;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface AppliedTreatmentMapper {
    AppliedTreatment findById(@Param("applied_treatment_id") Long applied_treatment_id);
}
