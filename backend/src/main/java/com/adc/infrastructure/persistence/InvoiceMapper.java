package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.Invoice;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface InvoiceMapper {
    Invoice findById(@Param("invoice_id") Long invoice_id);
}
