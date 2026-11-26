package com.adc.infrastructure;

import com.adc.domain.shared.DomainFailure;
import java.math.BigDecimal;
import java.sql.*;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class CostEntryStore {
    private final JdbcTemplate db;public CostEntryStore(JdbcTemplate db){this.db=db;}
    public record Row(long id,Long dentist,long clinic,Long appointment,Long applied,String type,BigDecimal amount,Instant incurred,String description,String source,String batch,Instant confirmed,String confirmer,Long reversal){}
    private Row row(ResultSet r,int n)throws SQLException{return new Row(r.getLong("cost_entry_id"),(Long)r.getObject("dentist_id"),r.getLong("clinic_id"),(Long)r.getObject("appointment_id"),(Long)r.getObject("applied_treatment_id"),r.getString("cost_type"),r.getBigDecimal("amount"),r.getObject("incurred_at",LocalDateTime.class).toInstant(ZoneOffset.UTC),r.getString("description"),r.getString("source_reference"),r.getString("source_batch"),r.getObject("confirmed_at",LocalDateTime.class).toInstant(ZoneOffset.UTC),r.getString("confirmed_by"),(Long)r.getObject("reversal_of_id"));}
    public Row get(long id,boolean lock){var rows=db.query("SELECT * FROM adc_business.CostEntry WHERE cost_entry_id=?"+(lock?" FOR UPDATE":""),this::row,id);if(rows.isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");return rows.getFirst();}
    public void attribution(Long dentist,long clinic,Long appointment,Long applied){
        if(db.queryForObject("SELECT COUNT(*) FROM adc_business.Clinic WHERE clinic_id=?",Integer.class,clinic)!=1)throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");
        if(dentist!=null && db.queryForObject("SELECT COUNT(*) FROM adc_business.Dentist WHERE dentist_id=?",Integer.class,dentist)!=1)throw new DomainFailure(422,"INVALID_COST_ATTRIBUTION");
        if(appointment!=null && db.queryForObject("SELECT COUNT(*) FROM adc_business.Appointment WHERE appointment_id=? AND clinic_id=?",Integer.class,appointment,clinic)!=1)throw new DomainFailure(422,"INVALID_COST_ATTRIBUTION");
        if(applied!=null){var rows=db.queryForList("SELECT a.appointment_id,a.dentist_id,p.clinic_id FROM adc_business.AppliedTreatment a JOIN adc_business.Appointment p ON p.appointment_id=a.appointment_id WHERE a.applied_treatment_id=?",applied);if(rows.size()!=1 || !Objects.equals(rows.getFirst().get("clinic_id"),clinic) || dentist==null || !Objects.equals(rows.getFirst().get("dentist_id"),dentist) || (appointment!=null && !Objects.equals(rows.getFirst().get("appointment_id"),appointment)))throw new DomainFailure(422,"INVALID_COST_ATTRIBUTION");}
    }
    public boolean reversed(long id){return db.queryForObject("SELECT COUNT(*) FROM adc_business.CostEntry WHERE reversal_of_id=?",Integer.class,id)>0;}
    public long insert(Long dentist,long clinic,Long appointment,Long applied,String type,BigDecimal amount,Instant incurred,String description,String source,String batch,Instant confirmed,String confirmer,Long reversal){long id=Crypto.id();db.update("INSERT INTO adc_business.CostEntry VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",id,dentist,clinic,appointment,applied,type,amount,LocalDateTime.ofInstant(incurred,ZoneOffset.UTC),description,source,batch,LocalDateTime.ofInstant(confirmed,ZoneOffset.UTC),confirmer,reversal);return id;}
    public Map<String,Object> view(Row row){var v=new LinkedHashMap<String,Object>();v.put("cost_entry_id",Long.toString(row.id));v.put("clinic_id",Long.toString(row.clinic));v.put("dentist_id",row.dentist==null?null:row.dentist.toString());v.put("cost_type",row.type);v.put("amount",row.amount.setScale(2).toPlainString());v.put("incurred_at",row.incurred.toString());v.put("source_reference",row.source);v.put("source_batch",row.batch);v.put("confirmed_at",row.confirmed.toString());v.put("confirmed_by",row.confirmer);v.put("reversal_of_id",row.reversal==null?null:row.reversal.toString());return v;}
    public List<Row> list(List<Long> clinics,Instant start,Instant end,Long after,int limit){var args=new ArrayList<Object>(clinics);String sql="SELECT * FROM adc_business.CostEntry WHERE clinic_id IN ("+String.join(",",Collections.nCopies(clinics.size(),"?"))+")";if(start!=null){sql+=" AND incurred_at>=?";args.add(LocalDateTime.ofInstant(start,ZoneOffset.UTC));}if(end!=null){sql+=" AND incurred_at<?";args.add(LocalDateTime.ofInstant(end,ZoneOffset.UTC));}if(after!=null){sql+=" AND cost_entry_id>?";args.add(after);}sql+=" ORDER BY cost_entry_id LIMIT ?";args.add(limit);return db.query(sql,this::row,args.toArray());}
}
