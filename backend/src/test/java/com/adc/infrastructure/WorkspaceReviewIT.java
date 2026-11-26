package com.adc.infrastructure;
import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.domain.shared.DomainFailure;
import com.adc.domain.organizationresources.ResourceKind;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class WorkspaceReviewIT {
 final InvoicingIT fixture=new InvoicingIT();WorkspaceReadService workspace;
 @BeforeAll void migrate()throws Exception{fixture.migrate();}
 @AfterAll void dispose(){fixture.dispose();}
 @BeforeEach void setup()throws Exception{fixture.setup();fixture.base().context.register(WorkspaceReadService.class);workspace=fixture.base().context.getBean(WorkspaceReadService.class);fixture.base().db.update("INSERT INTO adc_identity.GrantCapability VALUES ('cashier-grant','listAppointments')");}
 @AfterEach void close(){fixture.close();}
 String request(){return UUID.randomUUID().toString();}
 @SuppressWarnings("unchecked") @Test void aggregateCountsBeyondFirstPageAndCursorIncludesEveryAppointment(){
  var db=fixture.base().db;long original=fixture.appointment();
  for(int i=0;i<105;i++)db.update("INSERT INTO adc_business.Appointment (appointment_id,patient_id,clinic_id,dentist_id,schedule_id,scheduled_at,status,created_at,updated_at) SELECT ?,patient_id,clinic_id,dentist_id,schedule_id,DATE_ADD(scheduled_at,INTERVAL ? MINUTE),'SCHEDULED',created_at,updated_at FROM adc_business.Appointment WHERE appointment_id=?",10000+i,(i+1)*20,original);
  var summary=workspace.summary(fixture.cashier,"WEB","CASHIER",1L,Instant.parse("2026-11-01T00:00:00Z"),Instant.parse("2026-12-01T00:00:00Z"),request());var states=(List<Map<String,Object>>)summary.get("states");assertEquals(106L,states.stream().mapToLong(r->((Number)r.get("count")).longValue()).sum());
  var ids=new HashSet<String>();String cursor=null;int pages=0;do{var page=workspace.appointments(fixture.cashier,"WEB","CASHIER",1L,null,null,null,null,null,cursor,100,request());var items=(List<Map<String,Object>>)page.get("items");for(var row:items){assertTrue(ids.add((String)row.get("appointment_id")));assertNotNull(row.get("patient_name"));assertNotNull(row.get("patient_number"));assertFalse(row.containsKey("phone"));assertFalse(row.containsKey("billing_address"));assertFalse(row.containsKey("problems_or_special_needs"));}cursor=(String)page.get("next_cursor");pages++;}while(cursor!=null);assertEquals(106,ids.size());assertEquals(2,pages);
 }
 @Test void roleClinicAndRevokedGrantAreEnforced(){
  assertThrows(DomainFailure.class,()->workspace.appointments(fixture.cashier,"WEB","RECEPTION",1L,null,null,null,null,null,null,50,request()));
  assertThrows(DomainFailure.class,()->workspace.summary(fixture.cashier,"WEB","CASHIER",2L,Instant.EPOCH,Instant.now(),request()));
  fixture.base().db.update("DELETE FROM adc_identity.GrantClinicScope WHERE grant_id='cashier-grant'");
  assertThrows(DomainFailure.class,()->workspace.appointments(fixture.cashier,"WEB","CASHIER",null,null,null,null,null,null,null,50,request()));
  assertThrows(DomainFailure.class,()->fixture.invoices.preview(fixture.cashier,"WEB",fixture.appointment(),request()));
 }
 @Test void previewUsesHistoricalPricesAndCannotExposeClinicalDataOrCreateFacts()throws Exception{
  fixture.base().db.update("UPDATE adc_business.Treatment SET default_unit_price=999.00 WHERE treatment_id=71");
  var preview=fixture.invoices.preview(fixture.cashier,"WEB",fixture.appointment(),request());assertEquals("15.02",preview.get("total_amount"));assertEquals(Set.of("appointment_id","patient_name","patient_number","clinic_name","items","total_amount"),preview.keySet());
  assertEquals(0,fixture.base().db.queryForObject("SELECT COUNT(*) FROM adc_business.Invoice",Integer.class));assertThrows(DomainFailure.class,()->fixture.invoices.preview(fixture.fixture.doctorToken,"WEB",fixture.appointment(),request()));
  var invoice=fixture.invoices.issue(fixture.command("review-issue"),fixture.appointment());assertEquals(preview.get("total_amount"),invoice.get("total_amount"));assertEquals(invoice,fixture.invoices.issue(fixture.command("review-issue"),fixture.appointment()));
 }
 @SuppressWarnings("unchecked") @Test void dentistTaskQueueOnlyIncludesAssignedDentistAndSearchReachesUnloadedResources(){
  var base=fixture.base();base.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('clinical-grant','listAppointments')");var own=workspace.appointments(fixture.fixture.doctorToken,"WEB","DENTIST",1L,null,null,null,null,null,null,50,request());assertEquals(List.of(),own.get("items"));
  for(int i=0;i<110;i++)base.db.update("INSERT INTO adc_business.Treatment VALUES (?, ?, ?,NULL,10.00,true)",2000+i,"Q-"+i,i==109?"Search target beyond first page":"Synthetic treatment "+i);
  var store=base.context.getBean(OrganizationResourceStore.class);var found=store.catalog(ResourceKind.TREATMENT,List.of(1L),true,0,20,"Search target");var rows=(List<Map<String,Object>>)found.get("items");assertEquals(1,rows.size());assertEquals("2109",rows.getFirst().get("id"));assertEquals("10.00",rows.getFirst().get("current_price"));
 }
}
