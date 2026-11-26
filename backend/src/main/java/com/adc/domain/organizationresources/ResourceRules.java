package com.adc.domain.organizationresources;

import com.adc.domain.patients.PatientRules;
import com.adc.domain.shared.*;
import java.time.*;
import java.util.*;

public final class ResourceRules {
    private ResourceRules(){ }
    public static void fields(ResourceKind kind,Map<String,Object> input,boolean patch) {
        if(input==null || input.isEmpty() || !kind.fields.keySet().containsAll(input.keySet()))throw new DomainFailure(400,"INVALID_REQUEST");
        if(!patch)for(var field:kind.fields.values())if(field.required() && !input.containsKey(field.name()))throw new DomainFailure(422,"FIELD_REQUIRED");
        for(var entry:input.entrySet()) {
            var field=kind.fields.get(entry.getKey());var value=entry.getValue();
            if(value==null){if(!field.nullable())throw new DomainFailure(422,"FIELD_REQUIRED");continue;}
            if(field.type()==ResourceKind.Type.BOOLEAN){if(!(value instanceof Boolean))throw new DomainFailure(400,"INVALID_REQUEST");continue;}
            if(!(value instanceof String text))throw new DomainFailure(400,"INVALID_REQUEST");
            if(field.required() && text.isBlank())throw new DomainFailure(422,"FIELD_REQUIRED");
            if(field.maximum()>0 && text.codePointCount(0,text.length())>field.maximum())throw new DomainFailure(422,"FIELD_INVALID");
            if(field.pattern()!=null && !text.matches(field.pattern()))throw new DomainFailure(422,"FIELD_INVALID");
            if(field.type()==ResourceKind.Type.DATE)date(text);
        }
    }
    public static LocalDate date(Object value){if(!(value instanceof String text))throw new DomainFailure(400,"INVALID_REQUEST");try{return LocalDate.parse(text);}catch(DateTimeException error){throw new DomainFailure(400,"INVALID_REQUEST");}}
    public static String text(Object value,int maximum,boolean nullable){if(value!=null && !(value instanceof String))throw new DomainFailure(400,"INVALID_REQUEST");PatientRules.text((String)value,maximum,nullable);return (String)value;}
    public static long id(Object value){return BusinessValues.id(text(value,30,false));}
    public static boolean bool(Object value){if(!(value instanceof Boolean result))throw new DomainFailure(400,"INVALID_REQUEST");return result;}
    public static void window(Object start,Object end){if(end!=null && date(end).isBefore(date(start)))throw new DomainFailure(422,"DATE_RANGE_INVALID");}
    public static void dentistDates(Map<String,Object> data){window(data.get("hire_date"),data.get("termination_date"));}
    public static void closed(Map<String,Object> input,Set<String> fields){if(input==null || !fields.containsAll(input.keySet()))throw new DomainFailure(400,"INVALID_REQUEST");}
}
