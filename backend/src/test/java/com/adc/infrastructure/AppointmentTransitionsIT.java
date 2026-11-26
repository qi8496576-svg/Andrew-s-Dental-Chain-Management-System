package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.domain.shared.DomainFailure;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AppointmentTransitionsIT {
    final AppointmentBookingIT fixture=new AppointmentBookingIT();AppointmentAttendanceService attendance;AppointmentCancellationService cancellation;long id;
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @BeforeEach void setup()throws Exception{
        try(var connection=base().connection("inspector");var sql=connection.createStatement()){for(String table:List.of("CurrentPatientBinding","BindingEvent","BindingRequest"))sql.execute("DELETE FROM adc_identity.`"+table+"`");}
        fixture.setup();var base=fixture.fixture.fixture.fixture;base.context.register(AppointmentTransitionStore.class,AppointmentAttendanceService.class,AppointmentCancellationService.class);attendance=base.context.getBean(AppointmentAttendanceService.class);cancellation=base.context.getBean(AppointmentCancellationService.class);
        for(String capability:List.of("attendAppointment","cancelAppointment"))base.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('other',?)",capability);
        id=Long.parseLong((String)fixture.booking.create(fixture.command("createAppointment","book"),fixture.input("2026-11-12T09:00:00+08:00")).get("appointment_id"));
    }
    @AfterEach void close(){fixture.close();}
    AtomicCommandExecutor.Command command(String operation,String key){return fixture.command(operation,key);}
    StaffAccountsIT base(){return fixture.fixture.fixture.fixture;}
    @Test void attendanceRequiresActualProofNormalScheduledAndProducesOneAtomicEvent()throws Exception{
        assertThrows(DomainFailure.class,()->attendance.attend(command("attendAppointment","invented"),id,"untrusted"));
        var first=attendance.attend(command("attendAppointment","attend"),id,fixture.proof);assertEquals("IN_PROGRESS",first.get("status"));assertNotNull(first.get("attended_at"));assertEquals(first,attendance.attend(command("attendAppointment","attend"),id,fixture.proof));
        assertThrows(DomainFailure.class,()->attendance.attend(command("attendAppointment","different-key"),id,fixture.proof));assertThrows(DomainFailure.class,()->cancellation.cancel(command("cancelAppointment","after-attendance"),id,"patient request",fixture.proof));assertEquals(1,base().db.queryForObject("SELECT COUNT(*) FROM adc_business.AppointmentEvent WHERE event_type='ATTEND' AND from_status='SCHEDULED' AND to_status='IN_PROGRESS'",Integer.class));
    }
    @Test void suspendedAndRevokedOrWrongClinicCannotAttendOrReplay()throws Exception{
        base().db.update("UPDATE adc_business.DentistSchedule SET schedule_status='SUSPENDED'");assertThrows(DomainFailure.class,()->attendance.attend(command("attendAppointment","suspended"),id,fixture.proof));base().db.update("UPDATE adc_business.DentistSchedule SET schedule_status='NORMAL'");
        attendance.attend(command("attendAppointment","valid"),id,fixture.proof);base().db.update("DELETE FROM adc_identity.GrantClinicScope WHERE grant_id='other'");assertThrows(DomainFailure.class,()->attendance.attend(command("attendAppointment","valid"),id,fixture.proof));
    }
    @Test void patientCancellationUsesServerTimeAndStaffCanActUntilExclusiveSlotEnd()throws Exception{
        String token=nativeBinding();var now=base().now;
        var nativeCommand=new AtomicCommandExecutor.Command(token,"WECHAT","cancelAppointment","native-start",Crypto.sha256("native-start"),UUID.randomUUID().toString());
        base().db.update("UPDATE adc_business.Appointment SET scheduled_at=? WHERE appointment_id=?",StaffAccountsIT.utc(now),id);
        assertThrows(DomainFailure.class,()->cancellation.cancel(nativeCommand,id,"本人取消",null));
        var result=cancellation.cancel(command("cancelAppointment","staff-start"),id,"本人到场核实代办",fixture.proof);assertEquals("CANCELLED",result.get("status"));assertEquals("PATIENT_CANCEL",result.get("cancellation_kind"));assertNotNull(base().db.queryForObject("SELECT cancelled_at FROM adc_business.Appointment WHERE appointment_id=?",LocalDateTime.class,id));assertEquals(result,cancellation.cancel(command("cancelAppointment","staff-start"),id,"本人到场核实代办",fixture.proof));
        assertThrows(DomainFailure.class,()->attendance.attend(command("attendAppointment","cancelled"),id,fixture.proof));
    }
    @Test void nativeCanCancelOwnBeforeStartButCannotAttendAndOldBindingCannotReplay()throws Exception{
        String token=nativeBinding();assertThrows(DomainFailure.class,()->attendance.attend(new AtomicCommandExecutor.Command(token,"WECHAT","attendAppointment","native",Crypto.sha256("native"),UUID.randomUUID().toString()),id,fixture.proof));
        var command=new AtomicCommandExecutor.Command(token,"WECHAT","cancelAppointment","own",Crypto.sha256("own"),UUID.randomUUID().toString());assertEquals("CANCELLED",cancellation.cancel(command,id,"本人取消",null).get("status"));
        base().db.update("DELETE FROM adc_identity.CurrentPatientBinding");assertThrows(DomainFailure.class,()->cancellation.cancel(command,id,"本人取消",null));
    }
    @Test void exactEndAndSuspensionRejectPatientCancelWithoutReclassifyingHistory()throws Exception{
        base().db.update("UPDATE adc_business.Appointment SET scheduled_at=? WHERE appointment_id=?",StaffAccountsIT.utc(base().now.minusSeconds(1200)),id);
        assertThrows(DomainFailure.class,()->cancellation.cancel(command("cancelAppointment","end"),id,"fixture",fixture.proof));
        base().db.update("UPDATE adc_business.Appointment SET scheduled_at=?",StaffAccountsIT.utc(base().now.plusSeconds(60)));base().db.update("UPDATE adc_business.DentistSchedule SET schedule_status='SUSPENDED'");assertThrows(DomainFailure.class,()->cancellation.cancel(command("cancelAppointment","suspended"),id,"fixture",fixture.proof));assertEquals("SCHEDULED",base().db.queryForObject("SELECT status FROM adc_business.Appointment WHERE appointment_id=?",String.class,id));
    }
    @Test void receptionCanCancelOneSecondBeforeEndWhilePatientCannot()throws Exception{
        String token=nativeBinding();base().db.update("UPDATE adc_business.Appointment SET scheduled_at=? WHERE appointment_id=?",StaffAccountsIT.utc(base().now.minusSeconds(1199)),id);
        assertThrows(DomainFailure.class,()->cancellation.cancel(new AtomicCommandExecutor.Command(token,"WECHAT","cancelAppointment","native-before-end",Crypto.sha256("native-before-end"),UUID.randomUUID().toString()),id,"本人取消",null));
        assertEquals("CANCELLED",cancellation.cancel(command("cancelAppointment","staff-before-end"),id,"结束前核实代办",fixture.proof).get("status"));
    }
    @Test void auditFailureRollsBackFactsEventAndReceipt()throws Exception{
        try(var connection=base().connection("inspector");var sql=connection.createStatement()){sql.execute("REVOKE INSERT ON adc_audit.* FROM 'adc_runtime_role'");try{assertThrows(org.springframework.dao.DataAccessException.class,()->attendance.attend(command("attendAppointment","rollback-attend"),id,fixture.proof));assertThrows(org.springframework.dao.DataAccessException.class,()->cancellation.cancel(command("cancelAppointment","rollback-cancel"),id,"fixture",fixture.proof));}finally{sql.execute("GRANT INSERT ON adc_audit.* TO 'adc_runtime_role'");}}
        assertEquals("SCHEDULED",base().db.queryForObject("SELECT status FROM adc_business.Appointment WHERE appointment_id=?",String.class,id));assertEquals(1,base().db.queryForObject("SELECT COUNT(*) FROM adc_business.AppointmentEvent",Integer.class));
    }
    @Test void attendanceAndCancellationCompeteWithoutOverwritingEachOther()throws Exception{
        base().db.update("UPDATE adc_identity.AccessGrant SET role_code='RECEPTION' WHERE grant_id='hq'");for(String capability:List.of("getPatient","cancelAppointment"))base().db.update("INSERT INTO adc_identity.GrantCapability VALUES ('hq',?)",capability);
        var verified=fixture.patients.lookup(new AtomicCommandExecutor.Command(base().token,"WEB","lookupPatient","hq-verify",Crypto.sha256("hq-verify"),UUID.randomUUID().toString()),(String)fixture.patient.get("patient_number"),LocalDate.parse("1990-01-02"),new PatientService.Verification(1,true,"Actual second reviewer"));
        try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)){var start=new java.util.concurrent.CountDownLatch(1);var first=pool.submit(()->{start.await();try{attendance.attend(command("attendAppointment","race-attend"),id,fixture.proof);return 200;}catch(DomainFailure failure){return failure.status();}});var second=pool.submit(()->{start.await();try{cancellation.cancel(new AtomicCommandExecutor.Command(base().token,"WEB","cancelAppointment","race-cancel",Crypto.sha256("race-cancel"),UUID.randomUUID().toString()),id,"本人取消",(String)verified.get("verification_reference"));return 200;}catch(DomainFailure failure){return failure.status();}});start.countDown();var statuses=new ArrayList<>(List.of(first.get(20,java.util.concurrent.TimeUnit.SECONDS),second.get(20,java.util.concurrent.TimeUnit.SECONDS)));Collections.sort(statuses);assertEquals(List.of(200,409),statuses);}
        assertEquals(1,base().db.queryForObject("SELECT COUNT(*) FROM adc_business.AppointmentEvent WHERE event_type IN ('ATTEND','CANCEL')",Integer.class));
    }
    @Test void suspensionAndAttendanceSerializeWithoutAutomaticallyCancellingExistingVisit()throws Exception{
        base().db.update("UPDATE adc_identity.AccessGrant SET role_code='RECEPTION' WHERE grant_id='hq'");base().db.update("INSERT INTO adc_identity.GrantCapability VALUES ('hq','suspendSchedule')");
        try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)){var start=new java.util.concurrent.CountDownLatch(1);var first=pool.submit(()->{start.await();try{attendance.attend(command("attendAppointment","race-suspend-attend"),id,fixture.proof);return 200;}catch(DomainFailure failure){return failure.status();}});var second=pool.submit(()->{start.await();fixture.fixture.schedules.suspend(new AtomicCommandExecutor.Command(base().token,"WEB","suspendSchedule","race-suspend",Crypto.sha256("race-suspend"),UUID.randomUUID().toString()),fixture.schedule,"临时停诊");return 200;});start.countDown();int result=first.get(20,java.util.concurrent.TimeUnit.SECONDS);assertEquals(200,second.get(20,java.util.concurrent.TimeUnit.SECONDS));assertTrue(Set.of(200,409).contains(result));assertEquals(result==200?"IN_PROGRESS":"SCHEDULED",base().db.queryForObject("SELECT status FROM adc_business.Appointment WHERE appointment_id=?",String.class,id));}
    }
    String nativeBinding(){String token=Crypto.token();var db=base().db;db.update("INSERT INTO adc_identity.Subject VALUES ('transition-native','PATIENT',true,?,NULL)",StaffAccountsIT.utc(base().now));db.update("INSERT INTO adc_identity.Session VALUES ('transition-session','transition-native',?,'WECHAT',NULL,?,?,?,NULL,NULL)",Crypto.sha256(token),StaffAccountsIT.utc(base().now),StaffAccountsIT.utc(base().now),StaffAccountsIT.utc(base().now.plusSeconds(28800)));db.update("INSERT INTO adc_identity.CurrentPatientBinding VALUES ('transition-native',?,'other',?,'isolated manual binding fixture')",Long.parseLong((String)fixture.patient.get("patient_id")),StaffAccountsIT.utc(base().now));return token;}
}
