package com.adc.interfaces;

import com.adc.application.*;
import com.adc.domain.organizationresources.ResourceKind;
import com.adc.domain.shared.BusinessValues;
import com.adc.identity.AuthSecrets;
import com.adc.infrastructure.CanonicalJson;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@RestController
@RequestMapping("/api/v1")
public class ResourceMaintenanceController {
    private final ResourceMaintenanceService resources;private final AuthSecrets secrets;
    public ResourceMaintenanceController(ResourceMaintenanceService resources,AuthSecrets secrets){this.resources=resources;this.secrets=secrets;}
    public record Requirements(List<Map<String,Object>> requirements) { }
    private static ResourceKind kind(HttpServletRequest request){return ResourceKind.path(request.getRequestURI().split("/")[3]);}
    private AtomicCommandExecutor.Command command(HttpServletRequest request,String operation,String key,Object body) {
        var proof=RequestProof.from(request);byte[] input=CanonicalJson.requestHash(request.getMethod(),request.getRequestURI(),request.getHeader("If-Match"),JsonMapper.builder().build().writeValueAsString(body));
        return new AtomicCommandExecutor.Command(proof.token(),proof.client(),operation,key,secrets.derive("sensitive-resource-request",HexFormat.of().formatHex(input)),RequestProof.requestId(request));
    }
    private static ResponseEntity<Map<String,Object>> response(ResourceMaintenanceService.View view){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).eTag(view.etag()).body(view.body());}
    @GetMapping({"/clinics","/dentists","/qualifications","/treatments"})
    public ResponseEntity<Map<String,Object>> catalog(@RequestParam(required=false)String q,@RequestParam(required=false)String cursor,@RequestParam(defaultValue="20")int limit,HttpServletRequest request) {
        var proof=RequestProof.from(request);return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(resources.catalog(proof.token(),proof.client(),kind(request),cursor,limit,RequestProof.requestId(request),q));
    }
    @PostMapping({"/clinics","/dentists","/qualifications","/treatments","/allergies"})
    public ResponseEntity<Map<String,Object>> create(@RequestHeader("Idempotency-Key")String key,@RequestBody Map<String,Object> input,HttpServletRequest request)throws Exception {
        var kind=kind(request);return response(resources.create(command(request,"create"+kind.table,key,input),kind,input));
    }
    @GetMapping({"/clinics/{resourceId}","/dentists/{resourceId}","/qualifications/{resourceId}","/treatments/{resourceId}","/allergies/{resourceId}"})
    public ResponseEntity<Map<String,Object>> detail(@PathVariable String resourceId,HttpServletRequest request) {
        var proof=RequestProof.from(request);return response(resources.detail(proof.token(),proof.client(),kind(request),BusinessValues.id(resourceId),RequestProof.requestId(request)));
    }
    @PatchMapping({"/clinics/{resourceId}","/dentists/{resourceId}","/qualifications/{resourceId}","/treatments/{resourceId}","/allergies/{resourceId}"})
    public ResponseEntity<Map<String,Object>> update(@PathVariable String resourceId,@RequestHeader("Idempotency-Key")String key,@RequestHeader("If-Match")String etag,@RequestBody Map<String,Object> input,HttpServletRequest request)throws Exception {
        var kind=kind(request);return response(resources.update(command(request,"update"+kind.table,key,input),kind,BusinessValues.id(resourceId),input,etag));
    }
    @PostMapping("/dentists/{dentistId}/qualifications")
    public ResponseEntity<Map<String,Object>> qualification(@PathVariable String dentistId,@RequestHeader("Idempotency-Key")String key,@RequestBody Map<String,Object> input,HttpServletRequest request)throws Exception {
        return response(resources.qualification(command(request,"maintainDentistQualification",key,input),BusinessValues.id(dentistId),input));
    }
    @PostMapping("/dentists/{dentistId}/clinic-assignments")
    public ResponseEntity<Map<String,Object>> assignment(@PathVariable String dentistId,@RequestHeader("Idempotency-Key")String key,@RequestBody Map<String,Object> input,HttpServletRequest request)throws Exception {
        return response(resources.assignment(command(request,"maintainDentistAssignment",key,input),BusinessValues.id(dentistId),input));
    }
    @PutMapping("/treatments/{treatmentId}/qualification-requirements")
    public ResponseEntity<Map<String,Object>> requirements(@PathVariable String treatmentId,@RequestHeader("Idempotency-Key")String key,@RequestBody Requirements input,HttpServletRequest request)throws Exception {
        return response(resources.requirements(command(request,"setTreatmentRequirements",key,input),BusinessValues.id(treatmentId),input.requirements));
    }
}
