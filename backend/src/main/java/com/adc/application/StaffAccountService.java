package com.adc.application;

import com.adc.domain.staffaccounts.StaffAccountRules;
import com.adc.domain.shared.DomainFailure;
import com.adc.identity.*;
import com.adc.infrastructure.*;
import java.util.*;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@Service
public class StaffAccountService implements ReceiptPolicy {
    private static final Set<String> OPERATIONS=Set.of("createStaffAccount","activateStaffAccount","deactivateStaffAccount","credentialrecoveryStaffAccount");
    private final AtomicCommandExecutor commands;private final IdentityGate gate;private final StaffAccountStore store;private final PasswordHasher passwords;private final AuditWriter audit;
    public StaffAccountService(AtomicCommandExecutor commands,IdentityGate gate,StaffAccountStore store,PasswordHasher passwords,AuditWriter audit){this.commands=commands;this.gate=gate;this.store=store;this.passwords=passwords;this.audit=audit;}
    public record NewAccount(String staffReference,String username,Long dentistId) { }
    public record ChangeReason(String reason,String verificationReference) { }
    public record Recovery(String verificationReference,String reason,String replacementPassword) {@Override public String toString(){return "Recovery[credentials redacted]";}}
    private List<Long> allowed(IdentityGate.Identity identity){return gate.staffClinics(identity,"HEADQUARTERS","account.manage");}
    private AtomicCommandExecutor.Command target(AtomicCommandExecutor.Command command,String target) {
        var subjects=new TreeSet<>(command.lockedSubjects());subjects.add(target);
        return new AtomicCommandExecutor.Command(command.token(),command.client(),command.operation(),command.key(),command.hash(),command.requestId(),subjects);
    }
    private AtomicCommandExecutor.Result result(IdentityGate.Identity actor,String subject,String reason,String verification) {
        return new AtomicCommandExecutor.Result("[\"StaffAccount:"+subject+"\"]",JsonMapper.builder().build().writeValueAsString(store.require(subject)),200,"StaffAccount",subject,allowed(actor),reason,verification);
    }
    private Map<String,Object> view(AtomicCommandExecutor.Result result) {
        var row=JsonMapper.builder().build().readTree(result.summary());return Map.of("subject_id",row.path("subject_id").asText(),"username",row.path("username").asText(),"enabled",row.path("enabled").asBoolean());
    }
    public Map<String,Object> create(AtomicCommandExecutor.Command command,NewAccount input)throws Exception {
        return view(commands.execute(command,this::allowed,actor->{
            StaffAccountRules.required(input.staffReference,100);StaffAccountRules.required(input.username,100);
            if(input.dentistId!=null && input.dentistId<=0)throw new DomainFailure(400,"INVALID_REQUEST");
            try {String subject=store.create(input.staffReference,input.username,input.dentistId,command.requestId());return result(actor,subject,"EMPLOYEE_IDENTITY_VERIFIED",command.requestId());}
            catch(DuplicateKeyException error){throw new DomainFailure(409,"STATE_CONFLICT");}
        }));
    }
    private void check(IdentityGate.Identity actor,String target){allowed(actor);store.require(target);}
    private Map<String,Object> change(AtomicCommandExecutor.Command command,String target,ChangeReason input,boolean enabled)throws Exception {
        return view(commands.execute(target(command,target),actor->check(actor,target),actor->{
            StaffAccountRules.required(input.reason,255);if(input.verificationReference!=null)StaffAccountRules.required(input.verificationReference,200);
            store.enabled(target,enabled);return result(actor,target,input.reason,input.verificationReference);
        }));
    }
    public Map<String,Object> activate(AtomicCommandExecutor.Command command,String target,ChangeReason input)throws Exception{return change(command,target,input,true);}
    public Map<String,Object> deactivate(AtomicCommandExecutor.Command command,String target,ChangeReason input)throws Exception{return change(command,target,input,false);}
    public Map<String,Object> recover(AtomicCommandExecutor.Command command,String target,Recovery input)throws Exception {
        return view(commands.execute(target(command,target),actor->check(actor,target),actor->{
            StaffAccountRules.required(input.verificationReference,200);StaffAccountRules.required(input.reason,255);
            if(input.replacementPassword==null || input.replacementPassword.isEmpty())throw new DomainFailure(422,"FIELD_REQUIRED");
            store.credential(target,passwords.encode(input.replacementPassword),input.verificationReference);return result(actor,target,input.reason,input.verificationReference);
        }));
    }
    @Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
    public Map<String,Object> list(String token,String client,String cursor,int limit,String request) {
        var holder=new IdentityGate.Identity[1];AuditWriter.onRollback(audit,()->holder[0],"listStaffAccounts",request);
        var actor=gate.authenticate(token,client);holder[0]=actor;var clinics=allowed(actor);
        var page=store.list(cursor,limit);audit.success(actor,"listStaffAccounts","StaffAccount",null,clinics,request);return page;
    }
    @Override public Set<String> operations(){return OPERATIONS;}
    @Override public void authorize(IdentityGate.Identity identity,String operation,String refs) {
        if(!OPERATIONS.contains(operation))throw new DomainFailure(403,"ACCESS_DENIED");allowed(identity);
        if(refs!=null)for(var ref:JsonMapper.builder().build().readTree(refs)) {
            String value=ref.asText();if(!value.startsWith("StaffAccount:"))throw new DomainFailure(403,"ACCESS_DENIED");store.require(value.substring("StaffAccount:".length()));
        }
    }
}
