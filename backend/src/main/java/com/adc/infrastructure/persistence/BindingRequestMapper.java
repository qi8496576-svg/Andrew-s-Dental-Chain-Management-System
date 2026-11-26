package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.infrastructure.technical.BindingRequestRecord;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface BindingRequestMapper {
    BindingRequestRecord findById(@Param("request_id") String request_id);
}
