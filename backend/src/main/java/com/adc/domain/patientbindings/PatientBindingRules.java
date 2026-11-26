package com.adc.domain.patientbindings;

import com.adc.domain.patients.PatientRules;
import com.adc.domain.shared.DomainFailure;
import java.time.LocalDate;
import java.util.Map;

public final class PatientBindingRules {
    private PatientBindingRules() { }
    public static void hints(String number,LocalDate birth){PatientRules.text(number,30,false);if(birth==null)throw new DomainFailure(422,"FIELD_REQUIRED");}
    public static void matches(String number,LocalDate birth,Map<String,Object> patient){if(!number.equals(patient.get("patient_number")) || !birth.toString().equals(patient.get("date_of_birth")))throw new DomainFailure(422,"PATIENT_VERIFICATION_MISMATCH");}
    public static void confirmed(boolean number,boolean birth,boolean person,String basis,String reason){PatientRules.text(basis,255,false);PatientRules.text(reason,255,false);if(!number || !birth || !person)throw new DomainFailure(422,"IDENTITY_VERIFICATION_REQUIRED");}
}
