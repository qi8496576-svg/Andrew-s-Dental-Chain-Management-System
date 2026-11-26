package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.Dentist;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface DentistMapper {
    Dentist findById(@Param("dentist_id") Long dentist_id);
}
