package com.adc.domain.appointmentcancellation;
import com.adc.domain.shared.DomainFailure;
import java.time.Instant;
public final class AppointmentCancellationRules {
    private AppointmentCancellationRules() { }
    public static void require(String status,String schedule,Instant start,int minutes,Instant now,boolean patient){if(!status.equals("SCHEDULED"))throw new DomainFailure(409,"APPOINTMENT_STATE_CONFLICT");if(!schedule.equals("NORMAL"))throw new DomainFailure(409,"USE_CLINIC_RESCHEDULING");if(!now.isBefore(start.plusSeconds(minutes*60L)))throw new DomainFailure(409,"USE_NO_SHOW_REVIEW");if(patient && !now.isBefore(start))throw new DomainFailure(409,"CONTACT_RECEPTION_FOR_CANCELLATION");}
}
