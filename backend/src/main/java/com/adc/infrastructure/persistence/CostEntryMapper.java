package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.CostEntry;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface CostEntryMapper {
    CostEntry findById(@Param("cost_entry_id") Long cost_entry_id);
}
