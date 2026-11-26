package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.AnalyticsService;
import com.adc.application.performance.PerformancePublicationService;
import com.adc.domain.shared.DomainFailure;
import java.nio.file.*;
import java.time.*;
import java.math.BigDecimal;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.core.env.*;
import tools.jackson.databind.json.JsonMapper;

/** Controlled fictional quarter; initial source history is explicitly seeded, never a real operating claim. */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CourseQuarterAcceptanceIT {
    final AnalyticsIT fixture=new AnalyticsIT();
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @Test void fictionalCompleteQuarterHasIndependentPublicationFullCoverageAndTraceability()throws Exception{
        fixture.setup();Path evidenceFile=null;
        try{
            var base=fixture.base();var db=base.db;var quarter=fixture.fixture;long visit=quarter.fixture.appointment();long patient=fixture.patient();
            // Normalize only this owned fixture's source history into Q3; API calculation/publication below is real.
            db.update("UPDATE adc_business.Patient SET created_at='2026-09-14 00:00:00' WHERE patient_id=?",patient);
            db.update("UPDATE adc_business.DentistSchedule SET schedule_date='2026-09-15',start_time='09:00:00',end_time='10:00:00',created_at='2026-09-14 00:00:00' WHERE schedule_id=(SELECT schedule_id FROM adc_business.Appointment WHERE appointment_id=?)",visit);
            db.update("UPDATE adc_business.Appointment SET scheduled_at='2026-09-15 01:00:00',attended_at='2026-09-15 01:00:00',completed_at='2026-09-15 01:10:00',created_at='2026-09-14 00:00:00',updated_at='2026-09-30 15:59:59' WHERE appointment_id=?",visit);
            db.update("UPDATE adc_business.AppliedTreatment SET performed_at='2026-09-15 01:05:00' WHERE appointment_id=?",visit);
            db.update("UPDATE adc_business.AppointmentEvent SET occurred_at=CASE event_type WHEN 'BOOK' THEN '2026-09-14 00:00:00' WHEN 'ATTEND' THEN '2026-09-15 01:00:00' WHEN 'COMPLETE' THEN '2026-09-15 01:10:00' ELSE '2026-09-30 15:59:59' END WHERE appointment_id=?",visit);
            db.update("INSERT INTO adc_business.DentistClinicAssignment VALUES (9901,22,2,'2020-01-01',NULL,'COURSE SYNTHETIC ONLY',true)");
            db.update("INSERT INTO adc_business.DentistSchedule VALUES (9902,22,2,'2026-09-16','09:00:00','10:00:00',20,'NORMAL','COURSE SYNTHETIC ONLY','2026-09-14 00:00:00')");
            db.update("INSERT INTO adc_business.Appointment (appointment_id,patient_id,clinic_id,dentist_id,schedule_id,scheduled_at,status,created_at,updated_at,attended_at,completed_at) VALUES (9903,?,2,22,9902,'2026-09-16 01:00:00','COMPLETED','2026-09-14 00:00:00','2026-09-16 01:10:00','2026-09-16 01:00:00','2026-09-16 01:10:00')",patient);
            db.update("INSERT INTO adc_business.AppliedTreatment VALUES (9904,9903,72,22,1.00,0.00,0.00,'2026-09-16 01:05:00')");
            db.update("INSERT INTO adc_business.AppointmentEvent VALUES (9905,9903,'BOOK',NULL,'SCHEDULED','2026-09-14 00:00:00','RECEPTION','COURSE-SYNTHETIC-SOURCE',NULL,'course-book',NULL),(9906,9903,'ATTEND','SCHEDULED','IN_PROGRESS','2026-09-16 01:00:00','RECEPTION','COURSE-SYNTHETIC-SOURCE',NULL,'course-attend',NULL),(9907,9903,'COMPLETE','IN_PROGRESS','COMPLETED','2026-09-16 01:10:00','DENTIST','COURSE-SYNTHETIC-SOURCE',NULL,'course-complete',NULL)");
            db.update("INSERT INTO adc_audit.AuditEvent VALUES (?,'hq','STAFF','createPatient','Patient',?,JSON_ARRAY('1','2'),'2026-09-14 00:00:00',?,'SUCCESS','COURSE SYNTHETIC SOURCE FIXTURE; NOT REAL OPERATIONS',NULL,'COURSE-SYNTHETIC-INITIAL-DATA')",Crypto.id(),Long.toString(patient),UUID.randomUUID().toString());
            evidenceFile=Files.createTempFile(SchemaBaselineIT.ROOT.resolve("tmp/build-temp"),"course-quarter-",".json");
            Files.writeString(evidenceFile,"""
                {"version":"COURSE-FICTIONAL-QUARTER","reference":"Controlled course exercise; not real operations","rosters":[{"start":"2026-07-01T00:00:00+08:00","end":"2026-10-01T00:00:00+08:00","reference":"all two fictional operating clinics","verified_at":"2026-07-01T00:00:00Z","clinic_ids":["1","2"]}],"calendars":[{"start":"2026-07-01T00:00:00+08:00","end":"2026-12-01T00:00:00+08:00","reference":"fictional weekday calendar for controlled exercise","verified_at":"2026-07-01T00:00:00Z","day_start":"09:00","day_end":"17:00","holidays":[]}]}
                """);
            var env=new StandardEnvironment();env.getPropertySources().addFirst(new MapPropertySource("course",Map.of("adc.analytics.evidence-file",evidenceFile.toString())));var evidence=new AnalyticsEvidence(env);
            var reader=new AnalyticsSnapshotReader(base.context.getBean(AnalyticsStore.class),base.context.getBean(QuarterlyPerformanceStore.class),evidence);
            base.context.registerBean("courseQuarterAnalysis",AnalyticsService.class,()->new AnalyticsService(base.context.getBean(com.adc.identity.IdentityGate.class),reader,base.context.getBean(AuditWriter.class),base.context.getBean(Clock.class)));
            var analytics=base.context.getBean("courseQuarterAnalysis",AnalyticsService.class);
            var incomplete=quarter.dentist(quarter.calculate("course-missing-costs",List.of()),22);
            assertEquals("INCOMPLETE",incomplete.get("calculation_status"));assertThrows(DomainFailure.class,()->quarter.publications.publish(quarter.review("course-incomplete-denied"),Long.parseLong((String)incomplete.get("quarterly_performance_id")),new PerformancePublicationService.Publish((String)incomplete.get("input_hash"),"cannot publish missing sources")));
            quarter.ready();Instant began=Instant.now();var rows=quarter.calculate("course-complete",quarter.prepare());
            assertEquals("700.00",quarter.dentist(rows,22).get("net_profit"));assertEquals("70.00",quarter.dentist(rows,22).get("incentive_amount"));
            for(var row:rows)assertEquals("PUBLISHED",quarter.publications.publish(quarter.review("course-review-"+row.get("dentist_id")),Long.parseLong((String)row.get("quarterly_performance_id")),new PerformancePublicationService.Publish((String)row.get("input_hash"),"independent fictional complete-quarter review")).get("calculation_status"));
            var results=new LinkedHashMap<String,Object>();for(String metric:List.of("coverage","traceability","calculation-time")){var r=analytics.get(base.token,"WEB",metric,null,"2026-07-01T00:00:00+08:00","2026-10-01T00:00:00+08:00",base.now.toString(),"A1a-B13",null,null,UUID.randomUUID().toString());assertEquals(null,r.get("not_computable_reason"),r.toString());results.put(metric,r);if(!metric.equals("calculation-time"))assertEquals("1.000000",r.get("value"));else assertTrue(new BigDecimal((String)r.get("value")).compareTo(BigDecimal.ONE)<=0);}
            assertEquals(2,db.queryForObject("SELECT COUNT(*) FROM adc_business.QuarterlyPerformance WHERE calculation_status='PUBLISHED'",Integer.class));assertEquals(2,db.queryForObject("SELECT COUNT(*) FROM adc_audit.AuditEvent WHERE action='publishQuarterPerformance' AND subject_id='quarter-reviewer' AND result='SUCCESS'",Integer.class));
            double wall=Duration.between(began,Instant.now()).toMillis()/1000.0;assertTrue(wall<=28800);
            // A missing operating clinic's quarter usage must fail instead of being reported as 100%.
            db.update("UPDATE adc_business.AppliedTreatment SET performed_at='2026-10-01 00:00:00' WHERE applied_treatment_id=9904");var missing=analytics.get(base.token,"WEB","coverage",null,"2026-07-01T00:00:00+08:00","2026-10-01T00:00:00+08:00",base.now.toString(),"A1a-B13",null,null,UUID.randomUUID().toString());assertEquals("DATA_USAGE_EVIDENCE_INCOMPLETE",missing.get("not_computable_reason"));
            Path output=SchemaBaselineIT.ROOT.resolve("docs/verification/business");Files.createDirectories(output);var report=new LinkedHashMap<String,Object>();report.put("status","PASS");report.put("kind","controlled-fictional-complete-quarter-not-real-operations");report.put("period","2026-07-01/2026-10-01 Asia/Shanghai");report.put("source_history","explicit synthetic fixture; calculation, publication, analysis and persistence use actual services/MySQL");report.put("calculator","hq");report.put("reviewer","quarter-reviewer");report.put("results",results);report.put("r1_profit","700.00");report.put("r1_incentive","70.00");report.put("wall_seconds",wall);report.put("clock_mode","fixed fixture business clock; actual wall time measured separately");report.put("incomplete_publication_rejected",true);report.put("missing_clinic_usage_rejected",true);Files.writeString(output.resolve("course-quarter.json"),JsonMapper.builder().build().writeValueAsString(report)+"\n");
        }finally{if(evidenceFile!=null)Files.deleteIfExists(evidenceFile);fixture.close();}
    }
}
