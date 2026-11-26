package com.adc.application.performance;

import com.adc.application.QuarterlyPerformanceService;
import com.adc.domain.shared.DomainFailure;
import com.adc.identity.IdentityGate;
import com.adc.infrastructure.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

/** Internal SYSTEM command: never creates a session and never publishes a performance. */
@Service
public class QuarterlyPerformanceJob {
    static final String SUBJECT=UUID.nameUUIDFromBytes("adc/internal/quarterly-performance/R1".getBytes(StandardCharsets.UTF_8)).toString();
    private final QuarterlyPerformanceService service;private final QuarterlyPerformanceStore store;private final QuarterlySnapshotReader reader;private final TransactionLocks locks;private final IdentityGate gate;private final RequestReceiptStore receipts;private final AuditWriter audit;private final JdbcTemplate db;private final Clock clock;
    public QuarterlyPerformanceJob(QuarterlyPerformanceService service,QuarterlyPerformanceStore store,QuarterlySnapshotReader reader,TransactionLocks locks,IdentityGate gate,RequestReceiptStore receipts,AuditWriter audit,JdbcTemplate db,Clock clock){this.service=service;this.store=store;this.reader=reader;this.locks=locks;this.gate=gate;this.receipts=receipts;this.audit=audit;this.db=db;this.clock=clock;}
    @Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
    public boolean previousQuarter(){
        var today=clock.instant().atZone(ZoneId.of("Asia/Shanghai")).toLocalDate();var end=LocalDate.of(today.getYear(),((today.getMonthValue()-1)/3)*3+1,1);String start=end.minusMonths(3).toString(),until=end.toString(),key="quarterly-R1-"+start,operation="calculateQuarterPerformance";locks.acquire(List.of(QuarterlyPerformanceService.quarterLock(start,until),TransactionLocks.name("request",SUBJECT+"/"+operation+"/"+key)));
        db.update("INSERT IGNORE INTO adc_identity.Subject VALUES (?,'SYSTEM',true,?,NULL)",SUBJECT,LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC));gate.lockSubjects(Set.of(SUBJECT));if(db.queryForObject("SELECT COUNT(*) FROM adc_identity.Subject WHERE subject_id=? AND subject_type='SYSTEM' AND is_enabled=true",Integer.class,SUBJECT)!=1)throw new DomainFailure(503,"INTERNAL_IDENTITY_UNAVAILABLE");if(receipts.find(SUBJECT,operation,key)!=null)return false;
        var candidates=store.quarter(start,until).stream().filter(r->QuarterlyPerformanceService.input(r).preparer()!=null).sorted(Comparator.comparing((QuarterlyPerformanceStore.Row r)->tools.jackson.databind.json.JsonMapper.builder().build().readTree(r.snapshot()).get("verified_at").asText()).thenComparingInt(QuarterlyPerformanceStore.Row::version).reversed()).toList();var frozen=candidates.isEmpty()?reader.capture(start,until,clock.instant().toString(),store.allClinics(),List.of(),null,null):QuarterlyPerformanceService.input(candidates.getFirst());var result=service.saveFrozen(frozen,true,SUBJECT);String request=UUID.randomUUID().toString();var actor=new IdentityGate.Identity(SUBJECT,"SYSTEM",null,null);audit.success(actor,operation,"QuarterlyPerformance",null,frozen.clinics(),request,"SCHEDULED_CALCULATION_ONLY",null);receipts.save(SUBJECT,operation,key,Crypto.sha256(key),request,result.refs(),result.summary(),200,clock.instant());return true;
    }
}
