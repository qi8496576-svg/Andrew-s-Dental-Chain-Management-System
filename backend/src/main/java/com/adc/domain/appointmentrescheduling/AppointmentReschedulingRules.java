package com.adc.domain.appointmentrescheduling;
import com.adc.domain.shared.DomainFailure;
import java.time.Instant;
public final class AppointmentReschedulingRules {
    private AppointmentReschedulingRules() { }
    public static void branch(String action,Long clinic,Long schedule,Instant at){if("RESCHEDULE".equals(action)){if(clinic==null || schedule==null || at==null)throw new DomainFailure(422,"RESCHEDULE_TARGET_REQUIRED");}else if("CLINIC_CANCEL".equals(action)){if(clinic!=null || schedule!=null || at!=null)throw new DomainFailure(422,"CLINIC_CANCEL_TARGET_FORBIDDEN");}else throw new DomainFailure(400,"INVALID_REQUEST");}
    public static void source(String state,String schedule,boolean successor){if(!"SCHEDULED".equals(state) || successor)throw new DomainFailure(409,"APPOINTMENT_ALREADY_HANDLED");if(!"SUSPENDED".equals(schedule))throw new DomainFailure(409,"SOURCE_NOT_SUSPENDED");}
}
