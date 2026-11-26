package com.adc.interfaces;

import com.adc.application.*;
import com.adc.domain.shared.*;
import com.adc.infrastructure.CanonicalJson;
import jakarta.servlet.http.HttpServletRequest;
import java.time.*;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@RestController @RequestMapping("/api/v1/schedules")
public class ScheduleController {
    private final ScheduleService schedules;private static final JsonMapper JSON=JsonMapper.builder().build();
    public ScheduleController(ScheduleService schedules){this.schedules=schedules;}
    public record Creation(String dentist_id,String clinic_id,LocalDate schedule_date,String start_time,String end_time,Integer slot_minutes,String note) { }
    public record Reason(String reason) { }
    private AtomicCommandExecutor.Command command(HttpServletRequest request,String operation,String key,Object body){var proof=RequestProof.from(request);return new AtomicCommandExecutor.Command(proof.token(),proof.client(),operation,key,CanonicalJson.requestHash(request.getMethod(),request.getRequestURI(),null,JSON.writeValueAsString(body)),RequestProof.requestId(request));}
    private ResponseEntity<Map<String,Object>> response(Map<String,Object> body){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);}
    private static LocalTime time(String value){if(value==null || !value.matches("\\d{2}:\\d{2}:\\d{2}"))throw new DomainFailure(400,"INVALID_REQUEST");try{return LocalTime.parse(value);}catch(DateTimeException failure){throw new DomainFailure(400,"INVALID_REQUEST");}}
    @PostMapping public ResponseEntity<Map<String,Object>> create(@RequestHeader("Idempotency-Key")String key,@RequestBody Creation input,HttpServletRequest request)throws Exception{if(input.slot_minutes==null)throw new DomainFailure(422,"FIELD_REQUIRED");return response(schedules.create(command(request,"createSchedule",key,input),new ScheduleService.Creation(BusinessValues.id(input.dentist_id),BusinessValues.id(input.clinic_id),input.schedule_date,time(input.start_time),time(input.end_time),input.slot_minutes,input.note)));}
    @PostMapping("/{scheduleId}/suspend") public ResponseEntity<Map<String,Object>> suspend(@PathVariable String scheduleId,@RequestHeader("Idempotency-Key")String key,@RequestBody Reason input,HttpServletRequest request)throws Exception{return response(schedules.suspend(command(request,"suspendSchedule",key,input),BusinessValues.id(scheduleId),input.reason));}
    @GetMapping public ResponseEntity<Map<String,Object>> list(@RequestParam(required=false)String clinic_id,@RequestParam(required=false)String dentist_id,@RequestParam(required=false)String start,@RequestParam(required=false)String end,@RequestParam(required=false)String cursor,@RequestParam(defaultValue="20")int limit,HttpServletRequest request){var proof=RequestProof.from(request);return response(schedules.list(proof.token(),proof.client(),clinic_id==null?null:BusinessValues.id(clinic_id),dentist_id==null?null:BusinessValues.id(dentist_id),start==null?null:BusinessTime.timestamp(start),end==null?null:BusinessTime.timestamp(end),cursor,limit,RequestProof.requestId(request)));}
}
