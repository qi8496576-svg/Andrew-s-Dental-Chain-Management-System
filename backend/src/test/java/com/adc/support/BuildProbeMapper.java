package com.adc.support;

import org.apache.ibatis.annotations.Mapper;

/** Test-only mapper: never packaged into the application or used as a business endpoint. */
@Mapper
public interface BuildProbeMapper {
    int probe();
}
