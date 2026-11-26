package com.adc.application;

import com.adc.domain.clinicgrants.ClinicGrantRules;
import com.adc.domain.staffaccounts.StaffAccountRules;
import com.adc.domain.shared.DomainFailure;
import com.adc.identity.IdentityGate;
import com.adc.infrastructure.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@Service
public class ClinicGrantService implements ReceiptPolicy {
    private final AtomicCommandExecutor commands;private final IdentityGate gate;private final ClinicGrantStore store;private final AuditWriter audit;
    public ClinicGrantService(AtomicCommandExecutor commands,IdentityGate gate,ClinicGrantStore store,AuditWriter audit){this.commands=commands;this.gate=gate;this.store=store;this.audit=audit;}
    public record GrantInput(String subject,String role,Set<Long> clinics,Set<String> capabilities,Instant from,Instant until){ }
    private List<ClinicGrantStore.Authority> authority(IdentityGate.Identity actor) {
        gate.staffClinics(actor,"HEADQUARTERS","authorization.manage");var rows=store.authority(actor.subjectId());if(rows.isEmpty())throw new DomainFailure(403,"ACCESS_DENIED");return rows;
    }
    private static Set<Long> scopes(List<ClinicGrantStore.Authority> rows){var ids=new TreeSet<Long>();for(var row:rows)ids.add(row.clinic());return ids;}
    private static void scope(Set<Long> requested,List<ClinicGrantStore.Authority> authority){if(requested.isEmpty() || !scopes(authority).containsAll(requested))throw new DomainFailure(403,"ACCESS_DENIED");}
    private static void window(GrantInput input,List<ClinicGrantStore.Authority> rows) {
        if(input.from==null || (input.until!=null && !input.until.isAfter(input.from)))throw new DomainFailure(422,"ASSIGNMENT_INVALID");
        for(long clinic:input.clinics) {
            var windows=rows.stream().filter(r->r.clinic()==clinic).toList();
            var earliest=windows.stream().map(ClinicGrantStore.Authority::from).min(Instant::compareTo).orElseThrow();
            boolean unlimited=windows.stream().anyMatch(r->r.until()==null);
            var latest=unlimited?null:windows.stream().map(ClinicGrantStore.Authority::until).max(Instant::compareTo).orElseThrow();
            // All considered management grants are currently valid, hence their intervals overlap.
            if(input.from.isBefore(earliest) || (!unlimited && (input.until==null || input.until.isAfter(latest))))throw new DomainFailure(403,"ACCESS_DENIED");
        }
    }
    private AtomicCommandExecutor.Command target(AtomicCommandExecutor.Command command,String target) {
        var ids=new TreeSet<>(command.lockedSubjects());if(target!=null)ids.add(target);
        return new AtomicCommandExecutor.Command(command.token(),command.client(),command.operation(),command.key(),command.hash(),command.requestId(),ids);
    }
    private AtomicCommandExecutor.Result result(String grant,Set<Long> scopes,String reason,String verification){return new AtomicCommandExecutor.Result("[\"AccessGrant:"+grant+"\"]",JsonMapper.builder().build().writeValueAsString(store.view(grant)),200,"AccessGrant",grant,new ArrayList<>(scopes),reason,verification);}
    private static Map<String,Object> view(AtomicCommandExecutor.Result result){return JsonMapper.builder().build().readValue(result.summary(),new tools.jackson.core.type.TypeReference<Map<String,Object>>(){});}
    public Map<String,Object> create(AtomicCommandExecutor.Command command,GrantInput input)throws Exception {
        var current=new java.util.concurrent.atomic.AtomicReference<List<ClinicGrantStore.Authority>>();
        return view(commands.execute(target(command,input.subject),actor->{current.set(authority(actor));scope(input.clinics,current.get());},actor->{
            ClinicGrantRules.capabilities(input.role,input.capabilities);window(input,current.get());store.target(input.subject,input.role);
            String grant=store.create(input.subject,input.role,input.clinics,input.capabilities,input.from,input.until,actor.subjectId(),command.requestId());
            return result(grant,input.clinics,"AUTHORIZED_GRANT",command.requestId());
        }));
    }
    private void manageable(IdentityGate.Identity actor,String grant){scope(new HashSet<>(store.clinics(grant)),authority(actor));store.view(grant);}
    public Map<String,Object> revoke(AtomicCommandExecutor.Command command,String grant,StaffAccountService.ChangeReason reason)throws Exception {
        var authorized=new java.util.concurrent.atomic.AtomicReference<Set<Long>>();
        return view(commands.execute(target(command,store.owner(grant)),actor->{manageable(actor,grant);authorized.set(new TreeSet<>(store.clinics(grant)));},actor->{
            StaffAccountRules.required(reason.reason(),255);if(reason.verificationReference()!=null)StaffAccountRules.required(reason.verificationReference(),200);
            store.revoke(grant,actor.subjectId());return result(grant,authorized.get(),reason.reason(),reason.verificationReference());
        }));
    }
    @Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
    public Map<String,Object> list(String token,String client,String subject,String cursor,int limit,String request) {
        var holder=new IdentityGate.Identity[1];AuditWriter.onRollback(audit,()->holder[0],"listClinicGrants",request);
        var actor=gate.authenticate(token,client);holder[0]=actor;var scope=scopes(authority(actor));var page=store.list(scope,subject,cursor,limit);
        audit.success(actor,"listClinicGrants","AccessGrant",null,new ArrayList<>(scope),request);return page;
    }
    @Override public Set<String> operations(){return Set.of("createClinicGrant","revokeClinicGrant");}
    @Override public void authorize(IdentityGate.Identity actor,String operation,String refs) {
        authority(actor);if(!operations().contains(operation))throw new DomainFailure(403,"ACCESS_DENIED");
        if(refs!=null)for(var reference:JsonMapper.builder().build().readTree(refs)){String value=reference.asText();if(!value.startsWith("AccessGrant:"))throw new DomainFailure(403,"ACCESS_DENIED");manageable(actor,value.substring("AccessGrant:".length()));}
    }
}
