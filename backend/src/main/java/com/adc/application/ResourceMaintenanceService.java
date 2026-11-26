package com.adc.application;

import com.adc.domain.organizationresources.*;
import com.adc.domain.shared.*;
import com.adc.identity.IdentityGate;
import com.adc.infrastructure.*;
import java.util.*;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@Service
@Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
public class ResourceMaintenanceService implements ReceiptPolicy {
    private static final JsonMapper JSON=JsonMapper.builder().build();
    private final IdentityGate gate;private final OrganizationResourceStore store;private final AtomicCommandExecutor commands;private final BusinessRowLocks rows;private final AuditWriter audit;
    public ResourceMaintenanceService(IdentityGate gate,OrganizationResourceStore store,AtomicCommandExecutor commands,BusinessRowLocks rows,AuditWriter audit){this.gate=gate;this.store=store;this.commands=commands;this.rows=rows;this.audit=audit;}
    public record View(Map<String,Object> body,String etag){ }
    private List<Long> scope(IdentityGate.Identity actor,boolean write){return gate.staffClinics(actor,"HEADQUARTERS",write?"resource.write":"resource.read");}
    private List<Long> targetAuthority(IdentityGate.Identity actor,ResourceKind kind,long id){
        var scopes=scope(actor,true);store.accessible(kind,id,scopes);
        if(kind==ResourceKind.DENTIST){rows.acquire(new BusinessRowLocks.Plan(Set.of(id),Set.of(),Set.of()));store.accessible(kind,id,scopes);}
        return scopes;
    }
    private View view(ResourceKind kind,long id,List<Long> scope,List<Map<String,Object>> impacts) {
        var state=store.state(kind,id);String etag=CanonicalJson.etag(JSON.writeValueAsString(state));
        if(kind==ResourceKind.DENTIST)state.put("clinic_assignments",store.assignments(id).stream().filter(row->scope.contains(Long.parseLong((String)row.get("clinic_id")))).toList());
        if(impacts!=null && kind!=ResourceKind.ALLERGY)state.put("future_impact",impacts);return new View(state,etag);
    }
    private AtomicCommandExecutor.Result result(ResourceKind kind,long id,List<Long> scope,Map<String,Object> changes,String verification,List<Map<String,Object>> impacts) {
        var minimal=new LinkedHashMap<String,Object>();minimal.put(kind.id,Long.toString(id));if(impacts!=null)minimal.put("future_impact",impacts);
        var refs=new ArrayList<String>();refs.add(kind.table+":"+id);
        if(changes.containsKey("assignment_id")){refs.add("DentistClinicAssignment:"+changes.get("assignment_id"));var changed=changes.get("new");if(changed instanceof Map<?,?> assignment)refs.add("Clinic:"+assignment.get("clinic_id"));}
        return new AtomicCommandExecutor.Result(JSON.writeValueAsString(refs),JSON.writeValueAsString(minimal),200,kind.table,Long.toString(id),scope,"VERIFIED_RESOURCE_MAINTENANCE",verification,JSON.writeValueAsString(changes));
    }
    public View create(AtomicCommandExecutor.Command command,ResourceKind kind,Map<String,Object> input)throws Exception {
        var scopes=new java.util.concurrent.atomic.AtomicReference<List<Long>>();
        var result=commands.execute(command,actor->scopes.set(scope(actor,true)),actor->{
            ResourceRules.fields(kind,input,false);if(kind==ResourceKind.DENTIST)ResourceRules.dentistDates(input);
            long id;try{id=store.create(kind,input);}catch(DuplicateKeyException duplicate){throw new DomainFailure(409,"STATE_CONFLICT");}
            return result(kind,id,scopes.get(),Map.of("created",true,"fields",new ArrayList<>(input.keySet())),command.requestId(),null);
        });
        // The creation operation returns its minimal reference. It never grants management of a new clinic.
        var minimal=JSON.readTree(result.summary());long id=Long.parseLong(minimal.get(kind.id).asText());
        store.lock(kind,id);
        authorize(gate.authenticate(command.token(),command.client()),command.operation(),result.refs());
        if(kind==ResourceKind.ALLERGY)return view(kind,id,scopes.get(),null);
        return new View(Map.of(kind.id,Long.toString(id)),CanonicalJson.etag(JSON.writeValueAsString(store.state(kind,id))));
    }
    public View detail(String token,String client,ResourceKind kind,long id,String request) {
        var identity=new IdentityGate.Identity[1];AuditWriter.onRollback(audit,()->identity[0],"get"+kind.table,request);
        var actor=gate.authenticate(token,client);identity[0]=actor;var scopes=scope(actor,false);store.accessible(kind,id,scopes);store.lock(kind,id);store.accessible(kind,id,scopes);
        var view=view(kind,id,scopes,null);audit.success(actor,"get"+kind.table,kind.table,Long.toString(id),kind==ResourceKind.CLINIC?List.of(id):scopes,request);return view;
    }
    private BusinessRowLocks.Plan lock(ResourceKind kind,long id) {
        var plan=store.plan(kind,id);rows.acquire(plan);store.lock(kind,id);plan.verifyUnchanged(store.plan(kind,id));return plan;
    }
    public View update(AtomicCommandExecutor.Command command,ResourceKind kind,long id,Map<String,Object> patch,String etag)throws Exception {
        var scopes=new java.util.concurrent.atomic.AtomicReference<List<Long>>();
        var result=commands.execute(command,actor->scopes.set(targetAuthority(actor,kind,id)),actor->{
            ResourceRules.fields(kind,patch,true);var plan=lock(kind,id);var old=store.state(kind,id);CanonicalJson.requireMatch(etag,JSON.writeValueAsString(old));
            var merged=new LinkedHashMap<>(old);merged.putAll(patch);if(kind==ResourceKind.DENTIST)ResourceRules.dentistDates(merged);
            var changes=new LinkedHashMap<String,Object>();for(String key:patch.keySet()){var diff=new LinkedHashMap<String,Object>();diff.put("old",old.get(key));diff.put("new",patch.get(key));changes.put(key,diff);}
            try{store.update(kind,id,patch);}catch(DuplicateKeyException duplicate){throw new DomainFailure(409,"STATE_CONFLICT");}
            var impacts=store.impacts(plan,scopes.get(),"RESOURCE_AVAILABILITY_CHANGED");return result(kind,id,scopes.get(),changes,command.requestId(),impacts);
        });return resolved(command,kind,result,scopes.get());
    }
    @SuppressWarnings("unchecked") private View resolved(AtomicCommandExecutor.Command command,ResourceKind kind,AtomicCommandExecutor.Result result,List<Long> scopes) {
        var minimal=JSON.readValue(result.summary(),new tools.jackson.core.type.TypeReference<Map<String,Object>>(){});long id=Long.parseLong((String)minimal.get(kind.id));
        store.lock(kind,id);store.accessible(kind,id,scopes);var impacts=(List<Map<String,Object>>)minimal.get("future_impact");
        if(impacts!=null)impacts=impacts.stream().filter(impact->scopes.contains(Long.parseLong((String)impact.get("clinic_id")))).toList();
        return view(kind,id,scopes,impacts);
    }
    public View qualification(AtomicCommandExecutor.Command command,long dentist,Map<String,Object> input)throws Exception {
        var scopes=new java.util.concurrent.atomic.AtomicReference<List<Long>>();
        var result=commands.execute(command,actor->scopes.set(targetAuthority(actor,ResourceKind.DENTIST,dentist)),actor->{
            ResourceRules.closed(input,Set.of("qualification_id","certificate_number","granted_date","expiry_date","verification_status","verification_reference"));
            long qualification=ResourceRules.id(input.get("qualification_id"));ResourceRules.text(input.get("certificate_number"),60,false);ResourceRules.date(input.get("granted_date"));ResourceRules.window(input.get("granted_date"),input.get("expiry_date"));ResourceRules.text(input.get("verification_status"),20,false);String reference=ResourceRules.text(input.get("verification_reference"),200,false);
            var plan=lock(ResourceKind.DENTIST,dentist);store.lock(ResourceKind.QUALIFICATION,qualification);var before=store.qualifications(dentist);store.qualification(dentist,input);
            var changes=new LinkedHashMap<String,Object>();changes.put("qualification_id",Long.toString(qualification));changes.put("old",before.stream().filter(row->row.get("qualification_id").equals(Long.toString(qualification))).findFirst().orElse(null));changes.put("new",store.qualifications(dentist).stream().filter(row->row.get("qualification_id").equals(Long.toString(qualification))).findFirst().orElseThrow());
            return result(ResourceKind.DENTIST,dentist,scopes.get(),changes,reference,store.impacts(plan,scopes.get(),"QUALIFICATION_CHANGED"));
        });return resolved(command,ResourceKind.DENTIST,result,scopes.get());
    }
    public View assignment(AtomicCommandExecutor.Command command,long dentist,Map<String,Object> input)throws Exception {
        var scopes=new java.util.concurrent.atomic.AtomicReference<List<Long>>();
        var result=commands.execute(command,actor->{
            scopes.set(targetAuthority(actor,ResourceKind.DENTIST,dentist));long requested=ResourceRules.id(input.get("clinic_id"));if(!scopes.get().contains(requested))throw new DomainFailure(403,"ACCESS_DENIED");
            if(input.get("assignment_id")!=null){String assignment=Long.toString(ResourceRules.id(input.get("assignment_id")));if(store.assignments(dentist).stream().noneMatch(row->assignment.equals(row.get("assignment_id")) && scopes.get().contains(Long.parseLong((String)row.get("clinic_id")))))throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");}
        },actor->{
            ResourceRules.closed(input,Set.of("assignment_id","clinic_id","start_date","end_date","availability_note","is_active"));long clinic=ResourceRules.id(input.get("clinic_id"));
            if(!scopes.get().contains(clinic))throw new DomainFailure(403,"ACCESS_DENIED");ResourceRules.date(input.get("start_date"));ResourceRules.window(input.get("start_date"),input.get("end_date"));ResourceRules.bool(input.get("is_active"));ResourceRules.text(input.get("availability_note"),255,true);
            var plan=lock(ResourceKind.DENTIST,dentist);var before=store.assignments(dentist);
            if(input.get("assignment_id")!=null){String id=Long.toString(ResourceRules.id(input.get("assignment_id")));var old=before.stream().filter(row->id.equals(row.get("assignment_id"))).findFirst().orElseThrow(()->new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE"));if(!scopes.get().contains(Long.parseLong((String)old.get("clinic_id"))))throw new DomainFailure(403,"ACCESS_DENIED");}
            long changed=store.assignment(dentist,input);var changes=new LinkedHashMap<String,Object>();changes.put("assignment_id",Long.toString(changed));changes.put("old",before.stream().filter(row->row.get("assignment_id").equals(Long.toString(changed))).findFirst().orElse(null));changes.put("new",store.assignments(dentist).stream().filter(row->row.get("assignment_id").equals(Long.toString(changed))).findFirst().orElseThrow());
            return result(ResourceKind.DENTIST,dentist,scopes.get(),changes,command.requestId(),store.impacts(plan,scopes.get(),"ASSIGNMENT_CHANGED"));
        });return resolved(command,ResourceKind.DENTIST,result,scopes.get());
    }
    public View requirements(AtomicCommandExecutor.Command command,long treatment,List<Map<String,Object>> input)throws Exception {
        var scopes=new java.util.concurrent.atomic.AtomicReference<List<Long>>();
        var result=commands.execute(command,actor->{scopes.set(scope(actor,true));store.accessible(ResourceKind.TREATMENT,treatment,scopes.get());},actor->{
            if(input==null)throw new DomainFailure(422,"FIELD_REQUIRED");for(var entry:input){ResourceRules.closed(entry,Set.of("qualification_id","is_mandatory"));ResourceRules.id(entry.get("qualification_id"));ResourceRules.bool(entry.get("is_mandatory"));}
            var plan=lock(ResourceKind.TREATMENT,treatment);var before=store.requirements(treatment);store.requirements(treatment,input);
            return result(ResourceKind.TREATMENT,treatment,scopes.get(),Map.of("old_requirements",before,"new_requirements",store.requirements(treatment)),command.requestId(),store.impacts(plan,scopes.get(),"TREATMENT_REQUIREMENTS_CHANGED"));
        });return resolved(command,ResourceKind.TREATMENT,result,scopes.get());
    }
    public Map<String,Object> catalog(String token,String client,ResourceKind kind,String cursor,int limit,String request) {
        return catalog(token,client,kind,cursor,limit,request,null);
    }
    public Map<String,Object> catalog(String token,String client,ResourceKind kind,String cursor,int limit,String request,String search) {
        if(search!=null&&search.length()>100)throw new DomainFailure(400,"INVALID_REQUEST");
        var identity=new IdentityGate.Identity[1];AuditWriter.onRollback(audit,()->identity[0],"list"+kind.table,request);var actor=gate.authenticate(token,client);identity[0]=actor;
        boolean headquarters=false;List<Long> allowed=null;
        if(actor.subjectType().equals("PATIENT")) {
            if(kind==ResourceKind.DENTIST)throw new DomainFailure(403,"ACCESS_DENIED");
            // Booking discovery needs active clinic/treatment labels before a new patient registers.
            if(kind!=ResourceKind.CLINIC && kind!=ResourceKind.TREATMENT)gate.requirePatient(actor,store.boundPatient(actor.subjectId()));
        } else {
            var headquartersScopes=new TreeSet<Long>();try{headquartersScopes.addAll(scope(actor,false));}catch(DomainFailure noRead){ }try{headquartersScopes.addAll(scope(actor,true));}catch(DomainFailure noWrite){ }
            if(kind==ResourceKind.CLINIC||kind==ResourceKind.DENTIST)for(String capability:List.of("cost.verify","performance.calculate","performance.publish","analysis.read"))try{headquartersScopes.addAll(gate.staffClinics(actor,"HEADQUARTERS",capability));}catch(DomainFailure denied){}
            if(!headquartersScopes.isEmpty()){allowed=new ArrayList<>(headquartersScopes);headquarters=true;}else{
                var capabilities=switch(kind){case CLINIC->List.of("listSchedules","createSchedule","searchAppointmentCandidates","createAppointment","createPatient","getPatient","listBindingRequests","approvePatientBinding");case DENTIST->List.of("listSchedules","createSchedule","searchAppointmentCandidates");case TREATMENT->List.of("searchAppointmentCandidates","createAppointment");case QUALIFICATION->List.of("searchAppointmentCandidates");default->List.<String>of();};
                var union=new TreeSet<Long>();for(String capability:capabilities)try{union.addAll(gate.staffClinics(actor,"RECEPTION",capability));}catch(DomainFailure denied){ }
                if(kind!=ResourceKind.DENTIST)for(String capability:List.of("recordAppliedTreatment","getClinicalContext"))try{union.addAll(gate.staffClinics(actor,"DENTIST",capability));}catch(DomainFailure denied){ }
                if(kind==ResourceKind.TREATMENT)try{union.addAll(gate.staffClinics(actor,"CASHIER","invoiceAppointment"));}catch(DomainFailure denied){ }
                if(union.isEmpty())throw new DomainFailure(403,"ACCESS_DENIED");allowed=new ArrayList<>(union);
            }
        }
        if(limit<1 || limit>100)throw new DomainFailure(400,"INVALID_REQUEST");long after=0;if(cursor!=null)try{after=BusinessValues.id(new String(Base64.getUrlDecoder().decode(cursor),java.nio.charset.StandardCharsets.UTF_8));}catch(IllegalArgumentException e){throw new DomainFailure(400,"INVALID_REQUEST");}
        var result=store.catalog(kind,allowed,headquarters,after,limit,search);audit.success(actor,"list"+kind.table,kind.table,null,allowed==null?List.of():allowed,request);return result;
    }
    @Override @Transactional(propagation=Propagation.NOT_SUPPORTED)
    public Set<String> operations(){var operations=new HashSet<String>(Set.of("maintainDentistQualification","maintainDentistAssignment","setTreatmentRequirements"));for(var kind:ResourceKind.values()){operations.add("create"+kind.table);operations.add("update"+kind.table);}return Set.copyOf(operations);}
    @Override public void authorize(IdentityGate.Identity actor,String operation,String refs) {
        var scopes=scope(actor,true);if(!operations().contains(operation))throw new DomainFailure(403,"ACCESS_DENIED");
        if(refs!=null){var dentists=new TreeSet<Long>();for(var ref:JSON.readTree(refs)){String value=ref.asText();if(value.startsWith("Dentist:"))dentists.add(BusinessValues.id(value.substring(8)));}if(!dentists.isEmpty())rows.acquire(new BusinessRowLocks.Plan(dentists,Set.of(),Set.of()));}
        if(refs!=null)for(var ref:JSON.readTree(refs)){var parts=ref.asText().split(":",-1);if(parts.length!=2)throw new DomainFailure(403,"ACCESS_DENIED");long id=BusinessValues.id(parts[1]);
            if(parts[0].equals("DentistClinicAssignment")){if(!scopes.contains(store.assignmentClinic(id)))throw new DomainFailure(403,"ACCESS_DENIED");continue;}
            var kind=Arrays.stream(ResourceKind.values()).filter(value->value.table.equals(parts[0])).findFirst().orElseThrow(()->new DomainFailure(403,"ACCESS_DENIED"));if(operation.equals("createClinic") && store.createdContext(actor.subjectId(),kind,id,scopes))continue;store.accessible(kind,id,scopes);}
    }
}
