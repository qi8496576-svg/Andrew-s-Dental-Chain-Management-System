package com.adc.domain.organizationresources;

import java.util.*;

/** Closed SQL identifiers and input types from the approved five resource input schemas. */
public enum ResourceKind {
    CLINIC("clinics","Clinic","clinic_id","clinic_code",true,List.of(new Field("clinic_code",Type.TEXT,false,true,20,null),new Field("postal_address",Type.TEXT,false,true,255,null),new Field("manager_name",Type.TEXT,true,false,100,null),new Field("phone",Type.TEXT,false,true,30,null),new Field("email",Type.TEXT,true,false,254,null),new Field("office_area_sqm",Type.DECIMAL,true,false,0,"^-?[0-9]{1,6}\\.[0-9]{2}$"),new Field("is_active",Type.BOOLEAN,false,true,0,null))),
    DENTIST("dentists","Dentist","dentist_id","full_name",true,List.of(new Field("employee_number",Type.TEXT,false,true,30,null),new Field("full_name",Type.TEXT,false,true,100,null),new Field("date_of_birth",Type.DATE,false,true,0,null),new Field("home_address",Type.TEXT,true,false,255,null),new Field("phone",Type.TEXT,false,true,30,null),new Field("email",Type.TEXT,true,false,254,null),new Field("hire_date",Type.DATE,false,true,0,null),new Field("is_active",Type.BOOLEAN,false,true,0,null),new Field("termination_date",Type.DATE,true,false,0,null),new Field("professional_title",Type.TEXT,true,false,40,null),new Field("specialty",Type.TEXT,true,false,255,null),new Field("introduction",Type.TEXT,true,false,1000,null))),
    QUALIFICATION("qualifications","Qualification","qualification_id","qualification_name",false,List.of(new Field("qualification_name",Type.TEXT,false,true,120,null),new Field("description",Type.TEXT,true,false,255,null),new Field("is_active",Type.BOOLEAN,false,true,0,null))),
    TREATMENT("treatments","Treatment","treatment_id","treatment_name",false,List.of(new Field("treatment_code",Type.TEXT,false,true,30,null),new Field("treatment_name",Type.TEXT,false,true,120,null),new Field("description",Type.TEXT,true,false,255,null),new Field("default_unit_price",Type.DECIMAL,false,true,0,"^[0-9]{1,10}\\.[0-9]{2}$"),new Field("is_active",Type.BOOLEAN,false,true,0,null))),
    ALLERGY("allergies","Allergy","allergy_id","allergy_name",false,List.of(new Field("allergy_name",Type.TEXT,false,true,100,null),new Field("description",Type.TEXT,true,false,255,null),new Field("is_active",Type.BOOLEAN,false,true,0,null)));
    public enum Type {TEXT,DATE,DECIMAL,BOOLEAN}
    public record Field(String name,Type type,boolean nullable,boolean required,int maximum,String pattern) { }
    public final String path,table,id,label;public final boolean createdAt;public final Map<String,Field> fields;
    ResourceKind(String path,String table,String id,String label,boolean createdAt,List<Field> definitions){this.path=path;this.table=table;this.id=id;this.label=label;this.createdAt=createdAt;var map=new LinkedHashMap<String,Field>();for(var field:definitions)map.put(field.name,field);fields=Collections.unmodifiableMap(map);}
    public static ResourceKind path(String path){return Arrays.stream(values()).filter(kind->kind.path.equals(path)).findFirst().orElseThrow(()->new IllegalArgumentException("Unknown resource"));}
}
