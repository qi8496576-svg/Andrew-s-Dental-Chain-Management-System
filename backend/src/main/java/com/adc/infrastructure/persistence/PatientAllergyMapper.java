package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.PatientAllergy;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface PatientAllergyMapper {
    PatientAllergy findById(@Param("patient_id") Long patient_id, @Param("allergy_id") Long allergy_id);
}
