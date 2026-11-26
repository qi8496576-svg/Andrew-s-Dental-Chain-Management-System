package com.adc.infrastructure;

import java.time.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Explicit technical persistence; callers own authorization and the transaction boundary. */
@Repository
public class RequestReceiptStore {
    private final JdbcTemplate db;
    public RequestReceiptStore(JdbcTemplate db) {this.db=db;}
    public record Receipt(byte[] hash,String refs,String summary,int status,String requestId) { }
    public String candidateSubject(String token) {
        var rows=db.query("SELECT subject_id FROM adc_identity.Session WHERE token_hash=?",(r,n)->r.getString(1),Crypto.sha256(token));
        return rows.isEmpty()?null:rows.getFirst();
    }
    public Receipt find(String subject,String operation,String key) {
        var rows=db.query("SELECT content_hash,result_refs,response_summary,response_status,request_id FROM adc_identity.RequestReceipt WHERE subject_id=? AND operation_id=? AND request_key=?",(r,n)->new Receipt(r.getBytes(1),r.getString(2),r.getString(3),r.getInt(4),r.getString(5)),subject,operation,key);
        return rows.isEmpty()?null:rows.getFirst();
    }
    public boolean inProgress(String subject,String operation,String key) {
        return db.queryForObject("SELECT IS_USED_LOCK(?)",Long.class,TransactionLocks.name("request",subject+"/"+operation+"/"+key))!=null;
    }
    public void save(String subject,String operation,String key,byte[] hash,String requestId,String refs,String summary,int status,Instant instant) {
        var now=LocalDateTime.ofInstant(instant,ZoneOffset.UTC);
        db.update("INSERT INTO adc_identity.RequestReceipt VALUES (?,?,?,?,?,?,?,?,?,?)",subject,operation,key,hash,requestId,refs,summary,status,now,now);
    }
}
