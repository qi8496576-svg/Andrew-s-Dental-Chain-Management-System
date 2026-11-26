package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.QuarterlyPerformance;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface QuarterlyPerformanceMapper {
    QuarterlyPerformance findById(@Param("quarterly_performance_id") Long quarterly_performance_id);
}
