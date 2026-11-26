package com.adc.interfaces;

import com.adc.application.*;
import com.adc.domain.shared.*;
import com.adc.identity.AuthSecrets;
import com.adc.infrastructure.CanonicalJson;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@RestController @RequestMapping("/api/v1")
public class AppointmentBookingController {
    private final AppointmentBookingService booking;private final AuthSecrets secrets;private static final JsonMapper JSON=JsonMapper.builder().build();
    public AppointmentBookingController(AppointmentBookingService booking,AuthSecrets secrets){this.booking=booking;this.secrets=secrets;}
    public record Declaration(String review_status,List<Map<String,Object>> records,Boolean confirmed) { }
    public record Creation(String clinic_id,String schedule_id,String scheduled_at,List<String> requested_treatment_ids,String allergy_confirmation_reference,String patient_id,String patient_verification_reference,Map<String,Object> patient_details,Declaration allergy_declaration) { }
    private ResponseEntity<Map<String,Object>> response(Map<String,Object> body){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).eTag(CanonicalJson.etag(JSON.writeValueAsString(body))).body(body);}
    @PostMapping("/appointments") public ResponseEntity<Map<String,Object>> create(@RequestHeader("Idempotency-Key")String key,@RequestBody Creation input,HttpServletRequest request)throws Exception{var proof=RequestProof.from(request);byte[] hash=CanonicalJson.requestHash(request.getMethod(),request.getRequestURI(),null,JSON.writeValueAsString(input));var command=new AtomicCommandExecutor.Command(proof.token(),proof.client(),"createAppointment",key,secrets.derive("sensitive-booking-request",HexFormat.of().formatHex(hash)),RequestProof.requestId(request));var declaration=input.allergy_declaration;return response(booking.create(command,new AppointmentBookingService.Creation(BusinessValues.id(input.clinic_id),BusinessValues.id(input.schedule_id),BusinessTime.timestamp(input.scheduled_at),input.requested_treatment_ids==null?null:input.requested_treatment_ids.stream().map(BusinessValues::id).toList(),input.allergy_confirmation_reference,input.patient_id==null?null:BusinessValues.id(input.patient_id),input.patient_verification_reference,input.patient_details,declaration==null?null:new AppointmentBookingService.Declaration(declaration.review_status,declaration.records,Boolean.TRUE.equals(declaration.confirmed)))));}
    @GetMapping("/appointment-candidates") public ResponseEntity<Map<String,Object>> candidates(@RequestParam String clinic_id,@RequestParam List<String> treatment_ids,@RequestParam String start,@RequestParam String end,@RequestParam(required=false)String cursor,@RequestParam(defaultValue="20")int limit,HttpServletRequest request){var proof=RequestProof.from(request);return response(booking.candidates(proof.token(),proof.client(),BusinessValues.id(clinic_id),treatment_ids.stream().map(BusinessValues::id).toList(),BusinessTime.timestamp(start),BusinessTime.timestamp(end),cursor,limit,RequestProof.requestId(request)));}
    @GetMapping("/appointments") public ResponseEntity<Map<String,Object>> list(@RequestParam(required=false)String clinic_id,@RequestParam(required=false)String start,@RequestParam(required=false)String end,@RequestParam(required=false)String status,@RequestParam(required=false)String cursor,@RequestParam(defaultValue="20")int limit,HttpServletRequest request){var proof=RequestProof.from(request);return response(booking.list(proof.token(),proof.client(),clinic_id==null?null:BusinessValues.id(clinic_id),start==null?null:BusinessTime.timestamp(start),end==null?null:BusinessTime.timestamp(end),status,cursor,limit,RequestProof.requestId(request)));}
    @GetMapping("/appointments/{appointmentId}") public ResponseEntity<Map<String,Object>> get(@PathVariable String appointmentId,HttpServletRequest request){var proof=RequestProof.from(request);return response(booking.get(proof.token(),proof.client(),BusinessValues.id(appointmentId),RequestProof.requestId(request)));}
}
