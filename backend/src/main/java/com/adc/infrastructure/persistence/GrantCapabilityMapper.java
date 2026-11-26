package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.infrastructure.technical.GrantCapabilityRecord;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface GrantCapabilityMapper {
    GrantCapabilityRecord findById(@Param("grant_id") String grant_id, @Param("capability_code") String capability_code);
}
