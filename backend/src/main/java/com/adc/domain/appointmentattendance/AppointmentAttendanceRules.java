package com.adc.domain.appointmentattendance;
import com.adc.domain.shared.DomainFailure;
public final class AppointmentAttendanceRules {
    private AppointmentAttendanceRules() { }
    public static void require(String status,String schedule){if(!status.equals("SCHEDULED"))throw new DomainFailure(409,"APPOINTMENT_STATE_CONFLICT");if(!schedule.equals("NORMAL"))throw new DomainFailure(409,"SCHEDULE_SUSPENDED");}
}
