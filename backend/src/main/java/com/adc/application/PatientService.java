package com.adc.application;

import com.adc.domain.patients.PatientRules;
import com.adc.domain.shared.DomainFailure;
import com.adc.identity.IdentityGate;
import com.adc.infrastructure.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@Service
@Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
public class PatientService implements ReceiptPolicy {
    private static final JsonMapper JSON=JsonMapper.builder().build();
    private final AtomicCommandExecutor commands;private final IdentityGate gate;private final PatientStore store;private final AuditWriter audit;private final Clock clock;
    public PatientService(AtomicCommandExecutor commands,IdentityGate gate,PatientStore store,AuditWriter audit,Clock clock){this.commands=commands;this.gate=gate;this.store=store;this.audit=audit;this.clock=clock;}
    public record Verification(long clinic,boolean personConfirmed,String serviceBasis) { }
    private List<Long> verificationContext(IdentityGate.Identity actor,String capability,Verification basis) {
        if(basis==null)throw new DomainFailure(422,"FIELD_REQUIRED");gate.requireStaff(actor,"RECEPTION",capability,basis.clinic);
        PatientRules.text(basis.serviceBasis,255,false);if(!basis.personConfirmed)throw new DomainFailure(422,"IDENTITY_VERIFICATION_REQUIRED");return List.of(basis.clinic);
    }
    private List<Long> access(IdentityGate.Identity actor,long patient,String operation) {
        if(actor.subjectType().equals("PATIENT") && Set.of("getPatient","listPatientAllergies").contains(operation)){gate.requirePatient(actor,patient);return List.of();}
        var allowed=gate.staffClinics(actor,"RECEPTION",operation);var scopes=store.serviceClinics(actor.subjectId(),patient,allowed);
        if(scopes.isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");return scopes;
    }
    private void proof(IdentityGate.Identity actor,long patient,String operation,String reference) {
        if(!store.verification(actor.subjectId(),patient,reference,gate.staffClinics(actor,"RECEPTION",operation)))throw new DomainFailure(403,"PATIENT_VERIFICATION_REQUIRED");
    }
    private AtomicCommandExecutor.Result result(long patient,List<Long> clinics,String reason,String verification,Map<String,Object> changes,boolean lookup) {
        var minimal=new LinkedHashMap<String,Object>();minimal.put("patient_id",Long.toString(patient));if(lookup)minimal.put("verification_reference",verification);
        return new AtomicCommandExecutor.Result(JSON.writeValueAsString(List.of("Patient:"+patient)),JSON.writeValueAsString(minimal),200,"Patient",Long.toString(patient),clinics,reason,verification,JSON.writeValueAsString(changes));
    }
    private Map<String,Object> resolved(AtomicCommandExecutor.Command command,AtomicCommandExecutor.Result result,boolean lookup) {
        var minimal=JSON.readTree(result.summary());long patient=Long.parseLong(minimal.get("patient_id").asText());
        var actor=gate.authenticate(command.token(),command.client());
        String capability=command.operation().equals("lookupPatient")?"getPatient":command.operation();
        var scope=access(actor,patient,capability);store.lock(patient);var view=store.view(patient);
        audit.success(actor,"getPatient","Patient",Long.toString(patient),scope,command.requestId());
        return lookup?Map.of("patient",view,"verification_reference",minimal.get("verification_reference").asText()):view;
    }
    public Map<String,Object> create(AtomicCommandExecutor.Command command,Map<String,Object> details,Verification basis,boolean duplicateReviewed,String reviewReason)throws Exception {
        var scope=new java.util.concurrent.atomic.AtomicReference<List<Long>>();
        // Acquire the empty-table duplicate guard together with the request lock, in one sorted set.
        // One short creation guard also respects MySQL's configured text comparison semantics.
        var result=commands.executeWithLocks(command,List.of(TransactionLocks.name("patient-create","duplicate-review")),actor->scope.set(verificationContext(actor,"createPatient",basis)),actor->{
            PatientRules.details(details,false);
            if(store.duplicate(details)) {if(!duplicateReviewed)throw new DomainFailure(409,"PATIENT_DUPLICATE_REVIEW_REQUIRED");PatientRules.text(reviewReason,255,false);}
            if(reviewReason!=null)PatientRules.text(reviewReason,255,true);
            long patient=store.create(details);var evidence=new LinkedHashMap<String,Object>();evidence.put("person_confirmed",true);evidence.put("duplicate_reviewed",duplicateReviewed);evidence.put("review_reason",reviewReason);
            return result(patient,scope.get(),basis.serviceBasis,"PV1:"+command.requestId(),evidence,false);
        });return resolved(command,result,false);
    }
    public Map<String,Object> lookup(AtomicCommandExecutor.Command command,String number,LocalDate birth,Verification basis)throws Exception {
        var scope=new java.util.concurrent.atomic.AtomicReference<List<Long>>();
        var result=commands.execute(command,actor->scope.set(verificationContext(actor,"getPatient",basis)),actor->{
            PatientRules.text(number,30,false);if(birth==null)throw new DomainFailure(422,"FIELD_REQUIRED");
            long patient=store.lookup(number,birth);store.lock(patient);var current=store.raw(patient);
            if(!number.equals(current.get("patient_number")) || !birth.toString().equals(current.get("date_of_birth")))throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");
            return result(patient,scope.get(),basis.serviceBasis,"PV1:"+command.requestId(),Map.of("person_confirmed",true),true);
        });return resolved(command,result,true);
    }
    public Map<String,Object> get(String token,String client,long patient,String request) {
        var actor=new IdentityGate.Identity[1];AuditWriter.onRollback(audit,()->actor[0],"getPatient",request);
        actor[0]=gate.authenticate(token,client);var scope=access(actor[0],patient,"getPatient");store.lock(patient);
        var view=store.view(patient);audit.success(actor[0],"getPatient","Patient",Long.toString(patient),scope,request);return view;
    }
    public Map<String,Object> update(AtomicCommandExecutor.Command command,long patient,Map<String,Object> patch,String etag)throws Exception {
        var scope=new java.util.concurrent.atomic.AtomicReference<List<Long>>();
        var result=commands.execute(command,actor->{scope.set(access(actor,patient,"updatePatient"));store.lock(patient);},actor->{
            PatientRules.details(patch,true);var old=store.view(patient);CanonicalJson.requireMatch(etag,JSON.writeValueAsString(old));
            var changed=new LinkedHashMap<String,Object>();for(String field:patch.keySet()){var diff=new LinkedHashMap<String,Object>();diff.put("old",old.get(field));diff.put("new",patch.get(field));changed.put(field,diff);}
            store.update(patient,patch);return result(patient,scope.get(),"VERIFIED_PATIENT_CORRECTION",null,changed,false);
        });return resolved(command,result,false);
    }
    public Map<String,Object> review(AtomicCommandExecutor.Command command,long patient,String status,String reference,String reason)throws Exception {
        var scope=new java.util.concurrent.atomic.AtomicReference<List<Long>>();
        var result=commands.execute(command,actor->{scope.set(access(actor,patient,"reviewPatientAllergies"));store.lock(patient);},actor->{
            proof(actor,patient,"reviewPatientAllergies",reference);PatientRules.text(reason,255,false);PatientRules.review(status,store.active(patient));
            String old=(String)store.raw(patient).get("allergy_review_status");store.status(patient,status);
            return result(patient,scope.get(),reason,reference,Map.of("old_status",old,"new_status",status,"allergy_snapshot_digest",store.riskDigest(patient)),false);
        });return resolved(command,result,false);
    }
    public Map<String,Object> addAllergy(AtomicCommandExecutor.Command command,long patient,long allergy,String severity,String clinical,String reference,String reason)throws Exception {
        var notes=new LinkedHashMap<String,Object>();notes.put("severity_note",severity);notes.put("clinical_note",clinical);
        return changeAllergy(command,patient,allergy,notes,reference,reason,null,"ADD");
    }
    public Map<String,Object> correctAllergy(AtomicCommandExecutor.Command command,long patient,long allergy,Map<String,Object> patch,String reference,String reason,String etag)throws Exception {return changeAllergy(command,patient,allergy,patch,reference,reason,etag,"CORRECT");}
    public Map<String,Object> retractAllergy(AtomicCommandExecutor.Command command,long patient,long allergy,String reference,String reason,String etag)throws Exception {return changeAllergy(command,patient,allergy,Map.of(),reference,reason,etag,"RETRACT");}
    private Map<String,Object> changeAllergy(AtomicCommandExecutor.Command command,long patient,long allergy,Map<String,Object> patch,String reference,String reason,String etag,String action)throws Exception {
        String operation=switch(action){case "ADD"->"addPatientAllergy";case "CORRECT"->"correctPatientAllergy";default->"retractPatientAllergy";};
        var scope=new java.util.concurrent.atomic.AtomicReference<List<Long>>();
        var result=commands.execute(command,actor->{scope.set(access(actor,patient,operation));store.lock(patient);},actor->{
            proof(actor,patient,operation,reference);PatientRules.text(reason,255,false);PatientRules.notes(patch);
            var previous=store.allergyRows(patient).stream().filter(row->row.get("allergy_id").equals(Long.toString(allergy))).findFirst().orElse(null);
            if(!action.equals("ADD")) {
                if(previous==null)throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");
                CanonicalJson.requireMatch(etag,JSON.writeValueAsString(previous));
                if((Boolean)previous.get("is_retracted"))throw new DomainFailure(409,"STATE_CONFLICT");
            } else if(previous!=null && !(Boolean)previous.get("is_retracted"))throw new DomainFailure(409,"STATE_CONFLICT");
            if(action.equals("ADD"))store.requireActiveAllergy(allergy);
            var next=new LinkedHashMap<String,Object>();next.put("severity_note",previous==null?null:previous.get("severity_note"));next.put("clinical_note",previous==null?null:previous.get("clinical_note"));next.putAll(patch);next.put("is_retracted",action.equals("RETRACT"));
            var history=new LinkedHashMap<String,Object>();history.put("action",action);history.put("old_value",previous==null?null:store.allergyView(previous));history.put("new_value",next);history.put("verified_by",actor.subjectId());history.put("verified_at",clock.instant().toString());history.put("verification_reference",reference);history.put("reason",reason);
            store.allergy(patient,allergy,next,history,previous==null);store.status(patient,store.active(patient)>0?"RECORDED":"NOT_REVIEWED");
            return result(patient,scope.get(),reason,reference,Map.of("allergy_id",Long.toString(allergy),"action",action,"allergy_snapshot_digest",store.riskDigest(patient)),false);
        });return resolved(command,result,false);
    }
    public Map<String,Object> allergies(String token,String client,long patient,String cursor,int limit,String request) {
        var actor=new IdentityGate.Identity[1];AuditWriter.onRollback(audit,()->actor[0],"listPatientAllergies",request);
        actor[0]=gate.authenticate(token,client);var scope=access(actor[0],patient,"listPatientAllergies");store.lock(patient);
        if(limit<1 || limit>100)throw new DomainFailure(400,"INVALID_REQUEST");long after=0;
        if(cursor!=null)try{after=com.adc.domain.shared.BusinessValues.id(new String(Base64.getUrlDecoder().decode(cursor),java.nio.charset.StandardCharsets.UTF_8));}catch(IllegalArgumentException e){throw new DomainFailure(400,"INVALID_REQUEST");}
        final long boundary=after;var rows=store.allergyRows(patient).stream().filter(row->Long.parseLong((String)row.get("allergy_id"))>boundary).limit(limit+1L).toList();
        String next=null;if(rows.size()>limit){rows=rows.subList(0,limit);next=Base64.getUrlEncoder().withoutPadding().encodeToString(((String)rows.getLast().get("allergy_id")).getBytes(java.nio.charset.StandardCharsets.UTF_8));}
        audit.success(actor[0],"listPatientAllergies","Patient",Long.toString(patient),scope,request);var page=new LinkedHashMap<String,Object>();page.put("items",rows.stream().map(store::allergyView).toList());page.put("next_cursor",next);return page;
    }
    @Override @Transactional(propagation=Propagation.NOT_SUPPORTED)
    public Set<String> operations(){return Set.of("createPatient","lookupPatient","updatePatient","reviewPatientAllergies","addPatientAllergy","correctPatientAllergy","retractPatientAllergy");}
    @Override public void authorize(IdentityGate.Identity actor,String operation,String refs) {
        if(!operations().contains(operation))throw new DomainFailure(403,"ACCESS_DENIED");String capability=operation.equals("lookupPatient")?"getPatient":operation;
        gate.staffClinics(actor,"RECEPTION",capability);
        if(refs!=null)for(var ref:JSON.readTree(refs)){String value=ref.asText();if(!value.startsWith("Patient:"))throw new DomainFailure(403,"ACCESS_DENIED");access(actor,Long.parseLong(value.substring(8)),capability);}
    }
}
