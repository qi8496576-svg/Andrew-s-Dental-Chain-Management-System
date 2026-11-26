package com.adc.application;

import com.adc.domain.shared.*;
import com.adc.identity.IdentityGate;
import com.adc.infrastructure.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service @Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
public class AnalyticsService {
    private final IdentityGate gate;private final AnalyticsSnapshotReader reader;private final AuditWriter audit;private final Clock clock;
    public AnalyticsService(IdentityGate gate,AnalyticsSnapshotReader reader,AuditWriter audit,Clock clock){this.gate=gate;this.reader=reader;this.audit=audit;this.clock=clock;}
    public Map<String,Object> get(String token,String client,String metric,Long clinic,String start,String end,String cutoff,String rule,String treatment,String dentist,String request){var failed=new IdentityGate.Identity[1];AuditWriter.onRollback(audit,()->failed[0],"getAnalysis",request);var actor=gate.authenticate(token,client);failed[0]=actor;var clinics=gate.staffClinics(actor,"HEADQUARTERS","analysis.read");if(clinic!=null){gate.requireStaff(actor,"HEADQUARTERS","analysis.read",clinic);clinics=List.of(clinic);}if(!Set.of("cancellations","treatment-comparison","skill-slot-coverage","skill-structure","performance","coverage","traceability","calculation-time").contains(metric) || !"A1a-B13".equals(rule))throw new DomainFailure(422,"UNSUPPORTED_ANALYSIS_RULE");var from=OffsetDateTime.parse(start).toInstant();var until=OffsetDateTime.parse(end).toInstant();var freeze=OffsetDateTime.parse(cutoff).toInstant();if(!until.isAfter(from) || freeze.isAfter(clock.instant()))throw new DomainFailure(422,"INVALID_ANALYSIS_PERIOD");var result=reader.read(new AnalyticsStore.Selection(metric,from,until,freeze,clinics,treatment==null?null:BusinessValues.id(treatment),dentist==null?null:BusinessValues.id(dentist)));audit.success(actor,"getAnalysis","Analysis",metric,clinics,request);return result;}
}
