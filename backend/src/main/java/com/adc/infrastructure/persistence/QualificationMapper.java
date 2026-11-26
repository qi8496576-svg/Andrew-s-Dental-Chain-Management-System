package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.Qualification;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface QualificationMapper {
    Qualification findById(@Param("qualification_id") Long qualification_id);
}
