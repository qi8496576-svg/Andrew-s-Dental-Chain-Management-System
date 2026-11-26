package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.infrastructure.technical.ExternalIdentityRecord;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface ExternalIdentityMapper {
    ExternalIdentityRecord findById(@Param("external_identity_id") Long external_identity_id);
}
