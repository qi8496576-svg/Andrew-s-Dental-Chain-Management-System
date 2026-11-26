package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.infrastructure.technical.RequestReceiptRecord;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface RequestReceiptMapper {
    RequestReceiptRecord findById(@Param("subject_id") String subject_id, @Param("operation_id") String operation_id, @Param("request_key") String request_key);
}
