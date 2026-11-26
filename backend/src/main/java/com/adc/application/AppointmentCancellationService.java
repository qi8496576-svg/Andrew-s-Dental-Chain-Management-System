package com.adc.application;
import com.adc.domain.appointmentcancellation.AppointmentCancellationRules;
import com.adc.domain.patients.PatientRules;
import com.adc.domain.shared.DomainFailure;
import com.adc.identity.IdentityGate;
import com.adc.infrastructure.*;
import java.time.Clock;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@Service @Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
public class AppointmentCancellationService implements ReceiptPolicy {
    private final AtomicCommandExecutor commands;private final IdentityGate gate;private final AppointmentTransitionStore store;private final AppointmentBookingStore views;private final PatientStore patients;private final Clock clock;private static final JsonMapper JSON=JsonMapper.builder().build();
    public AppointmentCancellationService(AtomicCommandExecutor commands,IdentityGate gate,AppointmentTransitionStore store,AppointmentBookingStore views,PatientStore patients,Clock clock){this.commands=commands;this.gate=gate;this.store=store;this.views=views;this.patients=patients;this.clock=clock;}
    private void access(IdentityGate.Identity actor,long id){var facts=store.facts(id);if(actor.subjectType().equals("PATIENT"))gate.requirePatient(actor,facts.patient());else gate.requireStaff(actor,"RECEPTION","cancelAppointment",facts.clinic());}
    public Map<String,Object> cancel(AtomicCommandExecutor.Command command,long id,String reason,String verification)throws Exception{
        commands.execute(command,actor->{access(actor,id);var facts=store.facts(id);if(!actor.subjectType().equals("PATIENT") && !patients.verification(actor.subjectId(),facts.patient(),verification,List.of(facts.clinic())))throw new DomainFailure(403,"PATIENT_VERIFICATION_REQUIRED");},actor->{var facts=store.lock(id);access(actor,id);PatientRules.text(reason,255,false);var schedule=store.schedule(facts);AppointmentCancellationRules.require(facts.status(),schedule.status(),facts.at(),schedule.slot(),clock.instant(),actor.subjectType().equals("PATIENT"));store.transition(facts,"CANCELLED","CANCEL","PATIENT_CANCEL",reason,verification,actor.subjectType().equals("PATIENT")?"PATIENT":"RECEPTION",actor.subjectId(),command.key());return new AtomicCommandExecutor.Result(JSON.writeValueAsString(List.of("Appointment:"+id)),JSON.writeValueAsString(Map.of("appointment_id",Long.toString(id))),200,"Appointment",Long.toString(id),List.of(facts.clinic()),reason,verification);});access(gate.authenticate(command.token(),command.client()),id);return views.view(id);
    }
    @Override @Transactional(propagation=Propagation.NOT_SUPPORTED)public Set<String> operations(){return Set.of("cancelAppointment");}
    @Override public void authorize(IdentityGate.Identity actor,String operation,String refs){if(!operation.equals("cancelAppointment"))throw new DomainFailure(403,"ACCESS_DENIED");if(actor.subjectType().equals("PATIENT"))gate.requirePatient(actor,views.bound(actor.subjectId()));else gate.staffClinics(actor,"RECEPTION",operation);if(refs!=null)for(var node:JSON.readTree(refs)){String ref=node.asText();if(!ref.startsWith("Appointment:"))throw new DomainFailure(403,"ACCESS_DENIED");access(actor,Long.parseLong(ref.substring(12)));}}
}
