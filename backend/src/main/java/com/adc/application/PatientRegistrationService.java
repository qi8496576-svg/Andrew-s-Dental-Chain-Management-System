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

/** Owner-approved self-declaration creates only a new record; never claims existing medical history. */
@Service @Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
public class PatientRegistrationService implements ReceiptPolicy {
    private static final JsonMapper JSON=JsonMapper.builder().build();
    private final AtomicCommandExecutor commands;private final IdentityGate gate;private final PatientStore patients;private final PatientBindingStore bindings;private final Clock clock;
    public PatientRegistrationService(AtomicCommandExecutor commands,IdentityGate gate,PatientStore patients,PatientBindingStore bindings,Clock clock){this.commands=commands;this.gate=gate;this.patients=patients;this.bindings=bindings;this.clock=clock;}
    private void nativeActor(IdentityGate.Identity actor){if(!actor.subjectType().equals("PATIENT"))throw new DomainFailure(403,"ACCESS_DENIED");}
    public Map<String,Object> register(AtomicCommandExecutor.Command command,long clinic,Map<String,Object> details,String allergyStatus,String allergyNote,boolean consent)throws Exception{
        var result=commands.executeWithLocks(command,List.of(TransactionLocks.name("patient-create","duplicate-review")),this::nativeActor,actor->{
            bindings.clinic(clinic);PatientRules.details(details,false);
            if(!consent)throw new DomainFailure(422,"SELF_DECLARATION_REQUIRED");
            if(!Set.of("NONE","KNOWN","UNSURE").contains(Objects.requireNonNullElse(allergyStatus,"")))throw new DomainFailure(422,"SELF_DECLARATION_REQUIRED");
            PatientRules.text(allergyNote,500,!allergyStatus.equals("KNOWN"));
            if(LocalDate.parse((String)details.get("date_of_birth")).isAfter(clock.instant().atZone(ZoneId.of("Asia/Shanghai")).toLocalDate()))throw new DomainFailure(422,"FIELD_INVALID");
            if(bindings.binding(actor.subjectId())!=null)throw new DomainFailure(409,"PATIENT_BINDING_CONFLICT");
            if(patients.duplicate(details))throw new DomainFailure(409,"PATIENT_DUPLICATE_REVIEW_REQUIRED");
            long patient=patients.create(details);var view=patients.raw(patient);
            var evidence=new LinkedHashMap<String,Object>();evidence.put("method","SELF_DECLARED");evidence.put("person_confirmed",false);evidence.put("allergy_reviewed",false);evidence.put("consent",true);evidence.put("allergy_statement",allergyStatus);evidence.put("allergy_note",allergyNote);evidence.put("clinic_id",Long.toString(clinic));
            String request=bindings.create(actor.subjectId(),(String)view.get("patient_number"),LocalDate.parse((String)view.get("date_of_birth")),clinic);
            bindings.available(actor.subjectId(),patient);bindings.approve(bindings.request(request),patient,actor.subjectId(),evidence,"SELF_REGISTRATION_NO_CLINICAL_VERIFICATION");bindings.bind(actor.subjectId(),patient,actor.subjectId(),request);bindings.event("BIND",patient,null,actor.subjectId(),actor.subjectId(),request,evidence,"SELF_REGISTRATION_NO_CLINICAL_VERIFICATION",command.key());
            return new AtomicCommandExecutor.Result(JSON.writeValueAsString(List.of("Patient:"+patient)),JSON.writeValueAsString(Map.of("patient_id",Long.toString(patient))),200,"Patient",Long.toString(patient),List.of(clinic),"SELF_DECLARED",request,JSON.writeValueAsString(Map.of("registration_method","SELF_DECLARED","person_confirmed",false)));
        });
        var actor=gate.authenticate(command.token(),command.client());authorize(actor,"registerSelfPatient",result.refs());return patients.view(Long.parseLong(JSON.readTree(result.summary()).get("patient_id").asText()));
    }
    @Override @Transactional(propagation=Propagation.NOT_SUPPORTED)public Set<String> operations(){return Set.of("registerSelfPatient");}
    @Override public void authorize(IdentityGate.Identity actor,String operation,String refs){nativeActor(actor);if(!operation.equals("registerSelfPatient"))throw new DomainFailure(403,"ACCESS_DENIED");if(refs!=null)for(var ref:JSON.readTree(refs)){String value=ref.asText();if(!value.startsWith("Patient:"))throw new DomainFailure(403,"ACCESS_DENIED");gate.requirePatient(actor,Long.parseLong(value.substring(8)));}}
}
