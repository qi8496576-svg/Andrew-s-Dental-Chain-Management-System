package com.adc.identity.bootstrap;

import com.adc.domain.staffaccounts.StaffAccountRules;
import com.adc.domain.shared.*;
import com.adc.identity.PasswordHasher;
import com.adc.infrastructure.*;
import java.nio.file.*;
import java.sql.*;
import java.time.*;
import java.util.*;
import tools.jackson.databind.json.JsonMapper;

/** Operator-only entry point. No HTTP registration, default account, or business resource seeding. */
public final class HeadquartersBootstrap {
    private HeadquartersBootstrap(){ }
    public record Input(String username,String staff_reference,String operator_reference,Set<String> clinic_ids,Set<String> capabilities,String valid_until) { }
    private static final Set<String> HQ=Set.of("account.manage","authorization.manage","resource.read","resource.write","analysis.read","cost.verify","performance.calculate","performance.publish","sensitive.drilldown","audit.read");
    public static String initialize(Connection connection,Input input,String password,PasswordHasher hasher)throws Exception {
        StaffAccountRules.required(input.username,100);StaffAccountRules.required(input.staff_reference,100);StaffAccountRules.required(input.operator_reference,200);
        if(input.clinic_ids==null || input.clinic_ids.isEmpty() || input.capabilities==null || input.capabilities.isEmpty() || !HQ.containsAll(input.capabilities))throw new IllegalArgumentException("Explicit valid scopes and capabilities required");
        Instant now=Instant.now(),until=input.valid_until==null?null:BusinessTime.timestamp(input.valid_until);
        if(until!=null && !until.isAfter(now))throw new IllegalArgumentException("Future validity end required");
        if(!connection.getAutoCommit())throw new IllegalStateException("Bootstrap requires an owned connection outside a transaction");
        String lock=TransactionLocks.name("operator-bootstrap","headquarters");boolean locked=false;
        try {
            try(var s=connection.prepareStatement("SELECT GET_LOCK(?,0)")){s.setString(1,lock);try(var r=s.executeQuery()){locked=r.next() && r.getInt(1)==1 && !r.wasNull();}}
            if(!locked)throw new IllegalStateException("Headquarters initialization already running");
            connection.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);connection.setAutoCommit(false);
            try(var s=connection.createStatement();var r=s.executeQuery("SELECT COUNT(*) FROM adc_identity.AccessGrant WHERE role_code='HEADQUARTERS'")){r.next();if(r.getLong(1)!=0)throw new IllegalStateException("Headquarters initialization has already occurred; recovery requires the authorized recovery workflow");}
            var clinics=new TreeSet<Long>();for(String id:input.clinic_ids) {
                long clinic=BusinessValues.id(id);try(var s=connection.prepareStatement("SELECT clinic_id FROM adc_business.Clinic WHERE clinic_id=?")){s.setLong(1,clinic);try(var r=s.executeQuery()){if(!r.next())throw new IllegalArgumentException("Verified clinic does not exist");}}clinics.add(clinic);
            }
            String system=UUID.randomUUID().toString(),subject=UUID.randomUUID().toString(),grant=UUID.randomUUID().toString();var time=LocalDateTime.ofInstant(now,ZoneOffset.UTC);
            execute(connection,"INSERT INTO adc_identity.Subject VALUES (?,'SYSTEM',true,?,NULL)",system,time);
            execute(connection,"INSERT INTO adc_identity.Subject VALUES (?,'STAFF',true,?,NULL)",subject,time);
            execute(connection,"INSERT INTO adc_identity.StaffAccount VALUES (?,?,?,NULL,?,false,?,?)",subject,input.username,input.staff_reference,hasher.encode(password),time,input.operator_reference);
            execute(connection,"INSERT INTO adc_identity.AccessGrant VALUES (?,?,'HEADQUARTERS',?,?,?,NULL,NULL,?,?)",grant,subject,system,time,until==null?null:LocalDateTime.ofInstant(until,ZoneOffset.UTC),"OWNER_VERIFIED_INITIALIZATION",time);
            for(long clinic:clinics)execute(connection,"INSERT INTO adc_identity.GrantClinicScope VALUES (?,?)",grant,clinic);
            for(String capability:new TreeSet<>(input.capabilities))execute(connection,"INSERT INTO adc_identity.GrantCapability VALUES (?,?)",grant,capability);
            String scope=JsonMapper.builder().build().writeValueAsString(clinics.stream().map(Object::toString).toList());
            execute(connection,"INSERT INTO adc_audit.AuditEvent (audit_id,subject_id,actor_kind,action,object_kind,object_id,clinic_scope,occurred_at,request_id,result,reason,verification_reference) VALUES (?,?,'SYSTEM','bootstrapHeadquarters','StaffAccount',?,?,?,?,'SUCCESS','OWNER_VERIFIED_INITIALIZATION',?)",Crypto.id(),system,subject,scope,time,UUID.randomUUID().toString(),input.operator_reference);
            connection.commit();return subject;
        } catch(Exception error){if(!connection.getAutoCommit())connection.rollback();throw error;}
        finally {
            if(!connection.getAutoCommit())connection.setAutoCommit(true);
            if(locked)try(var s=connection.prepareStatement("SELECT RELEASE_LOCK(?)")){s.setString(1,lock);try(var r=s.executeQuery()){if(!r.next() || r.getInt(1)!=1)throw new IllegalStateException("Bootstrap lock cleanup failed");}}
        }
    }
    private static void execute(Connection c,String sql,Object...values)throws SQLException {try(var s=c.prepareStatement(sql)){for(int i=0;i<values.length;i++)s.setObject(i+1,values[i]);s.executeUpdate();}}
    private static String required(String name){String value=System.getenv(name);if(value==null || value.isBlank())throw new IllegalArgumentException("Missing configuration: "+name);return value;}
    private static String secretFile(String name)throws Exception {String text=Files.readString(Path.of(required(name)));if(text.endsWith("\r\n"))text=text.substring(0,text.length()-2);else if(text.endsWith("\n"))text=text.substring(0,text.length()-1);if(text.isEmpty())throw new IllegalArgumentException("Empty secret file");return text;}
    public static void main(String[] args)throws Exception {
        if(args.length!=0)throw new IllegalArgumentException("Bootstrap accepts configuration files only; no credential arguments");
        var mapper=JsonMapper.builder().build();var node=mapper.readTree(Files.readString(Path.of(required("ADC_BOOTSTRAP_INPUT_FILE"))));
        if(!node.has("valid_until"))throw new IllegalArgumentException("Explicit valid_until is required; null means no scheduled end");
        Input input=mapper.treeToValue(node,Input.class);
        try(var c=DriverManager.getConnection(required("ADC_DB_URL"),required("ADC_DB_USERNAME"),secretFile("ADC_BOOTSTRAP_DB_PASSWORD_FILE"))) {
            try(var s=c.createStatement()){s.execute("SET time_zone='+00:00'");}
            String subject=initialize(c,input,secretFile("ADC_BOOTSTRAP_PASSWORD_FILE"),new PasswordHasher());
            System.out.println("Headquarters initialized: "+subject);
        }
    }
}
