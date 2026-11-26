package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.domain.shared.DomainFailure;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AppointmentBookingIT {
    final SchedulesIT fixture=new SchedulesIT();AppointmentBookingService booking;PatientService patients;Map<String,Object> patient,details;String proof,risk;long schedule;
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @BeforeEach void setup()throws Exception{
        fixture.setup();var base=fixture.fixture.fixture;base.context.register(PatientStore.class,PatientService.class,AppointmentBookingStore.class,AppointmentBookingService.class);booking=base.context.getBean(AppointmentBookingService.class);patients=base.context.getBean(PatientService.class);
        for(String cap:List.of("createPatient","getPatient","reviewPatientAllergies","createAppointment","searchAppointmentCandidates","getAppointment","listAppointments"))base.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('other',?)",cap);
        details=new LinkedHashMap<>(Map.of("full_name","Booking fixture","date_of_birth","1990-01-02","phone","000","billing_address","Fixture","emergency_contact_name","Fixture","emergency_contact_phone","000"));
        patient=patients.create(command("createPatient","patient"),details,new PatientService.Verification(1,true,"In-person fixture"),false,null);var verified=patients.lookup(command("lookupPatient","verify"),(String)patient.get("patient_number"),LocalDate.parse("1990-01-02"),new PatientService.Verification(1,true,"In-person fixture"));proof=(String)verified.get("verification_reference");patient=patients.review(command("reviewPatientAllergies","review"),Long.parseLong((String)patient.get("patient_id")),"NO_KNOWN",proof,"Asked patient");risk=(String)patient.get("allergy_confirmation_reference");
        schedule=Long.parseLong((String)fixture.create("schedule","09:00:00","10:00:00",20).get("schedule_id"));base.db.update("INSERT INTO adc_business.Treatment VALUES (71,'T-71','Fixture consultation',NULL,100.00,true)");
    }
    @AfterEach void close(){fixture.close();}
    AtomicCommandExecutor.Command command(String operation,String key){return fixture.command(operation,key);}
    AppointmentBookingService.Creation input(String at){return new AppointmentBookingService.Creation(1,schedule,OffsetDateTime.parse(at).toInstant(),List.of(71L),risk,Long.parseLong((String)patient.get("patient_id")),proof,details,new AppointmentBookingService.Declaration("NO_KNOWN",List.of(),true));}
    @Test void realBookingIsAtomicIdempotentAndCreatesOnlyExpectedTreatmentsAndBookEvent()throws Exception{
        var request=input("2026-11-12T09:00:00+08:00");var first=booking.create(command("createAppointment","book"),request);assertEquals("SCHEDULED",first.get("status"));assertEquals(first,booking.create(command("createAppointment","book"),request));var db=fixture.fixture.fixture.db;assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_business.Appointment",Integer.class));assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_business.AppointmentRequestedTreatment",Integer.class));assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_business.AppointmentEvent WHERE event_type='BOOK'",Integer.class));assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_business.AppliedTreatment",Integer.class));assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM adc_business.Invoice",Integer.class));
    }
    @Test void misalignedEndBoundaryMissingDetailsChangedAllergyAndSuspensionCannotCreatePartialBooking()throws Exception{
        assertThrows(DomainFailure.class,()->booking.create(command("createAppointment","unaligned"),input("2026-11-12T09:01:00+08:00")));assertThrows(DomainFailure.class,()->booking.create(command("createAppointment","end"),input("2026-11-12T10:00:00+08:00")));
        details.put("phone","forged-change");assertThrows(DomainFailure.class,()->booking.create(command("createAppointment","conflicting-profile"),input("2026-11-12T09:00:00+08:00")));details.put("phone","000");risk="AR1:invented";assertThrows(DomainFailure.class,()->booking.create(command("createAppointment","invented-risk"),input("2026-11-12T09:00:00+08:00")));
        fixture.schedules.suspend(command("suspendSchedule","stop"),schedule,"fixture");assertThrows(DomainFailure.class,()->booking.create(command("createAppointment","stopped"),input("2026-11-12T09:00:00+08:00")));assertEquals(0,fixture.fixture.fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business.Appointment",Integer.class));
    }
    @Test void everyMandatoryQualificationMustBeVerifiedAndValidButOptionalQualificationDoesNotBlock()throws Exception{
        var db=fixture.fixture.fixture.db;db.update("INSERT INTO adc_business.Qualification VALUES (81,'Mandatory',NULL,true)");db.update("INSERT INTO adc_business.Qualification VALUES (82,'Optional',NULL,true)");db.update("INSERT INTO adc_business.TreatmentQualification VALUES (71,81,true),(71,82,false)");
        var base=fixture.fixture.fixture;var start=Instant.parse("2026-11-12T01:00:00Z");var end=start.plusSeconds(3600);
        assertEquals(List.of(),booking.candidates(base.other,"WEB",1,List.of(71L),start,end,null,20,UUID.randomUUID().toString()).get("items"));assertThrows(DomainFailure.class,()->booking.create(command("createAppointment","unqualified"),input("2026-11-12T09:00:00+08:00")));
        db.update("INSERT INTO adc_business.DentistQualification VALUES (21,81,'fixture','2020-01-01',NULL,'VERIFIED')");assertEquals(3,((List<?>)booking.candidates(base.other,"WEB",1,List.of(71L),start,end,null,20,UUID.randomUUID().toString()).get("items")).size());db.update("UPDATE adc_business.DentistQualification SET expiry_date='2026-11-11'");assertThrows(DomainFailure.class,()->booking.create(command("createAppointment","expired"),input("2026-11-12T09:00:00+08:00")));
    }
    @Test void separateActorsRacingForOneSlotHaveExactlyOneAtomicWinner()throws Exception{
        var base=fixture.fixture.fixture;var db=base.db;db.update("UPDATE adc_identity.AccessGrant SET role_code='RECEPTION' WHERE grant_id='hq'");for(String cap:List.of("getPatient","createAppointment"))db.update("INSERT INTO adc_identity.GrantCapability VALUES ('hq',?)",cap);
        var lookup=patients.lookup(new AtomicCommandExecutor.Command(base.token,"WEB","lookupPatient","hq-verify",Crypto.sha256("hq"),UUID.randomUUID().toString()),(String)patient.get("patient_number"),LocalDate.parse("1990-01-02"),new PatientService.Verification(1,true,"In-person fixture"));var first=input("2026-11-12T09:00:00+08:00");var second=new AppointmentBookingService.Creation(first.clinic(),first.schedule(),first.at(),first.treatments(),first.allergyReference(),first.patient(),(String)lookup.get("verification_reference"),first.details(),first.declaration());
        try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)){var start=new java.util.concurrent.CountDownLatch(1);var a=pool.submit(()->{start.await();try{booking.create(command("createAppointment","race-a"),first);return 200;}catch(DomainFailure failure){return failure.status();}});var b=pool.submit(()->{start.await();try{booking.create(new AtomicCommandExecutor.Command(base.token,"WEB","createAppointment","race-b",Crypto.sha256("race-b"),UUID.randomUUID().toString()),second);return 200;}catch(DomainFailure failure){return failure.status();}});start.countDown();var results=new ArrayList<>(List.of(a.get(20,java.util.concurrent.TimeUnit.SECONDS),b.get(20,java.util.concurrent.TimeUnit.SECONDS)));Collections.sort(results);assertEquals(List.of(200,409),results);}
        assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM adc_business.AppointmentEvent",Integer.class));
    }
    @Test void auditFailureRollsBackAppointmentExpectedTreatmentAndBookEvent()throws Exception{
        try(var connection=fixture.fixture.fixture.connection("inspector");var sql=connection.createStatement()){sql.execute("REVOKE INSERT ON adc_audit.* FROM 'adc_runtime_role'");try{assertThrows(org.springframework.dao.DataAccessException.class,()->booking.create(command("createAppointment","rollback"),input("2026-11-12T09:00:00+08:00")));}finally{sql.execute("GRANT INSERT ON adc_audit.* TO 'adc_runtime_role'");}}
        for(String table:List.of("Appointment","AppointmentRequestedTreatment","AppointmentEvent"))assertEquals(0,fixture.fixture.fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business."+table,Integer.class));
    }
    @Test void candidateWindowProjectionMatchesLiveOccupancyAtEveryHalfOpenBoundary()throws Exception{
        var base=fixture.fixture.fixture;var store=base.context.getBean(AppointmentBookingStore.class);
        booking.create(command("createAppointment","window-first"),input("2026-11-12T09:00:00+08:00"));
        var begin=Instant.parse("2026-11-12T01:00:00Z");var end=begin.plusSeconds(3600);
        var windows=store.candidateWindows(21,begin,end);
        for(int minute=-20;minute<=60;minute++){
            var at=begin.plusSeconds(minute*60L);assertEquals(store.occupied(21,at,20),windows.stream().anyMatch(w->w.overlaps(at,20)),"minute="+minute);
        }
        var page=booking.candidates(base.other,"WEB",1,List.of(71L),begin,end,null,1,UUID.randomUUID().toString());
        var first=(Map<?,?>)((List<?>)page.get("items")).getFirst();assertEquals("2026-11-12T01:20:00Z",first.get("starts_at"));
        var next=booking.candidates(base.other,"WEB",1,List.of(71L),begin,end,(String)page.get("next_cursor"),1,UUID.randomUUID().toString());
        assertEquals("2026-11-12T01:40:00Z",((Map<?,?>)((List<?>)next.get("items")).getFirst()).get("starts_at"));
    }
}

