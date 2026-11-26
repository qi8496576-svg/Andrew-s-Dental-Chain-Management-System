package com.adc.infrastructure.persistence;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.RegistrationFeePolicy;
@Mapper
public interface RegistrationFeePolicyMapper {
    RegistrationFeePolicy findById(@Param("clinic_id") Long clinic_id, @Param("dentist_id") Long dentist_id);
}
