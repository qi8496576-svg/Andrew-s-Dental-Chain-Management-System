package com.adc.infrastructure.persistence;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.PaymentOrder;
@Mapper
public interface PaymentOrderMapper {
    PaymentOrder findById(@Param("payment_id") Long payment_id);
}
