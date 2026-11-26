package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import java.sql.*;
import org.junit.jupiter.api.Test;

/** Permission probes use no matching rows, so successful read/write probes do not alter data. */
class DatabasePrivilegesIT extends MigratedDatabaseTest {
    static void denied(Connection c,String sql) throws Exception {
        var error=assertThrows(SQLException.class,()-> { try(var s=c.createStatement()){s.execute(sql);} });
        assertTrue(error.getErrorCode()==1142 || error.getErrorCode()==1044 || error.getErrorCode()==1227,
                "Must fail for privilege denial, not missing tables or invalid SQL: "+error.getMessage());
    }
    @Test void runtimeCannotMutateAuditOrMigrationsOrSchema() throws Exception {
        try(var c=connection("runtime")) {
            try(var s=c.createStatement()) {
                s.executeQuery("SELECT audit_id FROM adc_audit.AuditEvent WHERE 1=0").close();
                s.executeQuery("SELECT installed_rank FROM adc_identity.flyway_schema_history WHERE 1=0").close();
            }
            denied(c,"UPDATE adc_audit.AuditEvent SET reason=reason WHERE 1=0");
            denied(c,"DELETE FROM adc_audit.AuditEvent WHERE 1=0");
            denied(c,"UPDATE adc_identity.flyway_schema_history SET success=success WHERE 1=0");
            denied(c,"DELETE FROM adc_identity.flyway_schema_history WHERE 1=0");
            denied(c,"CREATE TABLE adc_business.__forbidden_probe(id INT)");
            c.setAutoCommit(false);
            try(var s=c.createStatement()) {
                assertEquals(1,s.executeUpdate("INSERT INTO adc_audit.AuditEvent VALUES (1,NULL,'SYSTEM','fixture.verify','fixture',NULL,JSON_ARRAY(),UTC_TIMESTAMP(),'fixture-request','SUCCESS',NULL,NULL,NULL)"));
                assertEquals(1,s.executeUpdate("INSERT INTO adc_identity.Subject VALUES ('fixture-subject','STAFF',true,UTC_TIMESTAMP(),NULL)"));
                denied(c,"DELETE FROM adc_identity.Subject WHERE subject_id='fixture-subject'");
                denied(c,"INSERT INTO adc_identity.flyway_schema_history (installed_rank,description,type,script,installed_by,installed_on,execution_time,success) VALUES (999,'forbidden','SQL','forbidden','fixture',UTC_TIMESTAMP(),0,true)");
            } finally { c.rollback(); }
        }
    }
}
