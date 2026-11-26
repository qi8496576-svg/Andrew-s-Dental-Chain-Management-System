package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.AdcApplication;
import com.adc.identity.PasswordHasher;
import java.net.*;
import java.nio.file.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.server.context.WebServerApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.jdbc.core.JdbcTemplate;

/** Real browser -> test-only HTTPS static gateway -> real Boot/Security -> owned MySQL. No API mocks. */
class AuthenticationBrowserIT extends MigratedDatabaseTest {
    @Test void realHttpsBrowserCompletesPersonalLoginAndLogout() throws Exception {
        Path root=SchemaBaselineIT.ROOT,evidence=root.resolve("docs/verification/database");
        Path temporary=Files.createTempDirectory(root.resolve("tmp/build-temp"),"auth-browser-");
        Path pfx=temporary.resolve("test.p12");String secret=UUID.randomUUID().toString();
        String keytoolName=System.getProperty("os.name").startsWith("Windows")?"keytool.exe":"keytool";
        String node=java.util.Objects.requireNonNullElse(System.getenv("ADC_NODE"),"node");
        var keytool=new ProcessBuilder(Path.of(System.getProperty("java.home"),"bin",keytoolName).toString(),"-genkeypair","-alias","adc-test","-keyalg","RSA","-keysize","2048","-storetype","PKCS12","-keystore",pfx.toString(),"-storepass:env","ADC_E2E_KEY_PASSWORD","-dname","CN=localhost","-validity","2","-ext","SAN=dns:localhost,ip:127.0.0.1","-noprompt");
        keytool.environment().put("ADC_E2E_KEY_PASSWORD",secret);keytool.redirectErrorStream(true).redirectOutput(evidence.resolve("browser-keytool.log").toFile());
        try {
            var certificate=keytool.start();assertTrue(certificate.waitFor(45,TimeUnit.SECONDS));assertEquals(0,certificate.exitValue());
            int port;try(var reservation=new java.net.ServerSocket(0,0,InetAddress.getLoopbackAddress())){port=reservation.getLocalPort();}
            String origin="https://127.0.0.1:"+port;
            try(var credentials=runtimeDataSource()) {
                var properties=new HashMap<String,Object>();properties.put("server.port",0);properties.put("adc.web-origin",origin);properties.put("adc.performance.scheduling.enabled",false);
                properties.put("spring.datasource.url",credentials.getJdbcUrl());properties.put("spring.datasource.username",credentials.getUsername());properties.put("spring.datasource.password",credentials.getPassword());
                try(var app=new SpringApplicationBuilder(AdcApplication.class).initializers(context->context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("owned-browser-fixture",properties))).run()) {
                    var db=app.getBean(JdbcTemplate.class);String username="browser-fixture",password=UUID.randomUUID().toString();
                    db.update("INSERT INTO adc_identity.Subject VALUES ('browser-fixture','STAFF',true,UTC_TIMESTAMP(),NULL)");
                    db.update("INSERT INTO adc_identity.StaffAccount VALUES ('browser-fixture',?,'verified fixture',NULL,?,false,UTC_TIMESTAMP(),'fixture')",username,app.getBean(PasswordHasher.class).encode(password));
                    db.update("INSERT INTO adc_business.Clinic VALUES (1,'BROWSER-C1','Fixture',NULL,'000',NULL,NULL,true,UTC_TIMESTAMP())");
                    db.update("INSERT INTO adc_business.Allergy VALUES (1,'Fixture allergy',NULL,true)");
                    String manager="browser-account-manager",managerPassword=UUID.randomUUID().toString(),recoveredPassword=UUID.randomUUID().toString();
                    try(var connection=app.getBean(javax.sql.DataSource.class).getConnection()) {
                        com.adc.identity.bootstrap.HeadquartersBootstrap.initialize(connection,new com.adc.identity.bootstrap.HeadquartersBootstrap.Input(manager,"verified browser fixture staff","verified isolated test operator",Set.of("1"),Set.of("account.manage","authorization.manage","resource.read","resource.write"),null),managerPassword,app.getBean(PasswordHasher.class));
                    }
                    // Owned preconditions for resource impact validation; not evidence that booking has been implemented.
                    String selection=System.getenv("ADC_BROWSER_TEST_FILE");
                    if("analytics.spec.ts".equals(selection))seedAnalytics(db);
                    if("invoicing.spec.ts".equals(selection) || "quarterly-performance.spec.ts".equals(selection)) {
                        // Owned, previously completed clinical facts. This fixture does not
                        // replace the separately passed UC03 creation/authorization evidence.
                        var yesterday=java.time.LocalDate.now(com.adc.domain.shared.BusinessTime.ZONE).minusDays(1);
                        if("quarterly-performance.spec.ts".equals(selection)){var day=java.time.LocalDate.now(com.adc.domain.shared.BusinessTime.ZONE);yesterday=java.time.LocalDate.of(day.getYear(),((day.getMonthValue()-1)/3)*3+1,1).minusDays(1);}
                        var at=yesterday.atTime(9,0).atZone(com.adc.domain.shared.BusinessTime.ZONE).withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime();
                        for(int dentist:List.of(21,22)){db.update("INSERT INTO adc_business.Dentist (dentist_id,employee_number,full_name,date_of_birth,home_address,phone,email,hire_date,is_active,created_at,termination_date) VALUES (?,?,'虚构费用来源牙医','1980-01-02',NULL,'000',NULL,'2020-01-01',true,?,NULL)",dentist,"INVOICE-D"+dentist,at.minusDays(1));db.update("INSERT INTO adc_business.DentistClinicAssignment VALUES (?,?,1,'2020-01-01',NULL,NULL,true)",dentist+10,dentist);}
                        db.update("INSERT INTO adc_business.DentistSchedule VALUES (41,21,1,?,'09:00:00','10:00:00',20,'NORMAL',NULL,?)",yesterday,at.minusDays(1));
                        db.update("INSERT INTO adc_business.Patient VALUES (51,'INVOICE-P51','虚构费用来源患者','1990-01-01','Unrelated billing fixture','000',NULL,'Fixture','000',?,?,'NO_KNOWN')",at.minusDays(1),at.minusDays(1));
                        db.update("INSERT INTO adc_business.Treatment VALUES (71,'INVOICE-STANDARD','历史有价治疗',NULL,99.00,true),(72,'INVOICE-FREE','实际免费咨询',NULL,0.00,true)");
                        db.update("INSERT INTO adc_business.Appointment (appointment_id,patient_id,clinic_id,dentist_id,schedule_id,scheduled_at,status,created_at,updated_at,attended_at,completed_at) VALUES (61,51,1,21,41,?,'COMPLETED',?,?,?,?)",at,at.minusDays(1),at.plusMinutes(10),at,at.plusMinutes(10));
                        db.update("INSERT INTO adc_business.Appointment (appointment_id,patient_id,clinic_id,dentist_id,schedule_id,scheduled_at,status,created_at,updated_at) VALUES (62,51,1,21,41,?,'SCHEDULED',?,?)",at.plusMinutes(20),at.minusDays(1),at.minusDays(1));
                        db.update("INSERT INTO adc_business.AppliedTreatment VALUES (91,61,71,22,1.50,10.01,15.02,?),(92,61,72,22,1.00,0.00,0.00,?)",at.plusMinutes(5),at.plusMinutes(6));
                        db.update("INSERT INTO adc_business.AppointmentEvent VALUES (81,61,'BOOK',NULL,'SCHEDULED',?,'RECEPTION','owned-history',NULL,'owned-book',NULL),(82,61,'ATTEND','SCHEDULED','IN_PROGRESS',?,'RECEPTION','owned-history',NULL,'owned-attend',NULL),(83,61,'COMPLETE','IN_PROGRESS','COMPLETED',?,'DENTIST','owned-history-actual-22',NULL,'owned-complete',NULL)",at.minusDays(1),at,at.plusMinutes(10));
                    }
                    if("quarterly-performance.spec.ts".equals(selection)) {
                        db.update("UPDATE adc_business.AppliedTreatment SET standard_units=1.00,unit_price=1000.00,subtotal=1000.00 WHERE applied_treatment_id=91");
                        db.update("UPDATE adc_business.Appointment SET status='INVOICED' WHERE appointment_id=61");
                        db.update("INSERT INTO adc_business.Invoice SELECT 201,'OWNED-QUARTER-SOURCE',61,completed_at,1000.00,'ISSUED',completed_at FROM adc_business.Appointment WHERE appointment_id=61");
                        db.update("INSERT INTO adc_business.InvoiceItem VALUES (301,201,91,1,'历史有价治疗',1.00,1000.00,1000.00),(302,201,92,2,'实际免费咨询',1.00,0.00,0.00)");
                        db.update("INSERT INTO adc_business.AppointmentEvent SELECT 84,61,'INVOICE','COMPLETED','INVOICED',completed_at,'CASHIER','owned-previously-verified-uc04',NULL,'owned-invoice-history',NULL FROM adc_business.Appointment WHERE appointment_id=61");
                    }
                    if("appointment-review.spec.ts".equals(selection)) {
                        // Owned historical preconditions: the original booking predates today.
                        // No API is allowed to create a new appointment in the past.
                        var yesterday=java.time.LocalDate.now(com.adc.domain.shared.BusinessTime.ZONE).minusDays(1);
                        var scheduled=yesterday.atTime(9,0).atZone(com.adc.domain.shared.BusinessTime.ZONE).withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime();
                        db.update("INSERT INTO adc_business.Dentist (dentist_id,employee_number,full_name,date_of_birth,home_address,phone,email,hire_date,is_active,created_at,termination_date) VALUES (21,'HISTORY-D21','虚构历史牙医','1980-01-02',NULL,'000',NULL,'2020-01-01',true,UTC_TIMESTAMP(),NULL)");
                        db.update("INSERT INTO adc_business.DentistClinicAssignment VALUES (31,21,1,'2020-01-01',NULL,NULL,true)");
                        db.update("INSERT INTO adc_business.DentistSchedule VALUES (41,21,1,?,'09:00:00','10:00:00',20,'NORMAL',NULL,?)",yesterday,scheduled.minusDays(1));
                        db.update("INSERT INTO adc_business.Patient VALUES (51,'HISTORY-P51','虚构历史预约患者','1990-01-01','Fixture','000',NULL,'Fixture','000',?,?, 'NOT_REVIEWED')",scheduled.minusDays(1),scheduled.minusDays(1));
                        db.update("INSERT INTO adc_business.Treatment VALUES (71,'HISTORY-CONSULT','历史预约咨询',NULL,0.00,true)");
                        db.update("INSERT INTO adc_business.Appointment (appointment_id,patient_id,clinic_id,dentist_id,schedule_id,scheduled_at,status,created_at,updated_at) VALUES (61,51,1,21,41,?,'SCHEDULED',?,?)",scheduled,scheduled.minusDays(1),scheduled.minusDays(1));
                        db.update("INSERT INTO adc_business.AppointmentRequestedTreatment VALUES (61,71,'owned historical fixture')");
                        db.update("INSERT INTO adc_business.AppointmentEvent VALUES (81,61,'BOOK',NULL,'SCHEDULED',?,'RECEPTION','owned-historical-fixture',NULL,'owned-history',NULL)",scheduled.minusDays(1));
                    }
                    String nativeA=Crypto.token(),nativeB=Crypto.token();
                    if(selection!=null && Set.of("patient-bindings.spec.ts","appointment-booking.spec.ts","appointment-transitions.spec.ts").contains(selection)) {
                        for(String subject:List.of("browser-native-a","browser-native-b")) {
                            db.update("INSERT INTO adc_identity.Subject VALUES (?,'PATIENT',true,UTC_TIMESTAMP(),NULL)",subject);
                            db.update("INSERT INTO adc_identity.Session VALUES (?,?,?,'WECHAT',NULL,UTC_TIMESTAMP(),UTC_TIMESTAMP(),DATE_ADD(UTC_TIMESTAMP(),INTERVAL 8 HOUR),NULL,NULL)",subject,subject,Crypto.sha256(subject.endsWith("a")?nativeA:nativeB));
                        }
                    }
                    if(selection==null || selection.equals("organization-resources.spec.ts")) {
                        var tomorrow=java.time.LocalDate.now(com.adc.domain.shared.BusinessTime.ZONE).plusDays(1);
                        var scheduled=tomorrow.atTime(9,0).atZone(com.adc.domain.shared.BusinessTime.ZONE).withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime();
                        db.update("INSERT INTO adc_business.Dentist (dentist_id,employee_number,full_name,date_of_birth,home_address,phone,email,hire_date,is_active,created_at,termination_date) VALUES (21,'FUTURE-D-21','虚构牙医 未来安排验证','1980-01-02',NULL,'000',NULL,'2020-01-01',true,UTC_TIMESTAMP(),NULL)");
                        db.update("INSERT INTO adc_business.DentistClinicAssignment VALUES (31,21,1,'2020-01-01',NULL,'future impact fixture',true)");
                        db.update("INSERT INTO adc_business.DentistSchedule VALUES (41,21,1,?,'09:00:00','10:00:00',30,'NORMAL',NULL,UTC_TIMESTAMP())",tomorrow);
                        db.update("INSERT INTO adc_business.Patient VALUES (51,'FUTURE-P51','虚构患者 前置记录','1990-01-01','Fixture','000',NULL,'Fixture','000',UTC_TIMESTAMP(),UTC_TIMESTAMP(),'NOT_REVIEWED')");
                        db.update("INSERT INTO adc_business.Treatment VALUES (71,'FUTURE-CONSULT','前置咨询目录',NULL,0.00,true)");
                        db.update("INSERT INTO adc_business.Appointment (appointment_id,patient_id,clinic_id,dentist_id,schedule_id,scheduled_at,status,created_at,updated_at) VALUES (61,51,1,21,41,?,'SCHEDULED',UTC_TIMESTAMP(),UTC_TIMESTAMP())",scheduled);
                        db.update("INSERT INTO adc_business.AppointmentRequestedTreatment VALUES (61,71,'isolated resource impact precondition')");
                    }
                    var proxy=new ProcessBuilder(node,root.resolve("tools/verification/serve-auth-e2e.mjs").toString());
                    proxy.environment().putAll(Map.of("ADC_E2E_DIST",root.resolve("apps/admin/dist").toString(),"ADC_E2E_BACKEND","http://127.0.0.1:"+((WebServerApplicationContext)app).getWebServer().getPort(),"ADC_E2E_PFX",pfx.toString(),"ADC_E2E_KEY_PASSWORD",secret,"ADC_E2E_PORT",Integer.toString(port)));
                    proxy.redirectErrorStream(true).redirectOutput(evidence.resolve("browser-https-gateway.log").toFile());var gateway=proxy.start();
                    try {
                        boolean ready=false;long deadline=System.nanoTime()+Duration.ofSeconds(20).toNanos();
                        while(System.nanoTime()<deadline && gateway.isAlive()) {
                            try(var socket=new Socket()){socket.connect(new InetSocketAddress("127.0.0.1",port),200);ready=true;break;}
                            catch(java.io.IOException ignored){Thread.sleep(100);}
                        }
                        assertTrue(ready,"Owned HTTPS gateway must start");
                        var runner=new ProcessBuilder(node,"node_modules/@playwright/test/cli.js","test","--config","playwright.auth.config.ts").directory(root.resolve("apps/admin").toFile());
                        String selected=java.util.Objects.requireNonNullElse(System.getenv("ADC_BROWSER_TEST_FILE"),"authentication.spec.ts");
                        if(selected!=null){if(!Set.of("authentication.spec.ts","staff-accounts.spec.ts","clinic-grants.spec.ts","shell.spec.ts","patients.spec.ts","organization-resources.spec.ts","patient-bindings.spec.ts","schedules.spec.ts","appointment-booking.spec.ts","appointment-transitions.spec.ts","appointment-review.spec.ts","clinical-treatment.spec.ts","invoicing.spec.ts","quarterly-performance.spec.ts","analytics.spec.ts").contains(selected))throw new IllegalArgumentException("Unknown browser verification module");runner.command().add(selected);}
                        runner.environment().putAll(Map.of("ADC_NATIVE_A",nativeA,"ADC_NATIVE_B",nativeB));
                        runner.environment().putAll(Map.of("ADC_AUTH_BASE_URL",origin,"ADC_TEST_USERNAME",username,"ADC_TEST_PASSWORD",password,"ADC_LOGIN_SCREENSHOT",root.resolve("docs/verification/authentication-login.png").toString()));
                        runner.environment().putAll(Map.of("ADC_MANAGER_USERNAME",manager,"ADC_MANAGER_PASSWORD",managerPassword,"ADC_RECOVERED_PASSWORD",recoveredPassword));
                        runner.environment().put("ADC_GRANT_SCREENSHOT",root.resolve("docs/verification/clinic-grants.png").toString());
                        runner.environment().put("ADC_PATIENT_SCREENSHOT",root.resolve("docs/verification/patients.png").toString());
                        runner.environment().put("ADC_RESOURCE_SCREENSHOT",root.resolve("docs/verification/organization-resources.png").toString());
                        Path browserLog=evidence.resolve(selected==null?"authentication-browser.log":selected.replace(".spec.ts","")+"-browser.log");
                        runner.redirectErrorStream(true).redirectOutput(browserLog.toFile());var browser=runner.start();
                        try {assertTrue(browser.waitFor(150,TimeUnit.SECONDS),"Browser verification timed out");assertEquals(0,browser.exitValue(),"See "+browserLog.getFileName());}
                        finally {if(browser.isAlive())browser.destroyForcibly();}
                        assertTrue(db.queryForObject("SELECT COUNT(*) FROM adc_audit.AuditEvent WHERE action='logout' AND result='SUCCESS'",Integer.class)>0);
                        if("analytics.spec.ts".equals(selection)){assertEquals("SCHEDULED",db.queryForObject("SELECT status FROM adc_business.Appointment WHERE appointment_id=105",String.class));assertEquals("NORMAL",db.queryForObject("SELECT schedule_status FROM adc_business.DentistSchedule WHERE schedule_id=142",String.class));assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_business.CostEntry",Integer.class));assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_business.Invoice",Integer.class));}
                        if(selection==null || selection.equals("organization-resources.spec.ts")){assertEquals("SCHEDULED",db.queryForObject("SELECT status FROM adc_business.Appointment WHERE appointment_id=61",String.class));assertEquals("NORMAL",db.queryForObject("SELECT schedule_status FROM adc_business.DentistSchedule WHERE schedule_id=41",String.class));}
                    } finally {gateway.destroy();if(!gateway.waitFor(10,TimeUnit.SECONDS))gateway.destroyForcibly();}
                }
            }
        } finally {Files.deleteIfExists(pfx);Files.deleteIfExists(temporary);}
    }
    /** Owned, already-validated historical facts; this is not UC01/UC03 creation evidence. */
    private static void seedAnalytics(JdbcTemplate db){
        var zone=com.adc.domain.shared.BusinessTime.ZONE;var day=java.time.LocalDate.now(zone).minusDays(1);var skill=day.minusDays(1);var created=day.minusDays(3).atStartOfDay(zone).withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime();
        for(long id:List.of(21L,22L)){db.update("INSERT INTO adc_business.Dentist (dentist_id,employee_number,full_name,date_of_birth,home_address,phone,email,hire_date,is_active,created_at,termination_date) VALUES (?,?,'虚构分析牙医','1980-01-01',NULL,'000',NULL,'2020-01-01',true,?,NULL)",id,"ANALYTICS-D"+id,created);db.update("INSERT INTO adc_business.DentistClinicAssignment VALUES (?,?,1,'2020-01-01',NULL,NULL,true)",id+10,id);}
        db.update("INSERT INTO adc_business.Patient VALUES (51,'ANALYTICS-P51','虚构汇总来源患者','1990-01-01','Private billing fixture','000',NULL,'Fixture','000',?,?,'NO_KNOWN')",created,created);
        db.update("INSERT INTO adc_business.Treatment VALUES (71,'ANALYTICS-STANDARD','同标准单位治疗',NULL,20.00,true),(72,'ANALYTICS-FREE','真实免费咨询',NULL,0.00,true)");db.update("INSERT INTO adc_business.Qualification VALUES (81,'分析必需资质',NULL,true),(82,'分析非必需资质',NULL,true)");db.update("INSERT INTO adc_business.TreatmentQualification VALUES (71,81,true),(71,82,false)");db.update("INSERT INTO adc_business.DentistQualification VALUES (21,81,'owned-required','2020-01-01',NULL,'VERIFIED'),(22,82,'owned-optional','2020-01-01',NULL,'VERIFIED')");
        db.update("INSERT INTO adc_business.DentistSchedule VALUES (141,21,1,?,'08:00:00','10:00:00',10,'NORMAL',NULL,?),(142,21,1,?,'08:00:00','09:00:00',10,'NORMAL',NULL,?),(143,22,1,?,'08:00:00','08:40:00',10,'NORMAL',NULL,?)",day,created,skill,created,skill,created);
        for(int i=0;i<12;i++){long id=100+i;var at=day.atTime(8+i/6,(i%6)*10).atZone(zone).withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime();String kind=i<2?"PATIENT_CANCEL":i==2?"NO_SHOW":i==3?"CLINIC_CANCEL":i==4?"CLINIC_RESCHEDULE":null;String status=kind!=null?"CANCELLED":i==5?"SCHEDULED":"COMPLETED";var cancelled="NO_SHOW".equals(kind)?at.plusMinutes(10):at;boolean completed=status.equals("COMPLETED");db.update("INSERT INTO adc_business.Appointment (appointment_id,patient_id,clinic_id,dentist_id,schedule_id,scheduled_at,status,created_at,updated_at,attended_at,completed_at,cancelled_at,cancellation_reason,cancellation_kind) VALUES (?,51,1,21,141,?,?,?,?,?,?,?,?,?)",id,at,status,created,at,completed?at:null,completed?at.plusMinutes(5):null,kind==null?null:cancelled,kind==null?null:"owned verified history",kind);db.update("INSERT INTO adc_business.AppointmentEvent VALUES (?,?,'BOOK',NULL,'SCHEDULED',?,'RECEPTION','owned-book',NULL,?,NULL)",1000+id,id,created,"book-"+id);if(kind!=null)db.update("INSERT INTO adc_business.AppointmentEvent VALUES (?,?,'CANCEL','SCHEDULED','CANCELLED',?,'RECEPTION','owned-confirmed-action',JSON_OBJECT('cancellation_kind',?),?,NULL)",2000+id,id,cancelled,kind,"cancel-"+id);if(completed){db.update("INSERT INTO adc_business.AppointmentEvent VALUES (?,?,'ATTEND','SCHEDULED','IN_PROGRESS',?,'RECEPTION','owned-attendance',NULL,?,NULL),(?,?,'COMPLETE','IN_PROGRESS','COMPLETED',?,'DENTIST','owned-actual-doctor',NULL,?,NULL)",3000+id,id,at,"attend-"+id,4000+id,id,at.plusMinutes(5),"complete-"+id);db.update("INSERT INTO adc_business.AppliedTreatment VALUES (?,?,72,21,1.00,0.00,0.00,?)",5000+id,id,at.plusMinutes(1));}}
        for(int i=0;i<4;i++){long id=201+i;var at=skill.atTime(8,i*10).atZone(zone).withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime();db.update("INSERT INTO adc_business.Appointment (appointment_id,patient_id,clinic_id,dentist_id,schedule_id,scheduled_at,status,created_at,updated_at) VALUES (?,51,1,21,142,?,'SCHEDULED',?,?)",id,at,created,created);db.update("INSERT INTO adc_business.AppointmentEvent VALUES (?,?,'BOOK',NULL,'SCHEDULED',?,'RECEPTION','owned-book',NULL,?,NULL)",6000+id,id,created,"occupied-"+id);}
        var performed=day.atTime(9,1).atZone(zone).withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime();db.update("INSERT INTO adc_business.AppliedTreatment VALUES (391,106,71,21,1.00,10.00,10.00,?),(392,106,71,21,3.00,20.00,60.00,?)",performed,performed.plusMinutes(1));
    }
}





