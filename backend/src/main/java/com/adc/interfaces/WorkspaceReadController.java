package com.adc.interfaces;
import com.adc.application.WorkspaceReadService;
import com.adc.domain.shared.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/workspace")
public class WorkspaceReadController {
 private final WorkspaceReadService service;
 public WorkspaceReadController(WorkspaceReadService service){this.service=service;}
 @GetMapping("/appointments") public ResponseEntity<Map<String,Object>> appointments(@RequestParam String role,@RequestParam(required=false)String clinic_id,@RequestParam(required=false)String start,@RequestParam(required=false)String end,@RequestParam(required=false)String status,@RequestParam(required=false)String dentist_id,@RequestParam(required=false)String review,@RequestParam(required=false)String cursor,@RequestParam(defaultValue="50")int limit,HttpServletRequest request){var p=RequestProof.from(request);return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.appointments(p.token(),p.client(),role,clinic_id==null?null:BusinessValues.id(clinic_id),start==null?null:BusinessTime.timestamp(start),end==null?null:BusinessTime.timestamp(end),status,dentist_id==null?null:BusinessValues.id(dentist_id),review,cursor,limit,RequestProof.requestId(request)));}
 @GetMapping("/applied-treatments") public ResponseEntity<Map<String,Object>> applied(@RequestParam(required=false)String clinic_id,@RequestParam(required=false)String cursor,@RequestParam(defaultValue="50")int limit,HttpServletRequest request){var p=RequestProof.from(request);return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.applied(p.token(),p.client(),clinic_id==null?null:BusinessValues.id(clinic_id),cursor,limit,RequestProof.requestId(request)));}
 @GetMapping("/summary") public ResponseEntity<Map<String,Object>> summary(@RequestParam String role,@RequestParam(required=false)String clinic_id,@RequestParam String start,@RequestParam String end,HttpServletRequest request){var p=RequestProof.from(request);return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.summary(p.token(),p.client(),role,clinic_id==null?null:BusinessValues.id(clinic_id),BusinessTime.timestamp(start),BusinessTime.timestamp(end),RequestProof.requestId(request)));}
}
