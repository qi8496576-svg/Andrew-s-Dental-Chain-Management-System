package com.adc.interfaces;

import com.adc.application.*;
import com.adc.domain.shared.BusinessValues;
import com.adc.domain.shared.DomainFailure;
import com.adc.identity.AuthSecrets;
import com.adc.infrastructure.CanonicalJson;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@RestController
@RequestMapping("/api/v1/patients")
public class PatientController {
    private final PatientService patients;private final AuthSecrets secrets;
    private static final JsonMapper JSON=JsonMapper.builder().build();
    public PatientController(PatientService patients,AuthSecrets secrets){this.patients=patients;this.secrets=secrets;}
    public record Basis(String clinic_id,Boolean person_confirmed,String service_basis) { }
    public record CreationBasis(String clinic_id,Boolean person_confirmed,String service_basis,Boolean duplicate_reviewed,String review_reason) { }
    public record Creation(String full_name,LocalDate date_of_birth,String phone,String billing_address,String email,String emergency_contact_name,String emergency_contact_phone,CreationBasis verification_basis) { }
    public record Lookup(String patient_number,LocalDate date_of_birth,Basis verification_basis) { }
    public record Review(String allergy_review_status,String verification_reference,String reason) { }
    public record Allergy(String allergy_id,String severity_note,String clinical_note,String verification_reference,String reason) { }
    public record Retraction(String verification_reference,String reason) { }
    private AtomicCommandExecutor.Command command(HttpServletRequest request,String operation,String key,Object input) {
        var proof=RequestProof.from(request);byte[] canonical=CanonicalJson.requestHash(request.getMethod(),request.getRequestURI(),request.getHeader("If-Match"),JSON.writeValueAsString(input));
        return new AtomicCommandExecutor.Command(proof.token(),proof.client(),operation,key,secrets.derive("sensitive-patient-request",HexFormat.of().formatHex(canonical)),RequestProof.requestId(request));
    }
    private static PatientService.Verification basis(String clinic,Boolean confirmed,String service) {return new PatientService.Verification(BusinessValues.id(clinic),Boolean.TRUE.equals(confirmed),service);}
    private static ResponseEntity<Map<String,Object>> response(Map<String,Object> body) {
        Object patient=body.containsKey("patient")?body.get("patient"):body;
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).eTag(CanonicalJson.etag(JSON.writeValueAsString(patient))).body(body);
    }
    @PostMapping
    public ResponseEntity<Map<String,Object>> create(@RequestHeader("Idempotency-Key")String key,@RequestBody Creation input,HttpServletRequest request)throws Exception {
        var context=input.verification_basis;if(context==null)throw new DomainFailure(422,"FIELD_REQUIRED");
        var details=new LinkedHashMap<String,Object>();details.put("full_name",input.full_name);details.put("date_of_birth",input.date_of_birth==null?null:input.date_of_birth.toString());details.put("phone",input.phone);details.put("billing_address",input.billing_address);details.put("email",input.email);details.put("emergency_contact_name",input.emergency_contact_name);details.put("emergency_contact_phone",input.emergency_contact_phone);
        return response(patients.create(command(request,"createPatient",key,input),details,basis(context.clinic_id,context.person_confirmed,context.service_basis),Boolean.TRUE.equals(context.duplicate_reviewed),context.review_reason));
    }
    @PostMapping("/lookup")
    public ResponseEntity<Map<String,Object>> lookup(@RequestHeader("Idempotency-Key")String key,@RequestBody Lookup input,HttpServletRequest request)throws Exception {
        var context=input.verification_basis;if(context==null)throw new DomainFailure(422,"FIELD_REQUIRED");
        return response(patients.lookup(command(request,"lookupPatient",key,input),input.patient_number,input.date_of_birth,basis(context.clinic_id,context.person_confirmed,context.service_basis)));
    }
    @GetMapping("/{patientId}")
    public ResponseEntity<Map<String,Object>> get(@PathVariable String patientId,HttpServletRequest request) {
        var proof=RequestProof.from(request);return response(patients.get(proof.token(),proof.client(),BusinessValues.id(patientId),RequestProof.requestId(request)));
    }
    @PatchMapping("/{patientId}")
    public ResponseEntity<Map<String,Object>> update(@PathVariable String patientId,@RequestHeader("Idempotency-Key")String key,@RequestHeader("If-Match")String etag,@RequestBody Map<String,Object> input,HttpServletRequest request)throws Exception {
        return response(patients.update(command(request,"updatePatient",key,input),BusinessValues.id(patientId),input,etag));
    }
    @PostMapping("/{patientId}/allergy-reviews")
    public ResponseEntity<Map<String,Object>> review(@PathVariable String patientId,@RequestHeader("Idempotency-Key")String key,@RequestBody Review input,HttpServletRequest request)throws Exception {
        return response(patients.review(command(request,"reviewPatientAllergies",key,input),BusinessValues.id(patientId),input.allergy_review_status,input.verification_reference,input.reason));
    }
    @PostMapping("/{patientId}/allergy-records")
    public ResponseEntity<Map<String,Object>> add(@PathVariable String patientId,@RequestHeader("Idempotency-Key")String key,@RequestBody Allergy input,HttpServletRequest request)throws Exception {
        return response(patients.addAllergy(command(request,"addPatientAllergy",key,input),BusinessValues.id(patientId),BusinessValues.id(input.allergy_id),input.severity_note,input.clinical_note,input.verification_reference,input.reason));
    }
    @GetMapping("/{patientId}/allergy-records")
    public ResponseEntity<Map<String,Object>> list(@PathVariable String patientId,@RequestParam(required=false)String cursor,@RequestParam(defaultValue="20")int limit,HttpServletRequest request) {
        var proof=RequestProof.from(request);return response(patients.allergies(proof.token(),proof.client(),BusinessValues.id(patientId),cursor,limit,RequestProof.requestId(request)));
    }
    private static String text(Object value){if(value==null || value instanceof String)return (String)value;throw new DomainFailure(400,"INVALID_REQUEST");}
    @PostMapping("/{patientId}/allergy-records/{allergyId}/correct")
    public ResponseEntity<Map<String,Object>> correct(@PathVariable String patientId,@PathVariable String allergyId,@RequestHeader("Idempotency-Key")String key,@RequestHeader("If-Match")String etag,@RequestBody Map<String,Object> input,HttpServletRequest request)throws Exception {
        if(!Set.of("severity_note","clinical_note","verification_reference","reason").containsAll(input.keySet()))throw new DomainFailure(400,"INVALID_REQUEST");
        var patch=new LinkedHashMap<>(input);String reference=text(patch.remove("verification_reference")),reason=text(patch.remove("reason"));
        return response(patients.correctAllergy(command(request,"correctPatientAllergy",key,input),BusinessValues.id(patientId),BusinessValues.id(allergyId),patch,reference,reason,etag));
    }
    @PostMapping("/{patientId}/allergy-records/{allergyId}/retract")
    public ResponseEntity<Map<String,Object>> retract(@PathVariable String patientId,@PathVariable String allergyId,@RequestHeader("Idempotency-Key")String key,@RequestHeader("If-Match")String etag,@RequestBody Retraction input,HttpServletRequest request)throws Exception {
        return response(patients.retractAllergy(command(request,"retractPatientAllergy",key,input),BusinessValues.id(patientId),BusinessValues.id(allergyId),input.verification_reference,input.reason,etag));
    }
}
