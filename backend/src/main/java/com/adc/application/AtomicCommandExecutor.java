package com.adc.application;

import com.adc.domain.shared.DomainFailure;
import com.adc.identity.IdentityGate;
import com.adc.identity.IdentityGate.Identity;
import com.adc.infrastructure.*;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.transaction.support.*;

@Service
public class AtomicCommandExecutor {
    private final RequestReceiptStore receipts; private final IdentityGate identities; private final TransactionLocks locks;
    private final AuditWriter audit; private final Clock clock;
    public AtomicCommandExecutor(RequestReceiptStore receipts,IdentityGate identities,TransactionLocks locks,AuditWriter audit,Clock clock) {
        this.receipts=receipts;this.identities=identities;this.locks=locks;this.audit=audit;this.clock=clock;
    }
    public record Command(String token,String client,String operation,String key,byte[] hash,String requestId,Set<String> lockedSubjects) {
        public Command(String token,String client,String operation,String key,byte[] hash,String requestId){this(token,client,operation,key,hash,requestId,Set.of());}
        public Command {
            Objects.requireNonNull(hash);
            if(hash.length!=32 || operation==null || operation.isBlank() || operation.length()>80 || key==null || key.isBlank() || key.length()>64)
                throw new DomainFailure(400,"INVALID_REQUEST");
            UUID.fromString(requestId); hash=hash.clone();lockedSubjects=Set.copyOf(lockedSubjects);
            for(String subject:lockedSubjects)if(subject.isBlank() || subject.length()>36)throw new DomainFailure(400,"INVALID_REQUEST");
        }
        @Override public byte[] hash() { return hash.clone(); }
        @Override public String toString() { return "Command[credentials redacted]"; }
    }
    public record Result(String refs,String summary,int status,String objectKind,String objectId,List<Long> clinics,String reason,String verificationReference,String changeSummary) {
        public Result(String refs,String summary,int status,String objectKind,String objectId,List<Long> clinics,String reason,String verificationReference){this(refs,summary,status,objectKind,objectId,clinics,reason,verificationReference,null);}
        public Result(String refs,String summary,int status,String objectKind,String objectId,List<Long> clinics){this(refs,summary,status,objectKind,objectId,clinics,null,null);}
        public Result { refs=CanonicalJson.normalize(refs);summary=CanonicalJson.normalize(summary);clinics=List.copyOf(clinics);if(status<200 || status>299)throw new IllegalArgumentException("Success results only"); }
    }
    @FunctionalInterface public interface Authorization { void check(Identity identity); }
    @FunctionalInterface public interface Work { Result execute(Identity identity) throws Exception; }

    @Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
    public Result execute(Command command,Authorization authorization,Work work) throws Exception {
        return executeWithLocks(command,Set.of(),authorization,work);
    }
    @Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
    public Result executeWithLocks(Command command,Collection<String> additionalLocks,Authorization authorization,Work work) throws Exception {
        var identity=new Identity[1];
        AuditWriter.onRollback(audit,()->identity[0],command.operation,command.requestId);
        // First lookup provides only a candidate identity; authenticate below locks/revalidates it.
        String subject=receipts.candidateSubject(Objects.requireNonNullElse(command.token,""));
        if(subject==null) throw new DomainFailure(401,"AUTH_REQUIRED");
        var named=new TreeSet<>(additionalLocks);named.add(TransactionLocks.name("request",subject+"/"+command.operation+"/"+command.key));
        locks.acquire(named);
        var stable=new TreeSet<>(command.lockedSubjects);stable.add(subject);identities.lockSubjects(stable);
        identity[0]=identities.authenticate(command.token,command.client);
        if(!identity[0].subjectId().equals(subject)) throw new DomainFailure(401,"AUTH_REQUIRED");
        authorization.check(identity[0]);
        var row=receipts.find(subject,command.operation,command.key);
        if(row!=null) {
            if(!MessageDigest.isEqual(row.hash(),command.hash)) throw new DomainFailure(409,"IDEMPOTENCY_CONTENT_CONFLICT");
            // Result metadata belongs to the audit event; only minimal authorized references are replayed.
            return new Result(row.refs(),row.summary(),row.status(),"Request",null,List.of());
        }
        var result=Objects.requireNonNull(work.execute(identity[0]));
        audit.successChanges(identity[0],command.operation,result.objectKind,result.objectId,result.clinics,command.requestId,result.reason,result.verificationReference,result.changeSummary);
        receipts.save(subject,command.operation,command.key,command.hash,command.requestId,result.refs,result.summary,result.status,clock.instant());
        return new Result(result.refs,result.summary,result.status,"Request",null,List.of());
    }
}
