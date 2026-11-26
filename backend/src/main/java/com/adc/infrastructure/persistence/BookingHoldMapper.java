package com.adc.infrastructure.persistence;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.BookingHold;
@Mapper
public interface BookingHoldMapper {
    BookingHold findById(@Param("hold_id") Long hold_id);
}
