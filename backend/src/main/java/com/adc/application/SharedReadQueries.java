package com.adc.application;

import com.adc.domain.shared.*;
import com.adc.identity.IdentityGate;
import com.adc.infrastructure.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@Service
@Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
public class SharedReadQueries {
    private final RequestReceiptStore receipts; private final AuditEventStore events; private final IdentityGate identities; private final AuditWriter audit;
    private final Map<String,ReceiptPolicy> policies;
    public SharedReadQueries(RequestReceiptStore receipts,AuditEventStore events,IdentityGate identities,AuditWriter audit,List<ReceiptPolicy> providers) {
        this.receipts=receipts;this.events=events;this.identities=identities;this.audit=audit;
        var map=new HashMap<String,ReceiptPolicy>();
        for(var provider:providers)for(var operation:provider.operations())if(map.putIfAbsent(operation,provider)!=null)throw new IllegalStateException("Duplicate receipt authorization policy");
        policies=Map.copyOf(map);
    }
    public Map<String,Object> requestResult(String token,String client,String operation,String key,String requestId) {
        var auditIdentity=new IdentityGate.Identity[1];AuditWriter.onRollback(audit,()->auditIdentity[0],"getRequestResult",requestId);
        var identity=identities.authenticate(token,client);
        auditIdentity[0]=identity;
        var policy=policies.get(operation);
        if(policy==null)throw new DomainFailure(403,"ACCESS_DENIED");
        policy.authorize(identity,operation,null);
        var row=receipts.find(identity.subjectId(),operation,key);
        if(row==null) {
            return Map.of("operation",operation,"request_key",key,"status",receipts.inProgress(identity.subjectId(),operation,key)?"PENDING":"UNKNOWN","resource_references",List.of(),"request_id",requestId);
        }
        policy.authorize(identity,operation,row.refs());
        var refs=new ArrayList<String>();var json=JsonMapper.builder().build().readTree(row.refs());
        if(!json.isArray())throw new IllegalStateException("Receipt references must use the minimal reference array");
        for(var ref:json) { if(!ref.isTextual())throw new IllegalStateException("Invalid receipt reference");refs.add(ref.asText()); }
        return Map.of("operation",operation,"request_key",key,"status","SUCCEEDED","resource_references",refs,"request_id",row.requestId());
    }
    public Map<String,Object> auditEvents(String token,String client,String start,String end,String action,String object,String cursor,int limit,String requestId) {
        var auditIdentity=new IdentityGate.Identity[1];AuditWriter.onRollback(audit,()->auditIdentity[0],"searchAuditEvents",requestId);
        if(limit<1 || limit>100)throw new DomainFailure(400,"INVALID_REQUEST");
        var identity=identities.authenticate(token,client);
        auditIdentity[0]=identity;
        var clinics=identities.staffClinics(identity,"HEADQUARTERS","audit.read");
        var page=events.search(clinics,start,end,action,object,cursor,limit);
        audit.success(identity,"searchAuditEvents","AuditEvent",null,clinics,requestId);
        return page;
    }
}
