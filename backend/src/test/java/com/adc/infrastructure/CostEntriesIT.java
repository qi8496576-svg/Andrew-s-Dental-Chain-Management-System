package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.application.*;
import com.adc.application.performance.CostEntryService;
import com.adc.domain.shared.DomainFailure;
import java.util.*;
import org.junit.jupiter.api.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CostEntriesIT {
    final OrganizationResourcesIT fixture=new OrganizationResourcesIT();CostEntryService costs;long dentist;
    @BeforeAll void migrate()throws Exception{fixture.migrate();}
    @AfterAll void dispose(){fixture.dispose();}
    @BeforeEach void setup()throws Exception{fixture.setup();fixture.fixture.context.register(CostEntryStore.class,CostEntryService.class);costs=fixture.fixture.context.getBean(CostEntryService.class);fixture.fixture.db.update("INSERT INTO adc_identity.GrantCapability VALUES ('hq','cost.verify')");dentist=fixture.doctor();}
    @AfterEach void close(){fixture.close();}
    AtomicCommandExecutor.Command command(String operation,String key){return fixture.command(operation,key);}
    CostEntryService.Create input(String source,String amount){return new CostEntryService.Create("1",Long.toString(dentist),null,null,"MEDICAL_SUPPLY",amount,"2026-09-30T23:59:59+08:00",null,source,"owned-quarter-source","verified supplier receipt");}
    @Test void exactImmutableSourceAndTrustedConfirmation()throws Exception{
        var input=input("receipt-1","100.00");var command=command("recordCostEntry","record");var first=costs.create(command,input);assertEquals(first,costs.create(command,input));assertEquals("hq",first.get("confirmed_by"));assertEquals(first,costs.get(fixture.fixture.token,"WEB",Long.parseLong((String)first.get("cost_entry_id")),UUID.randomUUID().toString()));assertEquals("100.00",first.get("amount"));assertThrows(DomainFailure.class,()->costs.create(command("recordCostEntry","duplicate"),input));assertEquals(1,fixture.fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business.CostEntry",Integer.class));
        assertThrows(DomainFailure.class,()->costs.create(command("recordCostEntry","negative"),input("negative","-1.00")));assertThrows(DomainFailure.class,()->costs.create(command("recordCostEntry","zero-no-scope"),input("zero","0.00")));
    }
    @Test void verifiedReversalUsesItsOwnPeriodAndPreservesOriginal()throws Exception{
        long id=Long.parseLong((String)costs.create(command("recordCostEntry","original"),input("original","100.00")).get("cost_entry_id"));var reverse=new CostEntryService.Reverse("2026-10-01T00:00:00+08:00","reversal","verified-quarter-4","verified reversal receipt","supplier correction");var first=costs.reverse(command("reverseCostEntry","reverse"),id,reverse);assertEquals("-100.00",first.get("amount"));assertEquals(Long.toString(id),first.get("reversal_of_id"));assertEquals(first,costs.reverse(command("reverseCostEntry","reverse"),id,reverse));assertThrows(DomainFailure.class,()->costs.reverse(command("reverseCostEntry","second"),id,new CostEntryService.Reverse(reverse.incurred_at(),"second-reverse",reverse.source_batch(),reverse.verification_reference(),reverse.reason())));assertEquals("100.00",fixture.fixture.db.queryForObject("SELECT amount FROM adc_business.CostEntry WHERE cost_entry_id=?",java.math.BigDecimal.class,id).toPlainString());
    }
    @Test void wrongRoleScopeAndAttributionAreRejected()throws Exception{
        var unauthorized=new AtomicCommandExecutor.Command(fixture.fixture.other,"WEB","recordCostEntry","deny",Crypto.sha256("deny"),UUID.randomUUID().toString());assertThrows(DomainFailure.class,()->costs.create(unauthorized,input("deny","1.00")));
        var missing=new CostEntryService.Create("1",null,null,null,"MEDICAL_SUPPLY","1.00","2026-09-01T00:00:00+08:00",null,"missing","batch","verified source");assertThrows(DomainFailure.class,()->costs.create(command("recordCostEntry","missing"),missing));fixture.fixture.db.update("DELETE FROM adc_identity.GrantClinicScope WHERE grant_id='hq'");assertThrows(DomainFailure.class,()->costs.list(fixture.fixture.token,"WEB",null,null,null,null,20,UUID.randomUUID().toString()));
    }
    @Test void competingReversalsHaveOneWinnerAndAuditFailureRollsBack()throws Exception{
        long id=Long.parseLong((String)costs.create(command("recordCostEntry","original"),input("original","100.00")).get("cost_entry_id"));try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)){var start=new java.util.concurrent.CountDownLatch(1);var jobs=new ArrayList<java.util.concurrent.Future<Integer>>();for(int i=0;i<2;i++){int n=i;jobs.add(pool.submit(()->{start.await();try{costs.reverse(command("reverseCostEntry","reverse-"+n),id,new CostEntryService.Reverse("2026-10-01T00:00:00+08:00","reverse-"+n,"batch","verified reversal","correction"));return 200;}catch(DomainFailure denied){return denied.status();}}));}start.countDown();var statuses=new ArrayList<Integer>();for(var job:jobs)statuses.add(job.get(20,java.util.concurrent.TimeUnit.SECONDS));assertEquals(Set.of(200,409),new HashSet<>(statuses));}assertEquals(1,fixture.fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business.CostEntry WHERE reversal_of_id=?",Integer.class,id));
        try(var connection=fixture.fixture.connection("inspector");var sql=connection.createStatement()){sql.execute("REVOKE INSERT ON adc_audit.* FROM 'adc_runtime_role'");try{assertThrows(org.springframework.dao.DataAccessException.class,()->costs.create(command("recordCostEntry","audit-failure"),input("audit-failure","2.00")));}finally{sql.execute("GRANT INSERT ON adc_audit.* TO 'adc_runtime_role'");}}assertEquals(0,fixture.fixture.db.queryForObject("SELECT COUNT(*) FROM adc_business.CostEntry WHERE source_reference='audit-failure'",Integer.class));
    }
}
