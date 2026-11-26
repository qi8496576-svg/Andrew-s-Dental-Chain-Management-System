package com.adc.domain.schedules;

import com.adc.domain.patients.PatientRules;
import com.adc.domain.shared.DomainFailure;
import java.time.*;

public final class ScheduleRules {
    private ScheduleRules() { }
    public static void interval(LocalDate date,LocalTime start,LocalTime end,int slot,String note){if(date==null || start==null || end==null || start.getNano()!=0 || end.getNano()!=0 || !end.isAfter(start) || slot<1 || slot>32767 || Duration.between(start,end).getSeconds()%(slot*60L)!=0)throw new DomainFailure(422,"INVALID_SCHEDULE_INTERVAL");PatientRules.text(note,255,true);}
}
