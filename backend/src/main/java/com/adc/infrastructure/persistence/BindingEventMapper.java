package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.infrastructure.technical.BindingEventRecord;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface BindingEventMapper {
    BindingEventRecord findById(@Param("event_id") String event_id);
}
