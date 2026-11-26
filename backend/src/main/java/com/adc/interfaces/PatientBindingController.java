package com.adc.interfaces;

import com.adc.application.*;
import com.adc.domain.shared.*;
import com.adc.identity.AuthSecrets;
import com.adc.infrastructure.CanonicalJson;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@RestController @RequestMapping("/api/v1")
public class PatientBindingController {
    private final PatientBindingService bindings;private final AuthSecrets secrets;private static final JsonMapper JSON=JsonMapper.builder().build();
    public PatientBindingController(PatientBindingService bindings,AuthSecrets secrets){this.bindings=bindings;this.secrets=secrets;}
    public record BindingRequest(String patient_number,LocalDate date_of_birth,String clinic_id) { }
    public record Verification(String clinic_id,Boolean patient_number_checked,Boolean date_of_birth_checked,Boolean person_confirmed,String service_basis) { }
    public record Approval(String patient_id,Verification verification_basis,String reason) { }
    public record Rebind(String new_subject_id,String binding_request_id,Verification verification_basis,String reason) { }
    public record Revocation(Verification verification_basis,String reason) { }
    private PatientBindingService.Verification basis(Verification input){if(input==null)throw new DomainFailure(422,"FIELD_REQUIRED");return new PatientBindingService.Verification(BusinessValues.id(input.clinic_id),Boolean.TRUE.equals(input.patient_number_checked),Boolean.TRUE.equals(input.date_of_birth_checked),Boolean.TRUE.equals(input.person_confirmed),input.service_basis);}
    private AtomicCommandExecutor.Command command(HttpServletRequest request,String operation,String key,Object input){var proof=RequestProof.from(request);byte[] canonical=CanonicalJson.requestHash(request.getMethod(),request.getRequestURI(),null,JSON.writeValueAsString(input));return new AtomicCommandExecutor.Command(proof.token(),proof.client(),operation,key,secrets.derive("sensitive-binding-request",HexFormat.of().formatHex(canonical)),RequestProof.requestId(request));}
    private ResponseEntity<Map<String,Object>> response(Map<String,Object> body){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);}
    @PostMapping("/me/binding-requests") public ResponseEntity<Map<String,Object>> request(@RequestHeader("Idempotency-Key")String key,@RequestBody BindingRequest input,HttpServletRequest request)throws Exception{return response(bindings.request(command(request,"requestPatientBinding",key,input),input.patient_number,input.date_of_birth,BusinessValues.id(input.clinic_id)));}
    @GetMapping("/me/binding") public ResponseEntity<Map<String,Object>> current(HttpServletRequest request){var proof=RequestProof.from(request);return response(bindings.current(proof.token(),proof.client(),RequestProof.requestId(request)));}
    @GetMapping("/binding-requests") public ResponseEntity<Map<String,Object>> list(@RequestParam(required=false)String cursor,@RequestParam(defaultValue="20")int limit,HttpServletRequest request){var proof=RequestProof.from(request);return response(bindings.list(proof.token(),proof.client(),cursor,limit,RequestProof.requestId(request)));}
    @PostMapping("/binding-requests/{requestId}/approve") public ResponseEntity<Map<String,Object>> approve(@PathVariable String requestId,@RequestHeader("Idempotency-Key")String key,@RequestBody Approval input,HttpServletRequest request)throws Exception{return response(bindings.approve(command(request,"approvePatientBinding",key,input),requestId,BusinessValues.id(input.patient_id),basis(input.verification_basis),input.reason));}
    @PostMapping("/patient-bindings/{subjectId}/rebind") public ResponseEntity<Map<String,Object>> rebind(@PathVariable String subjectId,@RequestHeader("Idempotency-Key")String key,@RequestBody Rebind input,HttpServletRequest request)throws Exception{if(input.new_subject_id==null || input.binding_request_id==null)throw new DomainFailure(422,"FIELD_REQUIRED");return response(bindings.rebind(command(request,"rebindPatient",key,input),subjectId,input.new_subject_id,input.binding_request_id,basis(input.verification_basis),input.reason));}
    @PostMapping("/patient-bindings/{subjectId}/revoke") public ResponseEntity<Void> revoke(@PathVariable String subjectId,@RequestHeader("Idempotency-Key")String key,@RequestBody Revocation input,HttpServletRequest request)throws Exception{bindings.revoke(command(request,"revokePatientBinding",key,input),subjectId,basis(input.verification_basis),input.reason);return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();}
}
