package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import java.sql.Connection;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.transaction.support.TransactionTemplate;

class TransactionLocksIT extends MigratedDatabaseTest {
    @Test void locksStayOnTransactionConnectionUntilCommitAndRollback() throws Exception {
        try(var pool=runtimeDataSource(); var observer=connection("runtime")) {
            var locks=new TransactionLocks(pool);
            var tx=new TransactionTemplate(new DataSourceTransactionManager(pool));
            String name=TransactionLocks.name("request","fixture-subject/operation/key");
            assertThrows(IllegalStateException.class,()->locks.acquire(List.of(name)));
            for(boolean rollback:new boolean[]{false,true}) {
                tx.executeWithoutResult(status->{
                    locks.acquire(List.of(name));
                    var transactionConnection=DataSourceUtils.getConnection(pool);
                    assertEquals(scalar(transactionConnection,"SELECT CONNECTION_ID()"),scalar(observer,"SELECT IS_USED_LOCK('"+name+"')"));
                    assertEquals("0",scalar(observer,"SELECT GET_LOCK('"+name+"',0)"));
                    locks.acquire(List.of(name)); // Repeated helpers must not recursively acquire a MySQL lock.
                    if(rollback) status.setRollbackOnly();
                });
                assertEquals("1",scalar(observer,"SELECT GET_LOCK('"+name+"',0)"));
                assertEquals("1",scalar(observer,"SELECT RELEASE_LOCK('"+name+"')"));
            }
            assertEquals(0,pool.getHikariPoolMXBean().getActiveConnections());
        }
    }
    @Test void failureAfterBusinessAuditAndReceiptWritesRollsBackAllSchemas() throws Exception {
        try(var pool=runtimeDataSource(); var observer=connection("runtime")) {
            var tx=new TransactionTemplate(new DataSourceTransactionManager(pool));
            assertThrows(IllegalStateException.class,()->tx.executeWithoutResult(status->{
                var c=DataSourceUtils.getConnection(pool);
                try(var s=c.createStatement()) {
                    s.executeUpdate("INSERT INTO adc_identity.Subject VALUES ('rollback-fixture','STAFF',true,UTC_TIMESTAMP(),NULL)");
                    s.executeUpdate("INSERT INTO adc_business.Patient VALUES (88,'ROLLBACK-FIXTURE','Fixture','2000-01-01','Fixture','000',NULL,'Fixture','000',UTC_TIMESTAMP(),UTC_TIMESTAMP(),'NOT_REVIEWED')");
                    s.executeUpdate("INSERT INTO adc_audit.AuditEvent VALUES (88,'rollback-fixture','STAFF','fixture.verify','fixture',NULL,JSON_ARRAY(),UTC_TIMESTAMP(),'rollback-request','SUCCESS',NULL,NULL,NULL)");
                    s.executeUpdate("INSERT INTO adc_identity.RequestReceipt VALUES ('rollback-fixture','fixture.verify','fixture-key',UNHEX(REPEAT('00',32)),'rollback-request',JSON_OBJECT(),JSON_OBJECT(),200,UTC_TIMESTAMP(),UTC_TIMESTAMP())");
                } catch(java.sql.SQLException e) { throw new AssertionError(e); }
                throw new IllegalStateException("Injected failure after success writes, before commit");
            }));
            for(String query:new String[]{
                "SELECT COUNT(*) FROM adc_identity.Subject WHERE subject_id='rollback-fixture'",
                "SELECT COUNT(*) FROM adc_business.Patient WHERE patient_id=88",
                "SELECT COUNT(*) FROM adc_audit.AuditEvent WHERE audit_id=88",
                "SELECT COUNT(*) FROM adc_identity.RequestReceipt WHERE subject_id='rollback-fixture'"})
                assertEquals("0",scalar(observer,query));
        }
    }
    private static String scalar(Connection c,String sql) {
        try(var s=c.createStatement();var r=s.executeQuery(sql)) { assertTrue(r.next());return r.getString(1); }
        catch(Exception e) { throw new AssertionError(e); }
    }
    @Test void failedReleaseEvictsConnectionInsteadOfReturningItToPool() throws Exception {
        try(var pool=runtimeDataSource()) {
            var locks=new TransactionLocks(pool);var tx=new TransactionTemplate(new DataSourceTransactionManager(pool));
            var previous=new java.util.concurrent.atomic.AtomicReference<String>();
            String name=TransactionLocks.name("fixture","release-failure");
            tx.executeWithoutResult(status->{
                locks.acquire(List.of(name));var connection=DataSourceUtils.getConnection(pool);
                previous.set(scalar(connection,"SELECT CONNECTION_ID()"));
                assertEquals("1",scalar(connection,"SELECT RELEASE_LOCK('"+name+"')"));
            });
            try(var next=pool.getConnection()) {assertNotEquals(previous.get(),scalar(next,"SELECT CONNECTION_ID()"));}
            assertEquals(0,pool.getHikariPoolMXBean().getActiveConnections());
        }
    }
    @Test void businessRowsFollowStableOrderAndChangedLockSetsRequireRetry() throws Exception {
        try(var pool=runtimeDataSource()) {
            var db=new org.springframework.jdbc.core.JdbcTemplate(pool);
            db.update("INSERT INTO adc_business.Dentist (dentist_id,employee_number,full_name,date_of_birth,home_address,phone,email,hire_date,is_active,created_at,termination_date) VALUES (1,'LOCK-D1','Fixture','1980-01-01',NULL,'000',NULL,'2020-01-01',true,UTC_TIMESTAMP(),NULL),(2,'LOCK-D2','Fixture','1980-01-01',NULL,'000',NULL,'2020-01-01',true,UTC_TIMESTAMP(),NULL)");
            var rows=new BusinessRowLocks(db);var tx=new TransactionTemplate(new DataSourceTransactionManager(pool));
            tx.executeWithoutResult(status->rows.acquire(new BusinessRowLocks.Plan(java.util.Set.of(2L,1L),java.util.Set.of(),java.util.Set.of())));
            assertThrows(IllegalStateException.class,()->tx.executeWithoutResult(status->{
                rows.acquire(new BusinessRowLocks.Plan(java.util.Set.of(2L),java.util.Set.of(),java.util.Set.of()));
                rows.acquire(new BusinessRowLocks.Plan(java.util.Set.of(1L),java.util.Set.of(),java.util.Set.of()));
            }));
            var plan=new BusinessRowLocks.Plan(java.util.Set.of(1L),java.util.Set.of(),java.util.Set.of());
            assertEquals("LOCK_RETRY",assertThrows(com.adc.domain.shared.DomainFailure.class,()->plan.verifyUnchanged(new BusinessRowLocks.Plan(java.util.Set.of(2L),java.util.Set.of(),java.util.Set.of()))).code());
        }
    }
}
