package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.InvoiceItem;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface InvoiceItemMapper {
    InvoiceItem findById(@Param("invoice_item_id") Long invoice_item_id);
}
