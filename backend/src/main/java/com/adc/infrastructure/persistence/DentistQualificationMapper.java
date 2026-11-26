package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.DentistQualification;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface DentistQualificationMapper {
    DentistQualification findById(@Param("dentist_id") Long dentist_id, @Param("qualification_id") Long qualification_id);
}
