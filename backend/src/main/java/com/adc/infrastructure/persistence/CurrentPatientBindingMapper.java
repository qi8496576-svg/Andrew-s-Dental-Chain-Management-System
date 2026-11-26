package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.infrastructure.technical.CurrentPatientBindingRecord;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface CurrentPatientBindingMapper {
    CurrentPatientBindingRecord findById(@Param("subject_id") String subject_id);
}
