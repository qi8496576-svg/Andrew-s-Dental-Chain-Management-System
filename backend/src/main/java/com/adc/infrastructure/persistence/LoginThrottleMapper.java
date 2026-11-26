package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.infrastructure.technical.LoginThrottleRecord;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface LoginThrottleMapper {
    LoginThrottleRecord findById(@Param("throttle_key") byte[] throttle_key);
}
