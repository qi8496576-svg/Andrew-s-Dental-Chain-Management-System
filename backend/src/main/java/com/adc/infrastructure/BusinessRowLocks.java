package com.adc.infrastructure;

import com.adc.domain.shared.DomainFailure;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.*;

/** Approved order: Dentist -> DentistSchedule -> Appointment -> module-owned details. */
@Component
public final class BusinessRowLocks {
    private final JdbcTemplate db;
    public BusinessRowLocks(JdbcTemplate db) {this.db=db;}
    public record Plan(Set<Long> dentists,Set<Long> schedules,Set<Long> appointments) {
        public Plan {dentists=Set.copyOf(dentists);schedules=Set.copyOf(schedules);appointments=Set.copyOf(appointments);}
        public void verifyUnchanged(Plan actual) {if(!equals(actual))throw new DomainFailure(503,"LOCK_RETRY");}
    }
    private record Key(int rank,long id) implements Comparable<Key> {
        public int compareTo(Key other) {int rankOrder=Integer.compare(rank,other.rank);return rankOrder==0?Long.compare(id,other.id):rankOrder;}
    }
    public void acquire(Plan plan) {
        if(!TransactionSynchronizationManager.isActualTransactionActive())throw new IllegalStateException("Business locks require a transaction");
        @SuppressWarnings("unchecked") var held=(NavigableSet<Key>)TransactionSynchronizationManager.getResource(this);
        if(held==null) {
            held=new TreeSet<>();TransactionSynchronizationManager.bindResource(this,held);
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){
                @Override public void afterCompletion(int status) {TransactionSynchronizationManager.unbindResource(BusinessRowLocks.this);}
            });
        }
        var requested=new TreeSet<Key>();
        for(long id:plan.dentists)requested.add(new Key(0,id));for(long id:plan.schedules)requested.add(new Key(1,id));for(long id:plan.appointments)requested.add(new Key(2,id));
        requested.removeAll(held);
        if(!requested.isEmpty() && !held.isEmpty() && requested.first().compareTo(held.last())<0)throw new IllegalStateException("Business lock order violation");
        String[] tables={"Dentist","DentistSchedule","Appointment"};String[] columns={"dentist_id","schedule_id","appointment_id"};
        for(var key:requested) {
            var rows=db.query("SELECT `"+columns[key.rank]+"` FROM adc_business.`"+tables[key.rank]+"` WHERE `"+columns[key.rank]+"`=? FOR UPDATE",(r,n)->r.getLong(1),key.id);
            if(rows.isEmpty())throw new DomainFailure(503,"LOCK_RETRY");held.add(key);
        }
    }
}
