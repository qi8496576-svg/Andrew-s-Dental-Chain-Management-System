package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.Allergy;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface AllergyMapper {
    Allergy findById(@Param("allergy_id") Long allergy_id);
}
