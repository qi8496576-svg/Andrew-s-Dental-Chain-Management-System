package com.adc.infrastructure.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.adc.domain.model.DentistClinicAssignment;

/** Read-only row repository. No generic write endpoint. */
@Mapper
public interface DentistClinicAssignmentMapper {
    DentistClinicAssignment findById(@Param("assignment_id") Long assignment_id);
}
