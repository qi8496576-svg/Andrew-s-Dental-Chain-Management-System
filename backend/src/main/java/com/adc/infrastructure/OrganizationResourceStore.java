package com.adc.infrastructure;

import com.adc.domain.organizationresources.*;
import com.adc.domain.shared.*;
import java.sql.*;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class OrganizationResourceStore {
    private final JdbcTemplate db;private final Clock clock;
    public OrganizationResourceStore(JdbcTemplate db,Clock clock){this.db=db;this.clock=clock;}
    private LocalDateTime now(){return LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC);}
    private Object cell(ResultSet row,ResourceKind.Field field)throws SQLException {
        return switch(field.type()) {
            case BOOLEAN->row.getBoolean(field.name());
            case DATE->{var value=row.getObject(field.name(),LocalDate.class);yield value==null?null:value.toString();}
            case DECIMAL->{var value=row.getBigDecimal(field.name());yield value==null?null:value.setScale(2).toPlainString();}
            case TEXT->row.getString(field.name());
        };
    }
    public Map<String,Object> raw(ResourceKind kind,long id) {
        String columns="`"+kind.id+"`, "+kind.fields.keySet().stream().map(name->"`"+name+"`").collect(java.util.stream.Collectors.joining(","));
        var rows=db.query("SELECT "+columns+" FROM adc_business.`"+kind.table+"` WHERE `"+kind.id+"`=?",(r,n)->{
            var result=new LinkedHashMap<String,Object>();result.put(kind.id,r.getString(kind.id));for(var field:kind.fields.values())result.put(field.name(),cell(r,field));return result;
        },id);if(rows.isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");return rows.getFirst();
    }
    public void lock(ResourceKind kind,long id){if(db.query("SELECT `"+kind.id+"` FROM adc_business.`"+kind.table+"` WHERE `"+kind.id+"`=? FOR UPDATE",(r,n)->r.getLong(1),id).isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");}
    public long create(ResourceKind kind,Map<String,Object> fields) {
        long id=Crypto.id();var data=new LinkedHashMap<String,Object>();data.put(kind.id,id);for(String field:kind.fields.keySet())data.put(field,fields.get(field));if(kind.createdAt)data.put("created_at",now());
        String columns=data.keySet().stream().map(name->"`"+name+"`").collect(java.util.stream.Collectors.joining(","));
        db.update("INSERT INTO adc_business.`"+kind.table+"` ("+columns+") VALUES ("+String.join(",",Collections.nCopies(data.size(),"?"))+")",data.values().toArray());return id;
    }
    public void update(ResourceKind kind,long id,Map<String,Object> fields) {
        var values=new ArrayList<Object>(fields.values());values.add(id);String columns=fields.keySet().stream().map(name->"`"+name+"`=?").collect(java.util.stream.Collectors.joining(","));
        db.update("UPDATE adc_business.`"+kind.table+"` SET "+columns+" WHERE `"+kind.id+"`=?",values.toArray());
    }
    public List<Map<String,Object>> qualifications(long dentist) {
        return db.query("SELECT qualification_id,certificate_number,granted_date,expiry_date,verification_status FROM adc_business.DentistQualification WHERE dentist_id=? ORDER BY qualification_id",(r,n)->{
            var row=new LinkedHashMap<String,Object>();row.put("qualification_id",r.getString(1));row.put("certificate_number",r.getString(2));row.put("granted_date",r.getObject(3,LocalDate.class).toString());var expiry=r.getObject(4,LocalDate.class);row.put("expiry_date",expiry==null?null:expiry.toString());row.put("verification_status",r.getString(5));return row;
        },dentist);
    }
    public List<Map<String,Object>> assignments(long dentist) {
        return db.query("SELECT assignment_id,clinic_id,start_date,end_date,availability_note,is_active FROM adc_business.DentistClinicAssignment WHERE dentist_id=? ORDER BY assignment_id",(r,n)->{
            var row=new LinkedHashMap<String,Object>();row.put("assignment_id",r.getString(1));row.put("clinic_id",r.getString(2));row.put("start_date",r.getObject(3,LocalDate.class).toString());var end=r.getObject(4,LocalDate.class);row.put("end_date",end==null?null:end.toString());row.put("availability_note",r.getString(5));row.put("is_active",r.getBoolean(6));return row;
        },dentist);
    }
    public List<Map<String,Object>> requirements(long treatment){return db.query("SELECT qualification_id,is_mandatory FROM adc_business.TreatmentQualification WHERE treatment_id=? ORDER BY qualification_id",(r,n)->Map.<String,Object>of("qualification_id",r.getString(1),"is_mandatory",r.getBoolean(2)),treatment);}
    public Map<String,Object> state(ResourceKind kind,long id) {
        var state=raw(kind,id);if(kind==ResourceKind.DENTIST){state.put("qualifications",qualifications(id));state.put("clinic_assignments",assignments(id));}if(kind==ResourceKind.TREATMENT)state.put("qualification_requirements",requirements(id));return state;
    }
    public Map<String,Object> catalog(ResourceKind kind,List<Long> scope,boolean headquarters,long after,int limit) {
        return catalog(kind,scope,headquarters,after,limit,null);
    }
    public Map<String,Object> catalog(ResourceKind kind,List<Long> scope,boolean headquarters,long after,int limit,String search) {
        var args=new ArrayList<Object>();args.add(after);
        String code=switch(kind){case CLINIC->"clinic_code";case DENTIST->"employee_number";case TREATMENT->"treatment_code";default->null;};
        String extra="";
        if(kind==ResourceKind.TREATMENT)extra=",COALESCE((SELECT GROUP_CONCAT(q.qualification_name ORDER BY q.qualification_id SEPARATOR '、') FROM adc_business.TreatmentQualification x JOIN adc_business.Qualification q ON q.qualification_id=x.qualification_id WHERE x.treatment_id=r.treatment_id AND x.is_mandatory=true),'无必需资质') required_qualifications";
        if(kind==ResourceKind.DENTIST){String authorized=scope==null?"":" AND x.clinic_id IN ("+scope.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(","))+")";extra=",COALESCE((SELECT GROUP_CONCAT(DISTINCT c.clinic_code ORDER BY c.clinic_code SEPARATOR '、') FROM adc_business.DentistClinicAssignment x JOIN adc_business.Clinic c ON c.clinic_id=x.clinic_id WHERE x.dentist_id=r.dentist_id AND x.is_active=true"+authorized+"),'未关联授权诊所') clinic_labels,CONCAT((SELECT COUNT(*) FROM adc_business.DentistQualification q WHERE q.dentist_id=r.dentist_id AND q.verification_status='VERIFIED' AND q.granted_date<=DATE(CONVERT_TZ(UTC_TIMESTAMP(),'+00:00','+08:00')) AND (q.expiry_date IS NULL OR q.expiry_date>=DATE(CONVERT_TZ(UTC_TIMESTAMP(),'+00:00','+08:00')))),' 项已核验且有效') qualification_status";}
        var sql=new StringBuilder("SELECT r.`"+kind.id+"`,r.`"+kind.label+"`,r.is_active"+(code==null?"":",r.`"+code+"`")+extra+(kind==ResourceKind.TREATMENT?",r.default_unit_price":kind==ResourceKind.CLINIC?",r.postal_address":"")+" FROM adc_business.`"+kind.table+"` r WHERE r.`"+kind.id+"`>?");
        if(search!=null&&!search.isBlank()){sql.append(" AND (LOCATE(?,r.`"+kind.label+"`)>0"+(code==null?"": " OR LOCATE(?,r.`"+code+"`)>0")+")");args.add(search.trim());if(code!=null)args.add(search.trim());}
        if(!headquarters)sql.append(" AND r.is_active=true");
        if(scope!=null && kind==ResourceKind.CLINIC){sql.append(" AND r.clinic_id IN ("+String.join(",",Collections.nCopies(scope.size(),"?"))+")");args.addAll(scope);}
        if(scope!=null && kind==ResourceKind.DENTIST){
            String placeholders=String.join(",",Collections.nCopies(scope.size(),"?"));
            sql.append(" AND (EXISTS (SELECT 1 FROM adc_business.DentistClinicAssignment x WHERE x.dentist_id=r.dentist_id AND x.clinic_id IN ("+placeholders+")");args.addAll(scope);
            if(!headquarters){sql.append(" AND x.is_active=true AND x.start_date<=? AND (x.end_date IS NULL OR x.end_date>=?)");var day=clock.instant().atZone(BusinessTime.ZONE).toLocalDate();args.add(day);args.add(day);}
            sql.append(")");
            if(headquarters){sql.append(" OR (NOT EXISTS (SELECT 1 FROM adc_business.DentistClinicAssignment x WHERE x.dentist_id=r.dentist_id) AND EXISTS (SELECT 1 FROM adc_audit.AuditEvent a JOIN JSON_TABLE(a.clinic_scope,'$[*]' COLUMNS(clinic VARCHAR(30) PATH '$')) c ON true WHERE a.object_kind='Dentist' AND BINARY a.object_id=CAST(r.dentist_id AS BINARY) AND a.action='createDentist' AND a.result='SUCCESS' AND c.clinic IN ("+placeholders+")))");scope.forEach(id->args.add(id.toString()));}
            sql.append(")");
        }
        sql.append(" ORDER BY r.`"+kind.id+"` LIMIT ?");args.add(limit+1);
        var rows=db.query(sql.toString(),(r,n)->{var row=new LinkedHashMap<String,Object>();row.put("id",r.getString(1));row.put("label",r.getString(2));row.put("active",r.getBoolean(3));if(code!=null)row.put("code",r.getString(4));if(kind==ResourceKind.TREATMENT){row.put("current_price",r.getString("default_unit_price"));row.put("required_qualifications",r.getString("required_qualifications"));}if(kind==ResourceKind.DENTIST){row.put("clinic_labels",r.getString("clinic_labels"));row.put("qualification_status",r.getString("qualification_status"));}if(kind==ResourceKind.CLINIC)row.put("address",r.getString("postal_address"));return row;},args.toArray());
        String next=null;if(rows.size()>limit){rows=new ArrayList<>(rows.subList(0,limit));next=Base64.getUrlEncoder().withoutPadding().encodeToString(((String)rows.getLast().get("id")).getBytes(java.nio.charset.StandardCharsets.UTF_8));}
        var result=new LinkedHashMap<String,Object>();result.put("items",rows);result.put("next_cursor",next);return result;
    }
    public boolean createdContext(String actor,ResourceKind kind,long id,List<Long> scope) {
        for(long clinic:scope)if(db.queryForObject("SELECT COUNT(*) FROM adc_audit.AuditEvent WHERE action=? AND object_kind=? AND object_id=? AND result='SUCCESS' AND JSON_CONTAINS(clinic_scope,JSON_QUOTE(?))"+(actor==null?"":" AND subject_id=?"),Integer.class,actor==null?new Object[]{"create"+kind.table,kind.table,Long.toString(id),Long.toString(clinic)}:new Object[]{"create"+kind.table,kind.table,Long.toString(id),Long.toString(clinic),actor})>0)return true;
        return false;
    }
    public long boundPatient(String subject){var ids=db.query("SELECT patient_id FROM adc_identity.CurrentPatientBinding WHERE subject_id=?",(r,n)->r.getLong(1),subject);if(ids.isEmpty())throw new DomainFailure(403,"PATIENT_BINDING_REQUIRED");return ids.getFirst();}
    public long assignmentClinic(long id){var ids=db.query("SELECT clinic_id FROM adc_business.DentistClinicAssignment WHERE assignment_id=?",(r,n)->r.getLong(1),id);if(ids.isEmpty())throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");return ids.getFirst();}
    public void accessible(ResourceKind kind,long id,List<Long> scope) {
        if(kind==ResourceKind.CLINIC && !scope.contains(id))throw new DomainFailure(403,"ACCESS_DENIED");
        if(kind==ResourceKind.DENTIST) {
            var assigned=assignments(id);boolean visible=assigned.stream().anyMatch(row->scope.contains(Long.parseLong((String)row.get("clinic_id"))));
            if(!visible && !(assigned.isEmpty() && createdContext(null,kind,id,scope)))throw new DomainFailure(403,"ACCESS_DENIED");
        }
        raw(kind,id);
    }
    public BusinessRowLocks.Plan plan(ResourceKind kind,long id) {
        var dentists=new TreeSet<Long>();
        switch(kind){
            case DENTIST->dentists.add(id);
            case CLINIC->dentists.addAll(db.query("SELECT dentist_id FROM adc_business.DentistClinicAssignment WHERE clinic_id=? UNION SELECT dentist_id FROM adc_business.DentistSchedule WHERE clinic_id=?",(r,n)->r.getLong(1),id,id));
            case QUALIFICATION->dentists.addAll(db.query("SELECT dentist_id FROM adc_business.DentistQualification WHERE qualification_id=?",(r,n)->r.getLong(1),id));
            case TREATMENT->dentists.addAll(db.query("SELECT DISTINCT a.dentist_id FROM adc_business.Appointment a JOIN adc_business.AppointmentRequestedTreatment t ON t.appointment_id=a.appointment_id WHERE t.treatment_id=? UNION SELECT dentist_id FROM adc_business.AppliedTreatment WHERE treatment_id=?",(r,n)->r.getLong(1),id,id));
            default->{ }
        }
        var schedules=new TreeSet<Long>();var appointments=new TreeSet<Long>();
        for(long dentist:dentists){schedules.addAll(db.query("SELECT schedule_id FROM adc_business.DentistSchedule WHERE dentist_id=?",(r,n)->r.getLong(1),dentist));appointments.addAll(db.query("SELECT appointment_id FROM adc_business.Appointment WHERE dentist_id=?",(r,n)->r.getLong(1),dentist));}
        return new BusinessRowLocks.Plan(dentists,schedules,appointments);
    }
    public void qualification(long dentist,Map<String,Object> input) {
        long qualification=ResourceRules.id(input.get("qualification_id"));raw(ResourceKind.QUALIFICATION,qualification);
        db.update("INSERT INTO adc_business.DentistQualification (dentist_id,qualification_id,certificate_number,granted_date,expiry_date,verification_status) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE certificate_number=VALUES(certificate_number),granted_date=VALUES(granted_date),expiry_date=VALUES(expiry_date),verification_status=VALUES(verification_status)",dentist,qualification,input.get("certificate_number"),input.get("granted_date"),input.get("expiry_date"),input.get("verification_status"));
    }
    public long assignment(long dentist,Map<String,Object> input) {
        long clinic=ResourceRules.id(input.get("clinic_id"));raw(ResourceKind.CLINIC,clinic);Object id=input.get("assignment_id");
        if(id==null){long created=Crypto.id();db.update("INSERT INTO adc_business.DentistClinicAssignment (assignment_id,dentist_id,clinic_id,start_date,end_date,availability_note,is_active) VALUES (?,?,?,?,?,?,?)",created,dentist,clinic,input.get("start_date"),input.get("end_date"),input.get("availability_note"),input.get("is_active"));return created;}
        long assignment=ResourceRules.id(id);
        if(db.update("UPDATE adc_business.DentistClinicAssignment SET clinic_id=?,start_date=?,end_date=?,availability_note=?,is_active=? WHERE assignment_id=? AND dentist_id=?",clinic,input.get("start_date"),input.get("end_date"),input.get("availability_note"),input.get("is_active"),assignment,dentist)!=1)throw new DomainFailure(404,"OBJECT_NOT_ACCESSIBLE");return assignment;
    }
    public void requirements(long treatment,List<Map<String,Object>> input) {
        var ids=new TreeSet<Long>();for(var item:input){long id=ResourceRules.id(item.get("qualification_id"));if(!ids.add(id))throw new DomainFailure(422,"DUPLICATE_REQUIREMENT");lock(ResourceKind.QUALIFICATION,id);}
        // Replacing this current requirement set does not delete directory or historical clinical rows.
        db.update("DELETE FROM adc_business.TreatmentQualification WHERE treatment_id=?",treatment);
        for(var item:input)db.update("INSERT INTO adc_business.TreatmentQualification VALUES (?,?,?)",treatment,ResourceRules.id(item.get("qualification_id")),ResourceRules.bool(item.get("is_mandatory")));
    }
    private boolean covered(long dentist,long clinic,LocalDate date) {
        return db.queryForObject("SELECT COUNT(*) FROM adc_business.Dentist d JOIN adc_business.Clinic c ON c.clinic_id=? WHERE d.dentist_id=? AND d.is_active=true AND c.is_active=true AND d.hire_date<=? AND (d.termination_date IS NULL OR d.termination_date>=?) AND EXISTS (SELECT 1 FROM adc_business.DentistClinicAssignment x WHERE x.dentist_id=d.dentist_id AND x.clinic_id=c.clinic_id AND x.is_active=true AND x.start_date<=? AND (x.end_date IS NULL OR x.end_date>=?))",Integer.class,clinic,dentist,date,date,date,date)>0;
    }
    private boolean qualified(long appointment,long dentist,LocalDate date) {
        return db.queryForObject("SELECT COUNT(*) FROM adc_business.AppointmentRequestedTreatment requested JOIN adc_business.Treatment t ON t.treatment_id=requested.treatment_id WHERE requested.appointment_id=? AND (t.is_active=false OR EXISTS (SELECT 1 FROM adc_business.TreatmentQualification need JOIN adc_business.Qualification q ON q.qualification_id=need.qualification_id WHERE need.treatment_id=t.treatment_id AND need.is_mandatory=true AND (q.is_active=false OR NOT EXISTS (SELECT 1 FROM adc_business.DentistQualification held WHERE held.dentist_id=? AND held.qualification_id=q.qualification_id AND BINARY held.verification_status=BINARY 'VERIFIED' AND held.granted_date<=? AND (held.expiry_date IS NULL OR held.expiry_date>=?)))))",Integer.class,appointment,dentist,date,date)==0;
    }
    public List<Map<String,Object>> impacts(BusinessRowLocks.Plan plan,List<Long> scope,String reason) {
        var result=new ArrayList<Map<String,Object>>();
        for(long id:plan.schedules()) {
            var rows=db.query("SELECT dentist_id,clinic_id,schedule_date,start_time,schedule_status FROM adc_business.DentistSchedule WHERE schedule_id=?",(r,n)->new Object[]{r.getLong(1),r.getLong(2),r.getObject(3,LocalDate.class),r.getObject(4,LocalTime.class),r.getString(5)},id);
            if(rows.isEmpty())continue;var row=rows.getFirst();long dentist=(Long)row[0],clinic=(Long)row[1];var date=(LocalDate)row[2];
            if(scope.contains(clinic) && row[4].equals("NORMAL") && !LocalDateTime.of(date,(LocalTime)row[3]).atZone(BusinessTime.ZONE).toInstant().isBefore(clock.instant()) && !covered(dentist,clinic,date))result.add(Map.of("object_kind","DentistSchedule","object_id",Long.toString(id),"clinic_id",Long.toString(clinic),"affected_date",date.toString(),"reason",reason));
        }
        for(long id:plan.appointments()) {
            var rows=db.query("SELECT dentist_id,clinic_id,scheduled_at,status FROM adc_business.Appointment WHERE appointment_id=?",(r,n)->new Object[]{r.getLong(1),r.getLong(2),r.getObject(3,LocalDateTime.class).toInstant(ZoneOffset.UTC),r.getString(4)},id);
            if(rows.isEmpty())continue;var row=rows.getFirst();long dentist=(Long)row[0],clinic=(Long)row[1];var instant=(Instant)row[2];var date=instant.atZone(BusinessTime.ZONE).toLocalDate();
            if(scope.contains(clinic) && row[3].equals("SCHEDULED") && !instant.isBefore(clock.instant()) && (!covered(dentist,clinic,date) || !qualified(id,dentist,date)))result.add(Map.of("object_kind","Appointment","object_id",Long.toString(id),"clinic_id",Long.toString(clinic),"affected_date",date.toString(),"reason",reason));
        }
        result.sort(Comparator.comparing(item->item.get("object_kind")+":"+item.get("object_id")));return result;
    }
}
