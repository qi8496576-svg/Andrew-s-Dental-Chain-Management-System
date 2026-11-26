package com.adc.application;
import com.adc.domain.appointmentattendance.AppointmentAttendanceRules;
import com.adc.domain.shared.DomainFailure;
import com.adc.identity.IdentityGate;
import com.adc.infrastructure.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@Service @Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
public class AppointmentAttendanceService implements ReceiptPolicy {
    private final AtomicCommandExecutor commands;private final IdentityGate gate;private final AppointmentTransitionStore store;private final AppointmentBookingStore views;private final PatientStore patients;private static final JsonMapper JSON=JsonMapper.builder().build();
    public AppointmentAttendanceService(AtomicCommandExecutor commands,IdentityGate gate,AppointmentTransitionStore store,AppointmentBookingStore views,PatientStore patients){this.commands=commands;this.gate=gate;this.store=store;this.views=views;this.patients=patients;}
    private void access(IdentityGate.Identity actor,long id){gate.requireStaff(actor,"RECEPTION","attendAppointment",store.facts(id).clinic());}
    public Map<String,Object> attend(AtomicCommandExecutor.Command command,long id,String verification)throws Exception{
        commands.execute(command,actor->{access(actor,id);var facts=store.facts(id);if(!patients.verification(actor.subjectId(),facts.patient(),verification,List.of(facts.clinic())))throw new DomainFailure(403,"PATIENT_VERIFICATION_REQUIRED");},actor->{var facts=store.lock(id);access(actor,id);AppointmentAttendanceRules.require(facts.status(),store.schedule(facts).status());store.transition(facts,"IN_PROGRESS","ATTEND",null,null,verification,"RECEPTION",actor.subjectId(),command.key());return new AtomicCommandExecutor.Result(JSON.writeValueAsString(List.of("Appointment:"+id)),JSON.writeValueAsString(Map.of("appointment_id",Long.toString(id))),200,"Appointment",Long.toString(id),List.of(facts.clinic()),null,verification);});access(gate.authenticate(command.token(),command.client()),id);return views.view(id);
    }
    @Override @Transactional(propagation=Propagation.NOT_SUPPORTED)public Set<String> operations(){return Set.of("attendAppointment");}
    @Override public void authorize(IdentityGate.Identity actor,String operation,String refs){if(!operation.equals("attendAppointment"))throw new DomainFailure(403,"ACCESS_DENIED");gate.staffClinics(actor,"RECEPTION",operation);if(refs!=null)for(var node:JSON.readTree(refs)){String ref=node.asText();if(!ref.startsWith("Appointment:"))throw new DomainFailure(403,"ACCESS_DENIED");access(actor,Long.parseLong(ref.substring(12)));}}
}
