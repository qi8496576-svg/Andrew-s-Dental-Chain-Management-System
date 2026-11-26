package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.infrastructure.technical.GrantClinicScopeRecord;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface GrantClinicScopeMapper {
    GrantClinicScopeRecord findById(@Param("grant_id") String grant_id, @Param("clinic_id") Long clinic_id);
}
