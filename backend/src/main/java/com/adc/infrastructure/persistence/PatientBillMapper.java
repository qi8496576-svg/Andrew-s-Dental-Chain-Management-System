package com.adc.infrastructure.persistence;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.PatientBill;
@Mapper
public interface PatientBillMapper {
    PatientBill findById(@Param("bill_id") Long bill_id);
}
