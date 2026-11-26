package com.adc.application;

import com.adc.domain.schedules.ScheduleRules;
import com.adc.domain.patients.PatientRules;
import com.adc.domain.shared.*;
import com.adc.identity.IdentityGate;
import com.adc.identity.IdentityGate.Identity;
import com.adc.infrastructure.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@Service @Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
public class ScheduleService implements ReceiptPolicy {
    private final AtomicCommandExecutor commands;private final IdentityGate gate;private final ScheduleStore store;private final BusinessRowLocks locks;private final AuditWriter audit;private static final JsonMapper JSON=JsonMapper.builder().build();
    public ScheduleService(AtomicCommandExecutor commands,IdentityGate gate,ScheduleStore store,BusinessRowLocks locks,AuditWriter audit){this.commands=commands;this.gate=gate;this.store=store;this.locks=locks;this.audit=audit;}
    public record Creation(long dentist,long clinic,LocalDate date,LocalTime start,LocalTime end,int slot,String note) { }
    private AtomicCommandExecutor.Result result(long id,long clinic,String reason){return new AtomicCommandExecutor.Result(JSON.writeValueAsString(List.of("Schedule:"+id)),JSON.writeValueAsString(Map.of("schedule_id",Long.toString(id))),200,"DentistSchedule",Long.toString(id),List.of(clinic),reason,null);}
    private long resultId(AtomicCommandExecutor.Result result){return Long.parseLong(JSON.readTree(result.summary()).get("schedule_id").asText());}
    private void access(Identity actor,long schedule,String operation){gate.requireStaff(actor,"RECEPTION",operation,store.get(schedule).clinic());}
    public Map<String,Object> create(AtomicCommandExecutor.Command command,Creation input)throws Exception{
        var result=commands.execute(command,actor->gate.requireStaff(actor,"RECEPTION","createSchedule",input.clinic),actor->{ScheduleRules.interval(input.date,input.start,input.end,input.slot,input.note);locks.acquire(new BusinessRowLocks.Plan(Set.of(input.dentist),Set.of(),Set.of()));store.eligible(input.dentist,input.clinic,input.date);store.overlap(input.dentist,input.date,input.start,input.end);return result(store.create(input.dentist,input.clinic,input.date,input.start,input.end,input.slot,input.note),input.clinic,null);});long id=resultId(result);access(gate.authenticate(command.token(),command.client()),id,"createSchedule");return store.get(id).view();
    }
    private BusinessRowLocks.Plan plan(long id){var row=store.get(id);return new BusinessRowLocks.Plan(Set.of(row.dentist()),Set.of(id),new HashSet<>(store.appointmentIds(id)));}
    public Map<String,Object> suspend(AtomicCommandExecutor.Command command,long id,String reason)throws Exception{
        var result=commands.execute(command,actor->access(actor,id,"suspendSchedule"),actor->{PatientRules.text(reason,255,false);var before=plan(id);locks.acquire(before);before.verifyUnchanged(plan(id));var row=store.get(id);access(actor,id,"suspendSchedule");if(!row.status().equals("NORMAL"))throw new DomainFailure(409,"SCHEDULE_ALREADY_SUSPENDED");store.suspend(id);return result(id,row.clinic(),reason);});long actual=resultId(result);access(gate.authenticate(command.token(),command.client()),actual,"suspendSchedule");return Map.of("schedule",store.get(actual).view(),"affected_appointment_ids",store.affected(actual));
    }
    private List<Long> listScope(Identity actor){if(actor.subjectType().equals("STAFF")){try{return gate.staffClinics(actor,"RECEPTION","listSchedules");}catch(DomainFailure failure){if(failure.status()!=403)throw failure;return gate.staffClinics(actor,"HEADQUARTERS","resource.read");}}throw new DomainFailure(403,"ACCESS_DENIED");}
    public Map<String,Object> list(String token,String client,Long clinic,Long dentist,Instant start,Instant end,String cursor,int limit,String request){var actor=gate.authenticate(token,client);var scope=listScope(actor);if(clinic!=null){if(!scope.contains(clinic))throw new DomainFailure(403,"ACCESS_DENIED");scope=List.of(clinic);}if(limit<1 || limit>100 || (start!=null && end!=null && !end.isAfter(start)))throw new DomainFailure(400,"INVALID_REQUEST");long after=cursor==null?0:BusinessValues.id(cursor);var rows=store.list(scope,dentist,start,end,after,limit+1);String next=null;if(rows.size()>limit){rows=rows.subList(0,limit);next=Long.toString(rows.getLast().id());}audit.success(actor,"listSchedules","DentistSchedule",null,scope,request);var result=new LinkedHashMap<String,Object>();result.put("items",rows.stream().map(ScheduleStore.Schedule::view).toList());result.put("next_cursor",next);return result;}
    @Override @Transactional(propagation=Propagation.NOT_SUPPORTED)public Set<String> operations(){return Set.of("createSchedule","suspendSchedule");}
    @Override public void authorize(Identity actor,String operation,String refs){if(!operations().contains(operation))throw new DomainFailure(403,"ACCESS_DENIED");gate.staffClinics(actor,"RECEPTION",operation);if(refs!=null)for(var ref:JSON.readTree(refs)){String value=ref.asText();if(!value.startsWith("Schedule:"))throw new DomainFailure(403,"ACCESS_DENIED");access(actor,Long.parseLong(value.substring(9)),operation);}}
}
