package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import java.sql.*;
import org.junit.jupiter.api.Test;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.session.*;
import org.apache.ibatis.transaction.jdbc.JdbcTransactionFactory;
import org.apache.ibatis.mapping.Environment;
import org.apache.ibatis.datasource.unpooled.UnpooledDataSource;
import com.adc.infrastructure.persistence.PatientMapper;

class ConstraintBehaviorIT extends MigratedDatabaseTest {
    private static final String PATIENT = "INSERT INTO adc_business.Patient VALUES (1,'FICT-001','Fictional Patient','2000-01-01','Fixture address','000',NULL,'Fixture contact','000',UTC_TIMESTAMP(),UTC_TIMESTAMP(),'NOT_REVIEWED')";
    static void rejected(Statement s, String sql, int code) {
        var e = assertThrows(SQLException.class, () -> s.executeUpdate(sql), sql);
        assertEquals(code, e.getErrorCode(), e.getMessage());
    }
    @Test void patientMappingUniquenessAndCheckExecuteOnRealMysql() throws Exception {
        try(var c=connection("runtime")) {
            c.setAutoCommit(false);
            try(var s=c.createStatement()) {
                s.executeUpdate(PATIENT);
                rejected(s, PATIENT.replace("(1,", "(2,"), 1062);
                rejected(s,"UPDATE adc_business.Patient SET allergy_review_status='UNKNOWN' WHERE patient_id=1",3819);
                // Phone deliberately remains nonunique, as required by the original model.
                s.executeUpdate(PATIENT.replace("(1,", "(2,").replace("FICT-001", "FICT-002"));
            }
            var config=new Configuration(new Environment("fixture",new JdbcTransactionFactory(),new UnpooledDataSource()));
            try(var input=getClass().getResourceAsStream("/mappers/PatientMapper.xml")) {
                new XMLMapperBuilder(input,config,"PatientMapper.xml",config.getSqlFragments()).parse();
            }
            try(var session=new SqlSessionFactoryBuilder().build(config).openSession(c)) {
                var row=session.getMapper(PatientMapper.class).findById(1L);
                assertEquals("FICT-001",row.patient_number());
                assertEquals(java.time.LocalDate.of(2000,1,1),row.date_of_birth());
                assertNull(row.email()); assertNotNull(row.created_at());
                // Inserts above use JDBC directly, so MyBatis's dirty flag is false.
                session.rollback(true);
            }
        }
    }
    @Test void foreignKeysRejectOrphansAndHistoryCannotBeDeleted() throws Exception {
        try(var c=connection("runtime"); var s=c.createStatement()) {
            c.setAutoCommit(false);
            s.executeUpdate(PATIENT);
            rejected(s,"INSERT INTO adc_business.PatientAllergy (patient_id,allergy_id,noted_at,is_retracted,audit_history,updated_at) VALUES (1,999,UTC_TIMESTAMP(),false,JSON_ARRAY(),UTC_TIMESTAMP())",1452);
            rejected(s,"INSERT INTO adc_identity.CurrentPatientBinding VALUES ('missing',1,'missing',UTC_TIMESTAMP(),'fixture')",1452);
            c.rollback();
        }
    }
    @Test void stateFactsScheduleAndQuarterAmountsAreEnforced() throws Exception {
        try(var c=connection("runtime"); var s=c.createStatement()) {
            c.setAutoCommit(false);
            try {
                s.executeUpdate(PATIENT);
                s.executeUpdate("INSERT INTO adc_business.Clinic VALUES (1,'FICT-C','Fixture',NULL,'000',NULL,NULL,true,UTC_TIMESTAMP())");
                s.executeUpdate("INSERT INTO adc_business.Dentist (dentist_id,employee_number,full_name,date_of_birth,home_address,phone,email,hire_date,is_active,created_at,termination_date) VALUES (1,'FICT-D','Fixture','1980-01-01',NULL,'000',NULL,'2020-01-01',true,UTC_TIMESTAMP(),NULL)");
                s.executeUpdate("INSERT INTO adc_business.DentistSchedule VALUES (1,1,1,'2026-11-11','09:00:00','10:00:00',30,'NORMAL',NULL,UTC_TIMESTAMP())");
                for(String update : new String[]{"end_time=start_time","slot_minutes=0","slot_minutes=40","schedule_status='INVALID'"})
                    rejected(s,"UPDATE adc_business.DentistSchedule SET "+update+" WHERE schedule_id=1",3819);
                // Historical suspended rows can share the same start: no global conditional key.
                s.executeUpdate("INSERT INTO adc_business.DentistSchedule VALUES (2,1,1,'2026-11-11','09:00:00','10:00:00',30,'SUSPENDED',NULL,UTC_TIMESTAMP())");
                s.executeUpdate("INSERT INTO adc_business.DentistSchedule VALUES (3,1,1,'2026-11-11','09:00:00','10:00:00',30,'SUSPENDED',NULL,UTC_TIMESTAMP())");
                s.executeUpdate("INSERT INTO adc_business.Appointment (appointment_id,patient_id,clinic_id,dentist_id,schedule_id,scheduled_at,status,created_at,updated_at) VALUES (1,1,1,1,1,UTC_TIMESTAMP(),'SCHEDULED',UTC_TIMESTAMP(),UTC_TIMESTAMP())");
                for(String update : new String[]{"status='NO_SHOW'","attended_at=UTC_TIMESTAMP()","status='CANCELLED'","cancellation_kind='NO_SHOW'","status='COMPLETED'"})
                    rejected(s,"UPDATE adc_business.Appointment SET "+update+" WHERE appointment_id=1",3819);
                s.executeUpdate("UPDATE adc_business.Appointment SET status='CANCELLED',cancelled_at=UTC_TIMESTAMP(),cancellation_kind='NO_SHOW',cancellation_reason='Fixture absence' WHERE appointment_id=1");
                s.executeUpdate("INSERT INTO adc_business.Appointment (appointment_id,patient_id,clinic_id,dentist_id,schedule_id,scheduled_at,status,attended_at,created_at,updated_at) VALUES (2,1,1,1,1,UTC_TIMESTAMP(),'IN_PROGRESS',UTC_TIMESTAMP(),UTC_TIMESTAMP(),UTC_TIMESTAMP())");
                s.executeUpdate("INSERT INTO adc_business.Treatment VALUES (1,'FICT-T','Fixture treatment',NULL,0.01,true)");
                s.executeUpdate("INSERT INTO adc_business.AppliedTreatment VALUES (1,2,1,1,1.50,0.01,0.02,UTC_TIMESTAMP())");
                for(String update:new String[]{"standard_units=0","unit_price=-1","subtotal=0.01"})
                    rejected(s,"UPDATE adc_business.AppliedTreatment SET "+update+" WHERE applied_treatment_id=1",3819);
                s.executeUpdate("UPDATE adc_business.Appointment SET status='COMPLETED',completed_at=UTC_TIMESTAMP() WHERE appointment_id=2");
                s.executeUpdate("INSERT INTO adc_business.Invoice VALUES (1,'FICT-I',2,UTC_TIMESTAMP(),0.02,'ISSUED',UTC_TIMESTAMP())");
                s.executeUpdate("INSERT INTO adc_business.InvoiceItem VALUES (1,1,1,1,'Fixture treatment',1.50,0.01,0.02)");
                for(String update:new String[]{"standard_units=0","unit_price=-1","subtotal=0.01","line_number=0"})
                    rejected(s,"UPDATE adc_business.InvoiceItem SET "+update+" WHERE invoice_item_id=1",3819);
                rejected(s,"INSERT INTO adc_business.InvoiceItem VALUES (2,1,1,2,'Fixture treatment',1.50,0.01,0.02)",1062);
                s.executeUpdate("UPDATE adc_business.Appointment SET status='INVOICED' WHERE appointment_id=2");
                s.executeUpdate("INSERT INTO adc_identity.Subject VALUES ('fixture-a','PATIENT',true,UTC_TIMESTAMP(),NULL),('fixture-b','PATIENT',true,UTC_TIMESTAMP(),NULL),('fixture-staff','STAFF',true,UTC_TIMESTAMP(),NULL)");
                s.executeUpdate("INSERT INTO adc_identity.CurrentPatientBinding VALUES ('fixture-a',1,'fixture-staff',UTC_TIMESTAMP(),'fixture-approved-reference')");
                rejected(s,"INSERT INTO adc_identity.CurrentPatientBinding VALUES ('fixture-b',1,'fixture-staff',UTC_TIMESTAMP(),'fixture-approved-reference')",1062);
                rejected(s,"INSERT INTO adc_identity.CurrentPatientBinding VALUES ('fixture-a',2,'fixture-staff',UTC_TIMESTAMP(),'fixture-approved-reference')",1062);
                s.executeUpdate("INSERT INTO adc_business.QuarterlyPerformance VALUES (1,1,'2026-10-01','2027-01-01',100,110,0,-10,0.1000,0,'CALCULATED',UTC_TIMESTAMP(),1,JSON_OBJECT(),REPEAT('a',64),NULL)");
                for(String update : new String[]{"incentive_amount=-1","incentive_rate=0.2000","net_profit=1","calculation_version=0","calculation_status='PUBLISHED'","revenue=NULL"})
                    rejected(s,"UPDATE adc_business.QuarterlyPerformance SET "+update+" WHERE quarterly_performance_id=1",3819);
                // Nonpositive profit is valid and publishable at zero incentive.
                s.executeUpdate("UPDATE adc_business.QuarterlyPerformance SET calculation_status='PUBLISHED',published_at=UTC_TIMESTAMP() WHERE quarterly_performance_id=1");
                rejected(s,"DELETE FROM adc_business.Patient WHERE patient_id=1",1451);
            } finally { c.rollback(); }
        }
    }
}
