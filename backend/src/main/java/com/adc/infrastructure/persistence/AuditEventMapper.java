package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.infrastructure.technical.AuditEventRecord;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface AuditEventMapper {
    AuditEventRecord findById(@Param("audit_id") Long audit_id);
}
