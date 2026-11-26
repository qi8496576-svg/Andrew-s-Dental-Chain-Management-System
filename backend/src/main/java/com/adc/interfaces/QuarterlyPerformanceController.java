package com.adc.interfaces;

import com.adc.application.QuarterlyPerformanceService;
import com.adc.application.performance.*;
import com.adc.domain.shared.BusinessValues;
import com.adc.identity.AuthSecrets;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1")
public class QuarterlyPerformanceController {
    private final QuarterlyPerformanceService performance;private final CostEntryService costs;private final PerformancePublicationService publications;private final AuthSecrets secrets;
    public QuarterlyPerformanceController(QuarterlyPerformanceService performance,CostEntryService costs,PerformancePublicationService publications,AuthSecrets secrets){this.performance=performance;this.costs=costs;this.publications=publications;this.secrets=secrets;}
    @PostMapping("/cost-entries")public Map<String,Object> cost(@RequestHeader("Idempotency-Key")String key,@RequestBody CostEntryService.Create input,HttpServletRequest request)throws Exception{return costs.create(AppointmentCommandProof.command(request,secrets,"recordCostEntry",key,input),input);}
    @PostMapping("/cost-entries/{costEntryId}/reverse")public Map<String,Object> reverse(@PathVariable String costEntryId,@RequestHeader("Idempotency-Key")String key,@RequestBody CostEntryService.Reverse input,HttpServletRequest request)throws Exception{return costs.reverse(AppointmentCommandProof.command(request,secrets,"reverseCostEntry",key,input),BusinessValues.id(costEntryId),input);}
    @GetMapping("/cost-entries/{costEntryId}")public org.springframework.http.ResponseEntity<Map<String,Object>> cost(@PathVariable String costEntryId,HttpServletRequest request){var p=RequestProof.from(request);return AppointmentCommandProof.response(costs.get(p.token(),p.client(),BusinessValues.id(costEntryId),RequestProof.requestId(request)));}
    @GetMapping("/cost-entries")public org.springframework.http.ResponseEntity<Map<String,Object>> costs(@RequestParam(required=false)String clinic_id,@RequestParam(required=false)String start,@RequestParam(required=false)String end,@RequestParam(required=false)String cursor,@RequestParam(defaultValue="20")int limit,HttpServletRequest request){var p=RequestProof.from(request);return AppointmentCommandProof.response(costs.list(p.token(),p.client(),clinic_id==null?null:BusinessValues.id(clinic_id),start,end,cursor,limit,RequestProof.requestId(request)));}
    @PostMapping("/performance-preparations")public Map<String,Object> prepare(@RequestHeader("Idempotency-Key")String key,@RequestBody QuarterlyPerformanceService.Preparation input,HttpServletRequest request)throws Exception{return performance.prepare(AppointmentCommandProof.command(request,secrets,"prepareQuarterPerformance",key,input),input);}
    @PostMapping("/performance-calculations")public Map<String,Object> calculate(@RequestHeader("Idempotency-Key")String key,@RequestBody QuarterlyPerformanceService.Calculate input,HttpServletRequest request)throws Exception{return performance.calculate(AppointmentCommandProof.command(request,secrets,"calculateQuarterPerformance",key,input),input);}
    @PostMapping("/quarterly-performances/{performanceId}/publish")public Map<String,Object> publish(@PathVariable String performanceId,@RequestHeader("Idempotency-Key")String key,@RequestBody PerformancePublicationService.Publish input,HttpServletRequest request)throws Exception{return publications.publish(AppointmentCommandProof.command(request,secrets,"publishQuarterPerformance",key,input),BusinessValues.id(performanceId),input);}
    @GetMapping("/quarterly-performances")public org.springframework.http.ResponseEntity<Map<String,Object>> list(@RequestParam(required=false)String quarter_start,@RequestParam(required=false)String quarter_end,@RequestParam(required=false)String dentist_id,@RequestParam(required=false)String calculation_status,@RequestParam(required=false)String cursor,@RequestParam(defaultValue="20")int limit,HttpServletRequest request){var p=RequestProof.from(request);return AppointmentCommandProof.response(performance.list(p.token(),p.client(),quarter_start,quarter_end,dentist_id,calculation_status,cursor,limit,RequestProof.requestId(request)));}
    @GetMapping("/quarterly-performances/{performanceId}/sources")public org.springframework.http.ResponseEntity<Map<String,Object>> sources(@PathVariable String performanceId,HttpServletRequest request){var p=RequestProof.from(request);return AppointmentCommandProof.response(performance.sources(p.token(),p.client(),BusinessValues.id(performanceId),RequestProof.requestId(request)));}
}
