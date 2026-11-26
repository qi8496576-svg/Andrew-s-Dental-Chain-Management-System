package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.domain.shared.DomainFailure;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SchedulesIT {
    final OrganizationResourcesIT fixture=new OrganizationResourcesIT();ScheduleService schedules;
    final LocalDate date=LocalDate.parse("2026-11-12");
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @BeforeEach void setup()throws Exception{
        fixture.setup();var base=fixture.fixture;base.context.register(ScheduleStore.class,ScheduleService.class);schedules=base.context.getBean(ScheduleService.class);
        for(String cap:List.of("listSchedules","createSchedule","suspendSchedule"))base.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('other',?)",cap);
        base.db.update("INSERT INTO adc_business.Clinic VALUES (2,'C-2','Fixture',NULL,'000',NULL,NULL,true,?)",StaffAccountsIT.utc(base.now));
        base.db.update("INSERT INTO adc_business.Dentist (dentist_id,employee_number,full_name,date_of_birth,home_address,phone,email,hire_date,is_active,created_at,termination_date) VALUES (21,'D-21','Fictional Dentist','1980-01-01',NULL,'000',NULL,'2020-01-01',true,?,NULL)",StaffAccountsIT.utc(base.now));
        for(long clinic:List.of(1L,2L))base.db.update("INSERT INTO adc_business.DentistClinicAssignment VALUES (?,21,?,'2020-01-01',NULL,NULL,true)",30+clinic,clinic);
    }
    @AfterEach void close(){fixture.close();}
    AtomicCommandExecutor.Command command(String operation,String key){return new AtomicCommandExecutor.Command(fixture.fixture.other,"WEB",operation,key,Crypto.sha256(key),UUID.randomUUID().toString());}
    ScheduleService.Creation input(long clinic,String start,String end,int slot){return new ScheduleService.Creation(21,clinic,date,LocalTime.parse(start),LocalTime.parse(end),slot,null);}
    Map<String,Object> create(String key,String start,String end,int slot)throws Exception{return schedules.create(command("createSchedule",key),input(1,start,end,slot));}
    @Test void halfOpenSlotsOverlapAndHistoryRules()throws Exception{
        var first=create("first","09:00:00","10:00:00",20);create("adjacent","10:00:00","11:00:00",30);
        assertEquals(first,create("first","09:00:00","10:00:00",20));assertEquals(409,assertThrows(DomainFailure.class,()->create("overlap","09:30:00","10:30:00",20)).status());
        assertThrows(DomainFailure.class,()->create("zero","12:00:00","13:00:00",0));assertThrows(DomainFailure.class,()->create("remainder","12:00:00","13:00:00",17));assertThrows(DomainFailure.class,()->create("reverse","13:00:00","12:00:00",20));
        schedules.suspend(command("suspendSchedule","suspend"),Long.parseLong((String)first.get("schedule_id")),"医生临时停诊");create("historical-version","09:00:00","10:00:00",20);
        assertEquals(3,fixture.fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business.DentistSchedule",Integer.class));
    }
    @Test void employmentAssignmentScopeAndReplayAreRechecked()throws Exception{
        assertThrows(DomainFailure.class,()->schedules.create(command("createSchedule","foreign"),input(2,"09:00:00","10:00:00",20)));
        fixture.fixture.db.update("UPDATE adc_business.DentistClinicAssignment SET end_date='2026-11-11' WHERE clinic_id=1");assertThrows(DomainFailure.class,()->create("expired","09:00:00","10:00:00",20));
        fixture.fixture.db.update("UPDATE adc_business.DentistClinicAssignment SET end_date=NULL WHERE clinic_id=1");var result=create("valid","09:00:00","10:00:00",20);
        fixture.fixture.db.update("UPDATE adc_identity.AccessGrant SET revoked_at=?,revoked_by='hq' WHERE grant_id='other'",StaffAccountsIT.utc(fixture.fixture.now));assertThrows(DomainFailure.class,()->create("valid","09:00:00","10:00:00",20));
        assertEquals("NORMAL",result.get("schedule_status"));
    }
    @Test void firstScheduleInDifferentClinicsUsesSameStableDoctorLock()throws Exception{
        var base=fixture.fixture;base.db.update("UPDATE adc_identity.AccessGrant SET role_code='RECEPTION' WHERE grant_id='hq'");base.db.update("DELETE FROM adc_identity.GrantClinicScope WHERE grant_id='hq'");base.db.update("INSERT INTO adc_identity.GrantClinicScope VALUES ('hq',2)");base.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('hq','createSchedule')");
        try(var pool=Executors.newFixedThreadPool(2)){var start=new CountDownLatch(1);var a=pool.submit(()->{start.await();try{create("a","09:00:00","10:00:00",20);return 200;}catch(DomainFailure failure){return failure.status();}});var b=pool.submit(()->{start.await();try{schedules.create(new AtomicCommandExecutor.Command(base.token,"WEB","createSchedule","b",Crypto.sha256("b"),UUID.randomUUID().toString()),input(2,"09:00:00","10:00:00",20));return 200;}catch(DomainFailure failure){return failure.status();}});start.countDown();var statuses=new ArrayList<>(List.of(a.get(20,TimeUnit.SECONDS),b.get(20,TimeUnit.SECONDS)));Collections.sort(statuses);assertEquals(List.of(200,409),statuses);}
    }
    @Test void suspensionReportsScheduledOnlyWithoutChangingAppointmentsOrReferencedFields()throws Exception{
        var row=create("referenced","09:00:00","10:00:00",20);long schedule=Long.parseLong((String)row.get("schedule_id"));var db=fixture.fixture.db;
        db.update("INSERT INTO adc_business.Patient VALUES (51,'P-51','Fictional','1990-01-01','Fixture','000',NULL,'Fixture','000',UTC_TIMESTAMP(),UTC_TIMESTAMP(),'NOT_REVIEWED')");
        for(int i=0;i<2;i++)db.update("INSERT INTO adc_business.Appointment (appointment_id,patient_id,clinic_id,dentist_id,schedule_id,scheduled_at,status,attended_at,created_at,updated_at) VALUES (?,51,1,21,?,?,?, ?,UTC_TIMESTAMP(),UTC_TIMESTAMP())",61+i,schedule,StaffAccountsIT.utc(date.atTime(9,i*20).atZone(com.adc.domain.shared.BusinessTime.ZONE).toInstant()),i==0?"SCHEDULED":"IN_PROGRESS",i==0?null:StaffAccountsIT.utc(fixture.fixture.now));
        var result=schedules.suspend(command("suspendSchedule","suspend"),schedule,"保留待处理预约");assertEquals(List.of("61"),result.get("affected_appointment_ids"));assertEquals("09:00:00",((Map<?,?>)result.get("schedule")).get("start_time"));assertEquals(2,db.queryForObject("SELECT COUNT(*) FROM adc_business.Appointment WHERE status IN ('SCHEDULED','IN_PROGRESS')",Integer.class));
    }
    @Test void auditFailureRollsBackCreationAndSuspension()throws Exception{
        var row=create("existing","09:00:00","10:00:00",20);long schedule=Long.parseLong((String)row.get("schedule_id"));
        try(var connection=fixture.fixture.connection("inspector");var sql=connection.createStatement()){sql.execute("REVOKE INSERT ON adc_audit.* FROM 'adc_runtime_role'");try{assertThrows(org.springframework.dao.DataAccessException.class,()->create("rollback","12:00:00","13:00:00",20));assertThrows(org.springframework.dao.DataAccessException.class,()->schedules.suspend(command("suspendSchedule","rollback-suspend"),schedule,"fixture"));}finally{sql.execute("GRANT INSERT ON adc_audit.* TO 'adc_runtime_role'");}}
        assertEquals(1,fixture.fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business.DentistSchedule WHERE schedule_status='NORMAL'",Integer.class));
    }
}
