package com.adc.interfaces;

import com.adc.application.*;
import com.adc.domain.shared.*;
import com.adc.infrastructure.*;
import com.adc.identity.AuthSecrets;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@RestController @RequestMapping("/api/v1")
public class PatientBillingController {
    private final PatientBillingService billing;private final AuthSecrets secrets;private static final JsonMapper JSON=JsonMapper.builder().build();
    public PatientBillingController(PatientBillingService billing,AuthSecrets secrets){this.billing=billing;this.secrets=secrets;}
    private ResponseEntity<Map<String,Object>> response(Map<String,Object> body){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);}
    private AtomicCommandExecutor.Command command(HttpServletRequest r,String op,String key,Object input){var p=RequestProof.from(r);byte[] hash=CanonicalJson.requestHash(r.getMethod(),r.getRequestURI(),null,JSON.writeValueAsString(input));return new AtomicCommandExecutor.Command(p.token(),p.client(),op,key,secrets.derive("sensitive-booking-request",HexFormat.of().formatHex(hash)),RequestProof.requestId(r));}
    @PostMapping("/booking-holds") public ResponseEntity<Map<String,Object>> hold(@RequestHeader("Idempotency-Key")String key,@RequestBody AppointmentBookingController.Creation input,HttpServletRequest r)throws Exception{var d=input.allergy_declaration();return response(billing.hold(command(r,"createBookingHold",key,input),new AppointmentBookingService.Creation(BusinessValues.id(input.clinic_id()),BusinessValues.id(input.schedule_id()),BusinessTime.timestamp(input.scheduled_at()),input.requested_treatment_ids()==null?null:input.requested_treatment_ids().stream().map(BusinessValues::id).toList(),input.allergy_confirmation_reference(),input.patient_id()==null?null:BusinessValues.id(input.patient_id()),input.patient_verification_reference(),input.patient_details(),d==null?null:new AppointmentBookingService.Declaration(d.review_status(),d.records(),Boolean.TRUE.equals(d.confirmed())))));}
    @GetMapping("/patient-bills") public ResponseEntity<Map<String,Object>> list(@RequestParam(required=false)String cursor,@RequestParam(defaultValue="20")int limit,HttpServletRequest r){var p=RequestProof.from(r);return response(billing.list(p.token(),p.client(),cursor,limit,RequestProof.requestId(r)));}
    @GetMapping("/patient-bills/{billId}") public ResponseEntity<Map<String,Object>> get(@PathVariable String billId,HttpServletRequest r){var p=RequestProof.from(r);return response(billing.get(p.token(),p.client(),BusinessValues.id(billId),RequestProof.requestId(r)));}
    @PostMapping("/patient-bills/{billId}/demo-payments") public ResponseEntity<Map<String,Object>> pay(@PathVariable String billId,@RequestHeader("Idempotency-Key")String key,@RequestBody Map<String,Object> input,HttpServletRequest r)throws Exception{empty(input);return response(billing.pay(command(r,"payDemoBill",key,input),BusinessValues.id(billId)));}
    @PostMapping("/patient-bills/{billId}/close") public ResponseEntity<Map<String,Object>> close(@PathVariable String billId,@RequestHeader("Idempotency-Key")String key,@RequestBody Map<String,Object> input,HttpServletRequest r)throws Exception{empty(input);return response(billing.close(command(r,"closePatientBill",key,input),BusinessValues.id(billId)));}
    public record Refund(String reason) { }
    @PostMapping("/patient-bills/{billId}/refunds") public ResponseEntity<Map<String,Object>> refund(@PathVariable String billId,@RequestHeader("Idempotency-Key")String key,@RequestBody Refund input,HttpServletRequest r)throws Exception{return response(billing.refund(command(r,"refundPatientBill",key,input),BusinessValues.id(billId),input.reason()));}
    public record Fee(Object amount_fen) { }
    @GetMapping("/registration-fees/{clinicId}/{dentistId}") public ResponseEntity<Map<String,Object>> fee(@PathVariable String clinicId,@PathVariable String dentistId,HttpServletRequest r){var p=RequestProof.from(r);return response(billing.fee(p.token(),p.client(),BusinessValues.id(clinicId),BusinessValues.id(dentistId),RequestProof.requestId(r)));}
    @PutMapping("/registration-fees/{clinicId}/{dentistId}") public ResponseEntity<Map<String,Object>> setFee(@PathVariable String clinicId,@PathVariable String dentistId,@RequestHeader("Idempotency-Key")String key,@RequestBody Fee input,HttpServletRequest r)throws Exception{if(!(input.amount_fen() instanceof Integer)&&!(input.amount_fen() instanceof Long))throw new DomainFailure(422,"INVALID_AMOUNT");return response(billing.setFee(command(r,"setRegistrationFee",key,input),BusinessValues.id(clinicId),BusinessValues.id(dentistId),((Number)input.amount_fen()).longValue()));}
    private static void empty(Map<String,Object> input){if(input==null||!input.isEmpty())throw new DomainFailure(400,"INVALID_REQUEST");}
}
