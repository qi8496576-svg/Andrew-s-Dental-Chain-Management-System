package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.Treatment;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface TreatmentMapper {
    Treatment findById(@Param("treatment_id") Long treatment_id);
}
