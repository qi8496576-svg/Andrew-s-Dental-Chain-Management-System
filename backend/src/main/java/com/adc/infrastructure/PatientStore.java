package com.adc.infrastructure;

import com.adc.domain.shared.DomainFailure;
import com.adc.identity.AuthSecrets;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

/** Explicit projections; Patient remains a chain-wide record without a clinic ownership column. */
@Repository
public class PatientStore {
    private final JdbcTemplate db;private final Clock clock;private final AuthSecrets secrets;
    private static final JsonMapper JSON=JsonMapper.builder().build();
    public PatientStore(JdbcTemplate db,Clock clock,AuthSecrets secrets){this.db=db;this.clock=clock;this.secrets=secrets;}
    private LocalDateTime now(){return LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC);}
    public void lock(long patient) {
        if(db.query("SELECT patient_id FROM adc_business.Patient WHERE patient_id=? FOR UPDATE",(r,n)->r.getLong(1),patient).isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");
    }
    public long lookup(String number,LocalDate birth) {
        var rows=db.query("SELECT patient_id FROM adc_business.Patient WHERE BINARY patient_number=BINARY ? AND date_of_birth=?",(r,n)->r.getLong(1),number,birth);
        if(rows.isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");return rows.getFirst();
    }
    public boolean duplicate(Map<String,Object> input) {
        return db.queryForObject("SELECT COUNT(*) FROM adc_business.Patient WHERE full_name=? AND date_of_birth=? AND phone=?",Integer.class,input.get("full_name"),input.get("date_of_birth"),input.get("phone"))>0;
    }
    public long create(Map<String,Object> fields) {
        long id=Crypto.id();db.update("INSERT INTO adc_business.Patient (patient_id,patient_number,full_name,date_of_birth,billing_address,phone,email,emergency_contact_name,emergency_contact_phone,created_at,updated_at,allergy_review_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,'NOT_REVIEWED')",id,"P"+id,fields.get("full_name"),fields.get("date_of_birth"),fields.get("billing_address"),fields.get("phone"),fields.get("email"),fields.get("emergency_contact_name"),fields.get("emergency_contact_phone"),now(),now());return id;
    }
    public Map<String,Object> raw(long patient) {
        var rows=db.query("SELECT patient_id,patient_number,full_name,date_of_birth,phone,billing_address,email,emergency_contact_name,emergency_contact_phone,allergy_review_status FROM adc_business.Patient WHERE patient_id=?",(r,n)->{
            var row=new LinkedHashMap<String,Object>();row.put("patient_id",r.getString(1));row.put("patient_number",r.getString(2));row.put("full_name",r.getString(3));row.put("date_of_birth",r.getObject(4,LocalDate.class).toString());row.put("phone",r.getString(5));row.put("billing_address",r.getString(6));row.put("email",r.getString(7));row.put("emergency_contact_name",r.getString(8));row.put("emergency_contact_phone",r.getString(9));row.put("allergy_review_status",r.getString(10));return row;
        },patient);if(rows.isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");return rows.getFirst();
    }
    public void update(long patient,Map<String,Object> patch) {
        // Names have already been validated against the domain's closed field list.
        var args=new ArrayList<Object>(patch.values());args.add(now());args.add(patient);
        String fields=patch.keySet().stream().map(key->"`"+key+"`=?").collect(java.util.stream.Collectors.joining(","));
        db.update("UPDATE adc_business.Patient SET "+fields+",updated_at=? WHERE patient_id=?",args.toArray());
    }
    public List<Long> serviceClinics(String actor,long patient,List<Long> allowed) {
        var result=new ArrayList<Long>();
        for(long clinic:allowed) {
            int audit=db.queryForObject("SELECT COUNT(*) FROM adc_audit.AuditEvent WHERE subject_id=? AND object_kind='Patient' AND object_id=? AND action IN ('lookupPatient','createPatient') AND result='SUCCESS' AND JSON_CONTAINS(clinic_scope,JSON_QUOTE(?))",Integer.class,actor,Long.toString(patient),Long.toString(clinic));
            int binding=db.queryForObject("SELECT COUNT(*) FROM adc_identity.BindingRequest WHERE reviewed_by=? AND candidate_patient_id=? AND service_clinic_id=? AND status='APPROVED'",Integer.class,actor,patient,clinic);
            int appointment=db.queryForObject("SELECT COUNT(*) FROM adc_business.Appointment WHERE patient_id=? AND clinic_id=?",Integer.class,patient,clinic);
            if(audit+binding+appointment>0)result.add(clinic);
        }
        return result;
    }
    public boolean verification(String actor,long patient,String reference,List<Long> allowed) {
        if(reference==null)return false;
        if(reference.startsWith("PV1:")) {
            String request=reference.substring(4);try{UUID.fromString(request);}catch(IllegalArgumentException error){return false;}
            for(long clinic:allowed)if(db.queryForObject("SELECT COUNT(*) FROM adc_audit.AuditEvent WHERE request_id=? AND subject_id=? AND object_kind='Patient' AND object_id=? AND action IN ('lookupPatient','createPatient') AND result='SUCCESS' AND JSON_CONTAINS(clinic_scope,JSON_QUOTE(?)) AND JSON_EXTRACT(change_summary,'$.person_confirmed')=true",Integer.class,request,actor,Long.toString(patient),Long.toString(clinic))>0)return true;
        } else {
            for(long clinic:allowed)if(db.queryForObject("SELECT COUNT(*) FROM adc_identity.BindingRequest WHERE request_id=? AND reviewed_by=? AND candidate_patient_id=? AND service_clinic_id=? AND status='APPROVED' AND JSON_EXTRACT(verification_basis,'$.person_confirmed')=true",Integer.class,reference,actor,patient,clinic)>0)return true;
        }
        return false;
    }
    public List<Map<String,Object>> allergyRows(long patient) {
        return db.query("SELECT p.allergy_id,a.allergy_name,p.severity_note,p.clinical_note,p.is_retracted,p.audit_history FROM adc_business.PatientAllergy p JOIN adc_business.Allergy a ON a.allergy_id=p.allergy_id WHERE p.patient_id=? ORDER BY p.allergy_id",(r,n)->{
            var row=new LinkedHashMap<String,Object>();row.put("allergy_id",r.getString(1));row.put("allergy_name",r.getString(2));row.put("severity_note",r.getString(3));row.put("clinical_note",r.getString(4));row.put("is_retracted",r.getBoolean(5));row.put("audit_history",JSON.readTree(r.getString(6)));return row;
        },patient);
    }
    public Map<String,Object> allergyView(Map<String,Object> row) {
        var view=new LinkedHashMap<>(row);view.remove("audit_history");view.put("etag",CanonicalJson.etag(JSON.writeValueAsString(row)));return view;
    }
    public String riskDigest(long patient) {
        String value=CanonicalJson.normalize(JSON.writeValueAsString(Map.of("patient_id",Long.toString(patient),"status",raw(patient).get("allergy_review_status"),"allergies",allergyRows(patient))));
        return HexFormat.of().formatHex(secrets.derive("patient-allergy-confirmation",value));
    }
    public Map<String,Object> view(long patient) {
        var view=raw(patient);String reference=null;
        var self=db.query("SELECT verification_basis FROM adc_identity.BindingEvent WHERE patient_id=? AND action='BIND' AND JSON_UNQUOTE(JSON_EXTRACT(verification_basis,'$.method'))='SELF_DECLARED' ORDER BY occurred_at LIMIT 1",(r,n)->JSON.readTree(r.getString(1)),patient);
        view.put("registration_method",self.isEmpty()?"FRONTDESK":"SELF_DECLARED");
        String statement=null;
        if(!self.isEmpty()){
            var evidence=self.getFirst();String kind=evidence.get("allergy_statement").asText();
            statement=switch(kind){case "NONE"->"本人填报：无已知过敏";case "KNOWN"->"本人填报：有过敏史";default->"本人填报：不确定过敏情况";};
            var note=evidence.get("allergy_note");if(note!=null&&!note.isNull())statement+="；"+note.asText();
            if(view.get("allergy_review_status").equals("NOT_REVIEWED"))reference="SD1:"+patient+":"+riskDigest(patient);
        }
        view.put("self_reported_allergies",statement);
        if(!view.get("allergy_review_status").equals("NOT_REVIEWED")) {
            String digest=riskDigest(patient);
            int evidence=db.queryForObject("SELECT COUNT(*) FROM adc_audit.AuditEvent WHERE object_kind='Patient' AND object_id=? AND result='SUCCESS' AND action IN ('reviewPatientAllergies','addPatientAllergy','correctPatientAllergy','retractPatientAllergy') AND JSON_UNQUOTE(JSON_EXTRACT(change_summary,'$.allergy_snapshot_digest'))=?",Integer.class,Long.toString(patient),digest);
            if(evidence>0)reference="AR1:"+patient+":"+digest;
        }
        view.put("allergy_confirmation_reference",reference);return view;
    }
    public int active(long patient){return db.queryForObject("SELECT COUNT(*) FROM adc_business.PatientAllergy WHERE patient_id=? AND is_retracted=false",Integer.class,patient);}
    public void requireActiveAllergy(long allergy){if(db.queryForObject("SELECT COUNT(*) FROM adc_business.Allergy WHERE allergy_id=? AND is_active=true",Integer.class,allergy)!=1)throw new DomainFailure(422,"ALLERGY_UNAVAILABLE");}
    public void status(long patient,String status){db.update("UPDATE adc_business.Patient SET allergy_review_status=?,updated_at=? WHERE patient_id=?",status,now(),patient);}
    public void allergy(long patient,long allergy,Map<String,Object> next,Map<String,Object> history,boolean creating) {
        if(creating) {
            if(db.queryForObject("SELECT COUNT(*) FROM adc_business.Allergy WHERE allergy_id=? AND is_active=true",Integer.class,allergy)!=1)throw new DomainFailure(422,"ALLERGY_UNAVAILABLE");
            db.update("INSERT INTO adc_business.PatientAllergy (patient_id,allergy_id,noted_at,severity_note,clinical_note,is_retracted,audit_history,updated_at) VALUES (?,?,?,?,?,?,?,?)",patient,allergy,now(),next.get("severity_note"),next.get("clinical_note"),next.get("is_retracted"),JSON.writeValueAsString(List.of(history)),now());
        } else {
            var previous=allergyRows(patient).stream().filter(row->row.get("allergy_id").equals(Long.toString(allergy))).findFirst().orElseThrow(()->new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE"));
            var chain=JSON.readTree(JSON.writeValueAsString(previous.get("audit_history"))).deepCopy();((tools.jackson.databind.node.ArrayNode)chain).add(JSON.valueToTree(history));
            db.update("UPDATE adc_business.PatientAllergy SET severity_note=?,clinical_note=?,is_retracted=?,audit_history=?,updated_at=? WHERE patient_id=? AND allergy_id=?",next.get("severity_note"),next.get("clinical_note"),next.get("is_retracted"),chain.toString(),now(),patient,allergy);
        }
    }
}
