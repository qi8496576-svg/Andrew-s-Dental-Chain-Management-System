package com.adc.application.performance;

import com.adc.application.*;
import com.adc.domain.performance.*;
import com.adc.domain.shared.*;
import com.adc.identity.IdentityGate;
import com.adc.infrastructure.*;
import java.time.Clock;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@Service @Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
public class PerformancePublicationService implements ReceiptPolicy {
    public record Publish(String expected_input_hash,String review_reference){}
    private final AtomicCommandExecutor commands;private final IdentityGate gate;private final QuarterlyPerformanceStore store;private final BusinessRowLocks locks;private final Clock clock;private static final JsonMapper JSON=JsonMapper.builder().build();
    public PerformancePublicationService(AtomicCommandExecutor commands,IdentityGate gate,QuarterlyPerformanceStore store,BusinessRowLocks locks,Clock clock){this.commands=commands;this.gate=gate;this.store=store;this.locks=locks;this.clock=clock;}
    private void access(IdentityGate.Identity actor,long id){for(long clinic:QuarterlyPerformanceService.input(store.get(id,false)).clinics())gate.requireStaff(actor,"HEADQUARTERS","performance.publish",clinic);}
    public Map<String,Object> publish(AtomicCommandExecutor.Command command,long id,Publish request)throws Exception{
        if(request.expected_input_hash()==null || !request.expected_input_hash().matches("[0-9a-f]{64}") || request.review_reference()==null || request.review_reference().isBlank() || request.review_reference().length()>255)throw new DomainFailure(422,"MISSING_PUBLICATION_REVIEW");
        var result=commands.execute(command,actor->access(actor,id),actor->{var input=QuarterlyPerformanceService.input(store.get(id,false));locks.acquire(new BusinessRowLocks.Plan(input.personnel().stream().map(QuarterlyCalculation.Dentist::id).collect(java.util.stream.Collectors.toSet()),Set.of(),Set.of()));var row=store.get(id,true);access(actor,id);if(!row.hash().equals(request.expected_input_hash()) || !row.hash().equals(QuarterlyPerformanceService.hash(input)))throw new DomainFailure(412,"PRECONDITION_FAILED");if(!Set.of("CALCULATED","PUBLISHED").contains(row.status()))throw new DomainFailure(409,"PERFORMANCE_NOT_PUBLISHABLE");var snapshot=JSON.readTree(row.snapshot());var calculator=snapshot.get("calculated_by");if(calculator==null || calculator.isNull())throw new DomainFailure(422,"PERFORMANCE_RECONCILIATION_FAILED");var recomputed=QuarterlyCalculation.calculate(input);var expected=recomputed.people().get(row.dentist());if(!recomputed.reasons().isEmpty() || expected==null || !Objects.equals(row.revenue(),expected.revenue()) || !Objects.equals(row.medical(),expected.medical()) || !Objects.equals(row.operating(),expected.operating()) || !Objects.equals(row.profit(),expected.profit()) || !Objects.equals(row.incentive(),expected.incentive()) || !CanonicalJson.normalize(snapshot.get("allocations").toString()).equals(CanonicalJson.normalize(JSON.writeValueAsString(recomputed.allocations()))))throw new DomainFailure(422,"PERFORMANCE_RECONCILIATION_FAILED");if(store.quarter(row.start(),row.end()).stream().anyMatch(r->r.dentist()==row.dentist() && r.status().equals("PUBLISHED") && r.version()>row.version()))throw new DomainFailure(409,"NEWER_PERFORMANCE_ALREADY_PUBLISHED");if(!row.status().equals("PUBLISHED"))store.publish(row,clock.instant());return new AtomicCommandExecutor.Result(JSON.writeValueAsString(List.of("QuarterlyPerformance:"+id)),JSON.writeValueAsString(Map.of("quarterly_performance_id",Long.toString(id))),200,"QuarterlyPerformance",Long.toString(id),input.clinics(),"INDEPENDENT_R1_REVIEW",request.review_reference());});var actor=gate.authenticate(command.token(),command.client());authorize(actor,command.operation(),result.refs());return store.view(store.get(Long.parseLong(JSON.readTree(result.summary()).get("quarterly_performance_id").asText()),false));
    }
    @Override @Transactional(propagation=Propagation.NOT_SUPPORTED)public Set<String> operations(){return Set.of("publishQuarterPerformance");}
    @Override public void authorize(IdentityGate.Identity actor,String operation,String refs){gate.staffClinics(actor,"HEADQUARTERS","performance.publish");if(refs!=null)for(var node:JSON.readTree(refs)){String ref=node.asText();if(!ref.startsWith("QuarterlyPerformance:"))throw new DomainFailure(403,"ACCESS_DENIED");access(actor,BusinessValues.id(ref.substring(21)));}}
}
