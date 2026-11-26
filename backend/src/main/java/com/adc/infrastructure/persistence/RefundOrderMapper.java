package com.adc.infrastructure.persistence;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.RefundOrder;
@Mapper
public interface RefundOrderMapper {
    RefundOrder findById(@Param("refund_id") Long refund_id);
}
