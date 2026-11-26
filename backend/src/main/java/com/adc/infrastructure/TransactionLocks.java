package com.adc.infrastructure;

import com.zaxxer.hikari.HikariDataSource;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.*;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** MySQL session locks on the Spring transaction's own connection, released after completion. */
public final class TransactionLocks {
    private final javax.sql.DataSource pool;
    public TransactionLocks(javax.sql.DataSource pool) { this.pool=Objects.requireNonNull(pool); }
    public static String name(String namespace,String identity) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest((namespace+"\0"+identity).getBytes(StandardCharsets.UTF_8)));
        } catch(java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    public void acquire(Collection<String> names) {
        if(!TransactionSynchronizationManager.isActualTransactionActive()
                || !TransactionSynchronizationManager.isSynchronizationActive())
            throw new IllegalStateException("Named locks require an active Spring transaction");
        var state=(State)TransactionSynchronizationManager.getResource(this);
        if(state==null) {
            state=new State(DataSourceUtils.getConnection(pool));
            TransactionSynchronizationManager.bindResource(this,state);
            var captured=state;
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCompletion(int status) {
                    try { captured.release(); }
                    finally { TransactionSynchronizationManager.unbindResource(TransactionLocks.this); }
                }
            });
        }
        for(String name:new TreeSet<>(names)) {
            if(name==null || !name.matches("[0-9a-f]{64}")) throw new IllegalArgumentException("Invalid lock name");
            if(state.held.contains(name)) continue;
            if(!state.held.isEmpty() && state.held.last().compareTo(name)>0)
                throw new IllegalStateException("Locks must be acquired in fixed sorted order");
            try {
                if(!state.scalar("SELECT GET_LOCK(?,5)",name)) throw new LockUnavailableException();
                state.held.add(name);
            } catch(SQLException e) { throw new LockUnavailableException(e); }
        }
    }
    public static final class LockUnavailableException extends RuntimeException {
        LockUnavailableException() { super("Transaction lock unavailable"); }
        LockUnavailableException(Throwable cause) { super("Transaction lock unavailable",cause); }
    }
    private final class State {
        final Connection connection;
        final NavigableSet<String> held=new TreeSet<>();
        State(Connection connection) { this.connection=connection; }
        boolean scalar(String sql,String name) throws SQLException {
            try(var s=connection.prepareStatement(sql)) {
                s.setString(1,name);
                try(var r=s.executeQuery()) { return r.next() && r.getInt(1)==1 && !r.wasNull(); }
            }
        }
        void release() {
            try {
                for(String name:held.descendingSet()) {
                    if(!scalar("SELECT RELEASE_LOCK(?)",name)) { evict(); return; }
                }
            } catch(SQLException e) { evict(); }
        }
        void evict() {
            if(pool instanceof HikariDataSource hikari)hikari.evictConnection(connection);
            else { try { connection.abort(Runnable::run); } catch(SQLException ignored) { /* unusable connection must never return to a pool */ } }
        }
    }
}
