package com.adc.domain.clinicaltreatment;
import com.adc.domain.shared.DomainFailure;
import java.time.Instant;
public final class ClinicalTreatmentRules {
    private ClinicalTreatmentRules() { }
    public static void open(String status,boolean invoice){if(!status.equals("IN_PROGRESS") || invoice)throw new DomainFailure(409,"CLINICAL_RECORD_READ_ONLY");}
    public static void performed(Instant performed,Instant attended,Instant now){if(performed==null || attended==null || performed.isBefore(attended) || performed.isAfter(now) || performed.getNano()%1000000000!=0)throw new DomainFailure(422,"INVALID_PERFORMED_TIME");}
}
