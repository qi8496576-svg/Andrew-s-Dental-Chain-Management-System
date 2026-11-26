package com.adc.domain.appointmentnoshow;
import com.adc.domain.shared.DomainFailure;
import java.time.Instant;
public final class AppointmentNoShowRules {
    private AppointmentNoShowRules() { }
    public static void require(String status,String schedule,boolean attended,Instant start,int slotMinutes,Instant now){if(!status.equals("SCHEDULED") || attended)throw new DomainFailure(409,"APPOINTMENT_STATE_CONFLICT");if(!schedule.equals("NORMAL"))throw new DomainFailure(409,"USE_CLINIC_RESCHEDULING");if(now.isBefore(start.plusSeconds(slotMinutes*60L)))throw new DomainFailure(409,"SLOT_NOT_ENDED");}
}
