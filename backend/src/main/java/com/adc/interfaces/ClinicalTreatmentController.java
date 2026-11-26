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
public class ClinicalTreatmentController {
    private final ClinicalTreatmentService service;private final AuthSecrets secrets;private static final JsonMapper JSON=JsonMapper.builder().build();
    public ClinicalTreatmentController(ClinicalTreatmentService service,AuthSecrets secrets){this.service=service;this.secrets=secrets;}
    public record Treatment(String treatment_id,String standard_units,String performed_at) { }
    public record Notes(String problems_or_special_needs) { }
    public record Correction(String unit_price,String reason,String verification_reference) { }
    private AtomicCommandExecutor.Command command(HttpServletRequest request,String operation,String key,Object body){var proof=RequestProof.from(request);var hash=CanonicalJson.requestHash(request.getMethod(),request.getRequestURI(),request.getHeader("If-Match"),JSON.writeValueAsString(body));return new AtomicCommandExecutor.Command(proof.token(),proof.client(),operation,key,secrets.derive("sensitive-clinical-request",HexFormat.of().formatHex(hash)),RequestProof.requestId(request));}
    private ResponseEntity<Map<String,Object>> response(Map<String,Object> body){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).eTag(body.containsKey("etag")?(String)body.get("etag"):CanonicalJson.etag(JSON.writeValueAsString(body))).body(body);}
    @PostMapping("/appointments/{appointmentId}/applied-treatments")public ResponseEntity<Map<String,Object>> record(@PathVariable String appointmentId,@RequestHeader("Idempotency-Key")String key,@RequestBody Treatment input,HttpServletRequest request)throws Exception{return response(service.record(command(request,"recordAppliedTreatment",key,input),BusinessValues.id(appointmentId),new ClinicalTreatmentService.Record(BusinessValues.id(input.treatment_id),input.standard_units,BusinessTime.timestamp(input.performed_at))));}
    @PostMapping("/appointments/{appointmentId}/complete")public ResponseEntity<Map<String,Object>> complete(@PathVariable String appointmentId,@RequestHeader("Idempotency-Key")String key,HttpServletRequest request)throws Exception{return response(service.complete(command(request,"completeAppointment",key,Map.of()),BusinessValues.id(appointmentId)));}
    @PatchMapping("/appointments/{appointmentId}/clinical-notes")public ResponseEntity<Map<String,Object>> notes(@PathVariable String appointmentId,@RequestHeader("Idempotency-Key")String key,@RequestHeader("If-Match")String etag,@RequestBody Notes input,HttpServletRequest request)throws Exception{var result=service.notes(command(request,"updateClinicalNotes",key,input),BusinessValues.id(appointmentId),input.problems_or_special_needs,etag);return ResponseEntity.ok().cacheControl(CacheControl.noStore()).eTag(result.etag()).body(result.body());}
    @GetMapping("/appointments/{appointmentId}/clinical-context")public ResponseEntity<Map<String,Object>> context(@PathVariable String appointmentId,HttpServletRequest request){var proof=RequestProof.from(request);var body=service.context(proof.token(),proof.client(),BusinessValues.id(appointmentId),RequestProof.requestId(request));var version=new LinkedHashMap<String,Object>();version.put("appointment",body.get("appointment"));version.put("problems_or_special_needs",body.get("problems_or_special_needs"));return ResponseEntity.ok().cacheControl(CacheControl.noStore()).eTag(CanonicalJson.etag(JSON.writeValueAsString(version))).body(body);}
    @GetMapping("/applied-treatments/{appliedTreatmentId}")public ResponseEntity<Map<String,Object>> applied(@PathVariable String appliedTreatmentId,HttpServletRequest request){var proof=RequestProof.from(request);return response(service.applied(proof.token(),proof.client(),BusinessValues.id(appliedTreatmentId),RequestProof.requestId(request)));}
    @PostMapping("/applied-treatments/{appliedTreatmentId}/correct-price")public ResponseEntity<Map<String,Object>> correct(@PathVariable String appliedTreatmentId,@RequestHeader("Idempotency-Key")String key,@RequestHeader("If-Match")String etag,@RequestBody Correction input,HttpServletRequest request)throws Exception{return response(service.correct(command(request,"correctTreatmentPrice",key,input),BusinessValues.id(appliedTreatmentId),input.unit_price,input.reason,input.verification_reference,etag));}
}
