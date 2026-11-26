package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.infrastructure.technical.SessionRecord;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface SessionMapper {
    SessionRecord findById(@Param("session_id") String session_id);
}
