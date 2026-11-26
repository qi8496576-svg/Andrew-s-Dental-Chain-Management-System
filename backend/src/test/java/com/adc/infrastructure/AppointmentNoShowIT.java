package com.adc.infrastructure;
import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.domain.shared.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AppointmentNoShowIT {
    final AppointmentTransitionsIT fixture=new AppointmentTransitionsIT();AppointmentNoShowService service;
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @BeforeEach void setup()throws Exception{fixture.setup();fixture.base().context.register(AppointmentNoShowService.class);service=fixture.base().context.getBean(AppointmentNoShowService.class);fixture.base().db.update("INSERT INTO adc_identity.GrantCapability VALUES ('other','markNoShow')");}
    @AfterEach void close(){fixture.close();}
    void endsIn(long seconds){Instant at=fixture.base().now.minusSeconds(1200).plusSeconds(seconds);var local=at.atZone(BusinessTime.ZONE);fixture.base().db.update("UPDATE adc_business.DentistSchedule SET schedule_date=?,start_time=?,end_time=? WHERE schedule_id=?",local.toLocalDate(),local.toLocalTime(),local.toLocalTime().plusHours(1),fixture.fixture.schedule);fixture.base().db.update("UPDATE adc_business.Appointment SET scheduled_at=? WHERE appointment_id=?",StaffAccountsIT.utc(at),fixture.id);}
    AtomicCommandExecutor.Command command(String key){return fixture.command("markNoShow",key);}
    @Test void endBoundaryManualVerificationAndIdempotencyPreserveFiveStates()throws Exception{
        endsIn(1);assertThrows(DomainFailure.class,()->service.mark(command("early"),fixture.id,"核实未到诊",fixture.fixture.proof));endsIn(0);assertThrows(DomainFailure.class,()->service.mark(command("invented"),fixture.id,"核实未到诊","untrusted"));
        var first=service.mark(command("valid"),fixture.id,"已核实未到诊，保留原约记录",fixture.fixture.proof);assertEquals("CANCELLED",first.get("status"));assertEquals("NO_SHOW",first.get("cancellation_kind"));assertEquals(first,service.mark(command("valid"),fixture.id,"已核实未到诊，保留原约记录",fixture.fixture.proof));assertEquals(1,fixture.base().db.queryForObject("SELECT COUNT(*) FROM adc_business.AppointmentEvent WHERE event_type='CANCEL' AND to_status='CANCELLED' AND JSON_UNQUOTE(JSON_EXTRACT(details,'$.cancellation_kind'))='NO_SHOW'",Integer.class));
    }
    @Test void unattendedCannotBeInferredFromTimerPatientOrSuspendedSchedule()throws Exception{
        endsIn(0);assertEquals("SCHEDULED",fixture.base().db.queryForObject("SELECT status FROM adc_business.Appointment WHERE appointment_id=?",String.class,fixture.id));String token=fixture.nativeBinding();assertThrows(DomainFailure.class,()->service.mark(new AtomicCommandExecutor.Command(token,"WECHAT","markNoShow","native",Crypto.sha256("native"),UUID.randomUUID().toString()),fixture.id,"自报未到诊",fixture.fixture.proof));fixture.base().db.update("UPDATE adc_business.DentistSchedule SET schedule_status='SUSPENDED'");assertThrows(DomainFailure.class,()->service.mark(command("suspended"),fixture.id,"已核实",fixture.fixture.proof));
    }
    @Test void attendanceIsNeverOverwrittenAndRevokedScopeCannotReplay()throws Exception{
        endsIn(0);fixture.attendance.attend(fixture.command("attendAppointment","attend"),fixture.id,fixture.fixture.proof);assertThrows(DomainFailure.class,()->service.mark(command("after-attend"),fixture.id,"已核实",fixture.fixture.proof));assertEquals("IN_PROGRESS",fixture.base().db.queryForObject("SELECT status FROM adc_business.Appointment WHERE appointment_id=?",String.class,fixture.id));
    }
    @Test void auditFailureRollsBackAndScopeRevocationRejectsReplay()throws Exception{
        endsIn(0);try(var connection=fixture.base().connection("inspector");var sql=connection.createStatement()){sql.execute("REVOKE INSERT ON adc_audit.* FROM 'adc_runtime_role'");try{assertThrows(org.springframework.dao.DataAccessException.class,()->service.mark(command("rollback"),fixture.id,"已核实未到诊",fixture.fixture.proof));}finally{sql.execute("GRANT INSERT ON adc_audit.* TO 'adc_runtime_role'");}}assertEquals("SCHEDULED",fixture.base().db.queryForObject("SELECT status FROM adc_business.Appointment WHERE appointment_id=?",String.class,fixture.id));service.mark(command("valid"),fixture.id,"已核实未到诊",fixture.fixture.proof);fixture.base().db.update("DELETE FROM adc_identity.GrantClinicScope WHERE grant_id='other'");assertThrows(DomainFailure.class,()->service.mark(command("valid"),fixture.id,"已核实未到诊",fixture.fixture.proof));
    }
    @Test void competingAttendanceAndNoShowHaveOnlyOneWinner()throws Exception{
        endsIn(0);var base=fixture.base();base.db.update("UPDATE adc_identity.AccessGrant SET role_code='RECEPTION' WHERE grant_id='hq'");for(String capability:List.of("getPatient","markNoShow"))base.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('hq',?)",capability);var proof=fixture.fixture.patients.lookup(new AtomicCommandExecutor.Command(base.token,"WEB","lookupPatient","hq-proof",Crypto.sha256("hq-proof"),UUID.randomUUID().toString()),(String)fixture.fixture.patient.get("patient_number"),LocalDate.parse("1990-01-02"),new PatientService.Verification(1,true,"manual service verification"));
        try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)){var start=new java.util.concurrent.CountDownLatch(1);var a=pool.submit(()->{start.await();try{fixture.attendance.attend(fixture.command("attendAppointment","race-attend"),fixture.id,fixture.fixture.proof);return 200;}catch(DomainFailure failure){return failure.status();}});var b=pool.submit(()->{start.await();try{service.mark(new AtomicCommandExecutor.Command(base.token,"WEB","markNoShow","race-no-show",Crypto.sha256("race-no-show"),UUID.randomUUID().toString()),fixture.id,"核实未到诊",(String)proof.get("verification_reference"));return 200;}catch(DomainFailure failure){return failure.status();}});start.countDown();var statuses=new ArrayList<>(List.of(a.get(20,java.util.concurrent.TimeUnit.SECONDS),b.get(20,java.util.concurrent.TimeUnit.SECONDS)));Collections.sort(statuses);assertEquals(List.of(200,409),statuses);}
        assertEquals(1,base.db.queryForObject("SELECT COUNT(*) FROM adc_business.AppointmentEvent WHERE event_type IN ('ATTEND','CANCEL')",Integer.class));
    }
}
