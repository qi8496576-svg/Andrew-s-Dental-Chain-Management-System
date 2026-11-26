package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.infrastructure.technical.AccessGrantRecord;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface AccessGrantMapper {
    AccessGrantRecord findById(@Param("grant_id") String grant_id);
}
