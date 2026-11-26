package com.adc.application;

import com.adc.domain.shared.*;
import com.adc.identity.IdentityGate;
import com.adc.infrastructure.AuditWriter;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

/** The existing UC06 allergy catalog read needed by UC05; remaining UC06 work stays in T023. */
@Service
@Transactional(isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
public class OrganizationResourceService {
    private final IdentityGate gate;private final JdbcTemplate db;private final AuditWriter audit;
    public OrganizationResourceService(IdentityGate gate,JdbcTemplate db,AuditWriter audit){this.gate=gate;this.db=db;this.audit=audit;}
    public Map<String,Object> allergies(String token,String client,String cursor,int limit,String request) {
        var identity=new IdentityGate.Identity[1];AuditWriter.onRollback(audit,()->identity[0],"listAllergy",request);
        var actor=gate.authenticate(token,client);identity[0]=actor;List<Long> scope;boolean headquarters=false;
        if(actor.subjectType().equals("PATIENT")) {
            var patients=db.query("SELECT patient_id FROM adc_identity.CurrentPatientBinding WHERE subject_id=?",(r,n)->r.getLong(1),actor.subjectId());
            if(patients.isEmpty())throw new DomainFailure(403,"PATIENT_BINDING_REQUIRED");gate.requirePatient(actor,patients.getFirst());scope=List.of();
        } else {
            try {scope=gate.staffClinics(actor,"HEADQUARTERS","resource.read");headquarters=true;}
            catch(DomainFailure noRead){try{scope=gate.staffClinics(actor,"HEADQUARTERS","resource.write");headquarters=true;}catch(DomainFailure noWrite){scope=gate.staffClinics(actor,"RECEPTION","addPatientAllergy");}}
        }
        if(limit<1 || limit>100)throw new DomainFailure(400,"INVALID_REQUEST");long after=0;
        if(cursor!=null)try{after=BusinessValues.id(new String(Base64.getUrlDecoder().decode(cursor),java.nio.charset.StandardCharsets.UTF_8));}catch(IllegalArgumentException e){throw new DomainFailure(400,"INVALID_REQUEST");}
        var items=db.query("SELECT allergy_id,allergy_name,is_active FROM adc_business.Allergy WHERE allergy_id>?"+(headquarters?"":" AND is_active=true")+" ORDER BY allergy_id LIMIT ?",(r,n)->Map.<String,Object>of("id",r.getString(1),"label",r.getString(2),"active",r.getBoolean(3)),after,limit+1);
        String next=null;if(items.size()>limit){items=new ArrayList<>(items.subList(0,limit));next=Base64.getUrlEncoder().withoutPadding().encodeToString(((String)items.getLast().get("id")).getBytes(java.nio.charset.StandardCharsets.UTF_8));}
        var result=new LinkedHashMap<String,Object>();result.put("items",items);result.put("next_cursor",next);audit.success(actor,"listAllergy","Allergy",null,scope,request);return result;
    }
}
