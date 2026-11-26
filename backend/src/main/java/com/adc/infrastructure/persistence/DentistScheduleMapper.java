package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.DentistSchedule;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface DentistScheduleMapper {
    DentistSchedule findById(@Param("schedule_id") Long schedule_id);
}
