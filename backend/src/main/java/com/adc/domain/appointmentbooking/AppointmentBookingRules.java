package com.adc.domain.appointmentbooking;

import com.adc.domain.shared.DomainFailure;
import com.adc.infrastructure.ScheduleStore;
import java.time.*;

public final class AppointmentBookingRules {
    private AppointmentBookingRules() { }
    public static void slot(ScheduleStore.Schedule schedule,Instant at,Instant now){if(at==null || !at.isAfter(now) || at.getNano()!=0 || !schedule.status().equals("NORMAL") || at.isBefore(schedule.starts()) || !at.isBefore(schedule.ends()) || Duration.between(schedule.starts(),at).getSeconds()%(schedule.slot()*60L)!=0)throw new DomainFailure(422,"SLOT_UNAVAILABLE");}
}
