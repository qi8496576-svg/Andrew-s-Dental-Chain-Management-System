package com.adc.application;

import com.adc.domain.patientbindings.PatientBindingRules;
import com.adc.domain.shared.DomainFailure;
import com.adc.identity.IdentityGate;
import com.adc.identity.IdentityGate.Identity;
import com.adc.infrastructure.*;
import java.time.LocalDate;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@Service
@Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
public class PatientBindingService implements ReceiptPolicy {
    private final AtomicCommandExecutor commands;private final IdentityGate gate;private final PatientBindingStore store;private final PatientStore patients;private final AuditWriter audit;
    private static final JsonMapper JSON=JsonMapper.builder().build();
    public PatientBindingService(AtomicCommandExecutor commands,IdentityGate gate,PatientBindingStore store,PatientStore patients,AuditWriter audit){this.commands=commands;this.gate=gate;this.store=store;this.patients=patients;this.audit=audit;}
    public record Verification(long clinic,boolean patientNumberChecked,boolean dateOfBirthChecked,boolean personConfirmed,String serviceBasis) {
        Map<String,Object> evidence(){return Map.of("clinic_id",Long.toString(clinic),"patient_number_checked",patientNumberChecked,"date_of_birth_checked",dateOfBirthChecked,"person_confirmed",personConfirmed,"service_basis",serviceBasis);}
    }
    private void nativeActor(Identity actor){if(!actor.subjectType().equals("PATIENT"))throw new DomainFailure(403,"ACCESS_DENIED");}
    private void scope(Identity actor,String operation,Verification basis,String reason){if(basis==null)throw new DomainFailure(422,"FIELD_REQUIRED");gate.requireStaff(actor,"RECEPTION",operation,basis.clinic);PatientBindingRules.confirmed(basis.patientNumberChecked,basis.dateOfBirthChecked,basis.personConfirmed,basis.serviceBasis,reason);}
    private void requestScope(Identity actor,String operation,PatientBindingStore.Request request){gate.requireStaff(actor,"RECEPTION",operation,request.clinic());}
    private AtomicCommandExecutor.Command locked(AtomicCommandExecutor.Command command,String...subjects){var all=new HashSet<>(command.lockedSubjects());Collections.addAll(all,subjects);return new AtomicCommandExecutor.Command(command.token(),command.client(),command.operation(),command.key(),command.hash(),command.requestId(),all);}
    private AtomicCommandExecutor.Result result(String request,String subject,long clinic,String reason,String verification,int status){var refs=new ArrayList<String>();refs.add("Subject:"+subject);refs.add("Clinic:"+clinic);if(request!=null)refs.add("BindingRequest:"+request);return new AtomicCommandExecutor.Result(JSON.writeValueAsString(refs),JSON.writeValueAsString(Map.of("subject_id",subject,"request_id",Objects.requireNonNullElse(request,""))),status,"PatientBinding",subject,List.of(clinic),reason,verification);}
    public Map<String,Object> request(AtomicCommandExecutor.Command command,String number,LocalDate birth,long clinic)throws Exception{
        var result=commands.execute(command,actor->{nativeActor(actor);store.clinic(clinic);},actor->{PatientBindingRules.hints(number,birth);if(store.binding(actor.subjectId())!=null)throw new DomainFailure(409,"PATIENT_BINDING_CONFLICT");String id=store.create(actor.subjectId(),number,birth,clinic);return result(id,actor.subjectId(),clinic,null,null,200);});
        var actor=gate.authenticate(command.token(),command.client());nativeActor(actor);var row=store.request(JSON.readTree(result.summary()).get("request_id").asText());if(!row.subject().equals(actor.subjectId()))throw new DomainFailure(403,"ACCESS_DENIED");return store.requestView(row);
    }
    public Map<String,Object> current(String token,String client,String request){var actor=gate.authenticate(token,client);nativeActor(actor);var binding=store.binding(actor.subjectId());if(binding==null)throw new DomainFailure(404,"PATIENT_BINDING_REQUIRED");gate.requirePatient(actor,Long.parseLong((String)binding.get("patient_id")));audit.success(actor,"getPatientBinding","PatientBinding",actor.subjectId(),List.of(),request);return binding;}
    public Map<String,Object> list(String token,String client,String cursor,int limit,String request){var actor=gate.authenticate(token,client);var clinics=gate.staffClinics(actor,"RECEPTION","listBindingRequests");if(limit<1 || limit>100)throw new DomainFailure(400,"INVALID_REQUEST");String after="";if(cursor!=null)try{after=new String(Base64.getUrlDecoder().decode(cursor),StandardCharsets.UTF_8);UUID.fromString(after);}catch(IllegalArgumentException error){throw new DomainFailure(400,"INVALID_REQUEST");}var rows=store.list(clinics,after,limit+1);String next=null;if(rows.size()>limit){rows=rows.subList(0,limit);next=Base64.getUrlEncoder().withoutPadding().encodeToString(rows.getLast().id().getBytes(StandardCharsets.UTF_8));}audit.success(actor,"listBindingRequests","BindingRequest",null,clinics,request);var result=new LinkedHashMap<String,Object>();result.put("items",rows.stream().map(store::requestView).toList());result.put("next_cursor",next);return result;}
    private void verify(PatientBindingStore.Request request,long patient,Verification basis){if(request.clinic()!=basis.clinic)throw new DomainFailure(422,"VERIFICATION_CLINIC_MISMATCH");patients.lock(patient);PatientBindingRules.matches(request.number(),request.birth(),patients.raw(patient));store.nativeSubject(request.subject());}
    private Map<String,Object> resolved(AtomicCommandExecutor.Command command,AtomicCommandExecutor.Result result){var actor=gate.authenticate(command.token(),command.client());authorize(actor,command.operation(),result.refs());String subject=JSON.readTree(result.summary()).get("subject_id").asText();var binding=store.binding(subject);if(binding==null)throw new DomainFailure(409,"BINDING_CHANGED");return binding;}
    public Map<String,Object> approve(AtomicCommandExecutor.Command command,String requestId,long patient,Verification basis,String reason)throws Exception{
        var hint=store.request(requestId);var result=commands.execute(locked(command,hint.subject()),actor->{scope(actor,"approvePatientBinding",basis,reason);requestScope(actor,"approvePatientBinding",hint);},actor->{var request=store.request(requestId);verify(request,patient,basis);store.available(request.subject(),patient);store.approve(request,patient,actor.subjectId(),basis.evidence(),reason);store.bind(request.subject(),patient,actor.subjectId(),requestId);store.event("BIND",patient,null,request.subject(),actor.subjectId(),requestId,basis.evidence(),reason,command.key());return result(requestId,request.subject(),basis.clinic,reason,requestId,200);});return resolved(command,result);
    }
    public Map<String,Object> rebind(AtomicCommandExecutor.Command command,String oldSubject,String newSubject,String requestId,Verification basis,String reason)throws Exception{
        var hint=store.request(requestId);var result=commands.execute(locked(command,oldSubject,newSubject,hint.subject()),actor->{scope(actor,"rebindPatient",basis,reason);requestScope(actor,"rebindPatient",hint);},actor->{var request=store.request(requestId);if(oldSubject.equals(newSubject) || !request.subject().equals(newSubject))throw new DomainFailure(422,"BINDING_REQUEST_MISMATCH");var old=store.binding(oldSubject);if(old==null)throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");long patient=Long.parseLong((String)old.get("patient_id"));verify(request,patient,basis);store.unbind(oldSubject);store.available(newSubject,patient);store.approve(request,patient,actor.subjectId(),basis.evidence(),reason);store.bind(newSubject,patient,actor.subjectId(),requestId);store.event("REBIND",patient,oldSubject,newSubject,actor.subjectId(),requestId,basis.evidence(),reason,command.key());return result(requestId,newSubject,basis.clinic,reason,requestId,200);});return resolved(command,result);
    }
    public void revoke(AtomicCommandExecutor.Command command,String subject,Verification basis,String reason)throws Exception{
        commands.execute(locked(command,subject),actor->scope(actor,"revokePatientBinding",basis,reason),actor->{var binding=store.binding(subject);if(binding==null)throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");long patient=Long.parseLong((String)binding.get("patient_id"));patients.lock(patient);store.nativeSubject(subject);store.clinic(basis.clinic);store.unbind(subject);store.event("UNBIND",patient,subject,null,actor.subjectId(),null,basis.evidence(),reason,command.key());return result(null,subject,basis.clinic,reason,null,204);});
    }
    @Override @Transactional(propagation=Propagation.NOT_SUPPORTED) public Set<String> operations(){return Set.of("requestPatientBinding","approvePatientBinding","rebindPatient","revokePatientBinding");}
    @Override public void authorize(Identity actor,String operation,String refs){if(!operations().contains(operation))throw new DomainFailure(403,"ACCESS_DENIED");if(operation.equals("requestPatientBinding"))nativeActor(actor);else gate.staffClinics(actor,"RECEPTION",operation);if(refs==null)return;String subject=null,request=null;for(var node:JSON.readTree(refs)){String ref=node.asText();if(ref.startsWith("Clinic:") && !operation.equals("requestPatientBinding"))gate.requireStaff(actor,"RECEPTION",operation,Long.parseLong(ref.substring(7)));else if(ref.startsWith("Subject:"))subject=ref.substring(8);else if(ref.startsWith("BindingRequest:"))request=ref.substring(15);}
        if(operation.equals("requestPatientBinding")){if(!actor.subjectId().equals(subject) || request==null || !store.request(request).subject().equals(subject))throw new DomainFailure(403,"ACCESS_DENIED");}
        else if(!operation.equals("revokePatientBinding")){var binding=store.binding(subject);if(binding==null || !Objects.equals(request,binding.get("verification_reference")))throw new DomainFailure(409,"BINDING_CHANGED");}
    }
}
