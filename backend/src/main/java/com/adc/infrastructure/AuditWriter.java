package com.adc.infrastructure;

import com.adc.identity.IdentityGate.Identity;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
public class AuditWriter {
    private final JdbcTemplate db; private final Clock clock;
    public AuditWriter(JdbcTemplate db,Clock clock) { this.db=db;this.clock=clock; }
    public static void onRollback(AuditWriter writer,java.util.function.Supplier<Identity> identity,String action,String requestId) {
        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(new org.springframework.transaction.support.TransactionSynchronization() {
            @Override public void afterCompletion(int status) {
                if(status==STATUS_ROLLED_BACK) {
                    try { writer.failureAfterRollback(identity.get(),action,requestId); }
                    catch(RuntimeException e) { org.slf4j.LoggerFactory.getLogger(AuditWriter.class).error("Failure audit unavailable; request_id={}",requestId); }
                }
            }
        });
    }
    @Transactional(propagation=Propagation.MANDATORY)
    public void success(Identity identity,String action,String kind,String object,List<Long> clinics,String request) {
        insert(identity,action,kind,object,clinics,request,"SUCCESS",null);
    }
    @Transactional(propagation=Propagation.MANDATORY)
    public void success(Identity identity,String action,String kind,String object,List<Long> clinics,String request,String reason,String verification) {
        insert(identity,action,kind,object,clinics,request,"SUCCESS",reason,verification);
    }
    @Transactional(propagation=Propagation.MANDATORY)
    public void successChanges(Identity identity,String action,String kind,String object,List<Long> clinics,String request,String reason,String verification,String changes) {
        insert(identity,action,kind,object,clinics,request,"SUCCESS",reason,verification,changes);
    }
    @Transactional(propagation=Propagation.REQUIRES_NEW,isolation=Isolation.READ_COMMITTED,rollbackFor=Exception.class)
    public void failure(Identity identity,String action,String request) {
        insert(identity,action,"Request",null,List.of(),request,"FAILURE","REQUEST_REJECTED_OR_ROLLED_BACK");
    }
    /** Called only after the original JDBC rollback completed, before its connection is returned.
     * A fresh short transaction on that same connection avoids pool starvation under concurrent rejection.
     */
    public void failureAfterRollback(Identity identity,String action,String request) {
        var resource=org.springframework.transaction.support.TransactionSynchronizationManager.getResource(Objects.requireNonNull(db.getDataSource()));
        if(!(resource instanceof org.springframework.jdbc.datasource.ConnectionHolder holder))throw new IllegalStateException("Completed JDBC connection required");
        var connection=holder.getConnection();
        try {
            if(connection.getAutoCommit())throw new IllegalStateException("Explicit audit transaction required");
            insert(identity,action,"Request",null,List.of(),request,"FAILURE","REQUEST_REJECTED_OR_ROLLED_BACK");
            connection.commit();
        } catch(Exception error) {
            try {connection.rollback();}catch(java.sql.SQLException ignored){ }
            if(error instanceof RuntimeException runtime)throw runtime;
            throw new IllegalStateException("Failure audit unavailable");
        }
    }
    @Transactional(propagation=Propagation.MANDATORY)
    public void authenticationFailure(String action,String target,String request) {
        insert(null,action,"Authentication",target,List.of(),request,"FAILURE","AUTHENTICATION_REJECTED");
    }
    @Transactional(propagation=Propagation.MANDATORY)
    public void identityProviderFailure(String request) {insert(null,"createWechatSession","Authentication",null,List.of(),request,"FAILURE","IDENTITY_UNAVAILABLE");}
    private void insert(Identity identity,String action,String kind,String object,List<Long> clinics,String request,String result,String reason) {
        insert(identity,action,kind,object,clinics,request,result,reason,null);
    }
    private void insert(Identity identity,String action,String kind,String object,List<Long> clinics,String request,String result,String reason,String verification) {
        insert(identity,action,kind,object,clinics,request,result,reason,verification,null);
    }
    private void insert(Identity identity,String action,String kind,String object,List<Long> clinics,String request,String result,String reason,String verification,String changes) {
        String scope=clinics.stream().sorted().map(id->"\""+id+"\"").collect(java.util.stream.Collectors.joining(",","[","]"));
        db.update("INSERT INTO adc_audit.AuditEvent (audit_id,subject_id,actor_kind,action,object_kind,object_id,clinic_scope,occurred_at,request_id,result,reason,verification_reference,change_summary) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            Crypto.id(),identity==null?null:identity.subjectId(),identity==null?"ANONYMOUS":identity.subjectType(),action,kind,object,scope,LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC),request,result,reason,verification,changes==null?null:CanonicalJson.normalize(changes));
    }
}
