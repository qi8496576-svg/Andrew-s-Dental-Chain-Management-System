package com.adc.domain.patients;

import com.adc.domain.shared.DomainFailure;
import java.time.LocalDate;
import java.util.*;

public final class PatientRules {
    private PatientRules() { }
    private static final Map<String,Integer> FIELDS=Map.of("full_name",100,"date_of_birth",10,"phone",30,"billing_address",255,"email",254,"emergency_contact_name",100,"emergency_contact_phone",30);
    public static void text(String value,int maximum,boolean nullable) {
        if(value==null && nullable)return;
        if(value==null || value.isBlank())throw new DomainFailure(422,"FIELD_REQUIRED");
        if(value.codePointCount(0,value.length())>maximum)throw new DomainFailure(422,"FIELD_INVALID");
    }
    public static void details(Map<String,Object> input,boolean patch) {
        if(input==null || input.isEmpty() || !FIELDS.keySet().containsAll(input.keySet()))throw new DomainFailure(400,"INVALID_REQUEST");
        if(!patch && !input.keySet().containsAll(Set.of("full_name","date_of_birth","phone")))throw new DomainFailure(422,"FIELD_REQUIRED");
        for(var field:input.entrySet()) {
            if(field.getValue()!=null && !(field.getValue() instanceof String))throw new DomainFailure(400,"INVALID_REQUEST");
            text((String)field.getValue(),FIELDS.get(field.getKey()),Set.of("email","billing_address","emergency_contact_name","emergency_contact_phone").contains(field.getKey()));
            if(field.getKey().equals("date_of_birth"))try {LocalDate.parse((String)field.getValue());}catch(java.time.DateTimeException e){throw new DomainFailure(400,"INVALID_REQUEST");}
        }
    }
    public static void review(String status,int active) {
        if(!Set.of("NOT_REVIEWED","NO_KNOWN","RECORDED").contains(Objects.requireNonNullElse(status,"")))throw new DomainFailure(400,"INVALID_REQUEST");
        if((status.equals("RECORDED") && active==0) || (status.equals("NO_KNOWN") && active>0))throw new DomainFailure(422,"ALLERGY_REVIEW_CONFLICT");
    }
    public static void notes(Map<String,Object> patch) {
        if(patch==null || !Set.of("severity_note","clinical_note").containsAll(patch.keySet()))throw new DomainFailure(400,"INVALID_REQUEST");
        for(var entry:patch.entrySet()) {
            if(entry.getValue()!=null && !(entry.getValue() instanceof String))throw new DomainFailure(400,"INVALID_REQUEST");
            if(entry.getValue()!=null && ((String)entry.getValue()).codePointCount(0,((String)entry.getValue()).length())>(entry.getKey().equals("severity_note")?100:255))throw new DomainFailure(422,"FIELD_INVALID");
        }
    }
}
