package com.adc.interfaces;

import com.adc.application.*;
import com.adc.domain.shared.*;
import com.adc.infrastructure.CanonicalJson;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@RestController
@RequestMapping("/api/v1/identity/grants")
public class ClinicGrantController {
    private final ClinicGrantService grants;
    public ClinicGrantController(ClinicGrantService grants){this.grants=grants;}
    public record Creation(@NotBlank String subject_id,@NotBlank String role,@NotNull Set<String> clinic_ids,@NotNull Set<String> capabilities,@NotBlank String valid_from,String valid_until){ }
    private AtomicCommandExecutor.Command command(HttpServletRequest request,String operation,String key,Object input) {
        var proof=RequestProof.from(request);byte[] hash=CanonicalJson.requestHash(request.getMethod(),request.getRequestURI(),request.getHeader("If-Match"),JsonMapper.builder().build().writeValueAsString(input));
        return new AtomicCommandExecutor.Command(proof.token(),proof.client(),operation,key,hash,RequestProof.requestId(request));
    }
    private static ResponseEntity<Map<String,Object>> response(Map<String,Object> body){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);}
    @GetMapping
    public ResponseEntity<Map<String,Object>> list(@RequestParam(name="subject_id",required=false)String subject,@RequestParam(required=false)String cursor,@RequestParam(defaultValue="20")int limit,HttpServletRequest request) {
        var proof=RequestProof.from(request);return response(grants.list(proof.token(),proof.client(),subject,cursor,limit,RequestProof.requestId(request)));
    }
    @PostMapping
    public ResponseEntity<Map<String,Object>> create(@RequestHeader("Idempotency-Key")String key,@Valid @RequestBody Creation input,HttpServletRequest request)throws Exception {
        var clinics=new TreeSet<Long>();for(String id:input.clinic_ids)clinics.add(BusinessValues.id(id));
        var from=BusinessTime.timestamp(input.valid_from);var until=input.valid_until==null?null:BusinessTime.timestamp(input.valid_until);
        var normalized=new Creation(input.subject_id,input.role,new TreeSet<>(input.clinic_ids),new TreeSet<>(input.capabilities),from.toString(),until==null?null:until.toString());
        return response(grants.create(command(request,"createClinicGrant",key,normalized),new ClinicGrantService.GrantInput(input.subject_id,input.role,clinics,input.capabilities,from,until)));
    }
    @PostMapping("/{grantId}/revoke")
    public ResponseEntity<Map<String,Object>> revoke(@PathVariable String grantId,@RequestHeader("Idempotency-Key")String key,@Valid @RequestBody StaffAccountController.Reason input,HttpServletRequest request)throws Exception {
        return response(grants.revoke(command(request,"revokeClinicGrant",key,input),grantId,new StaffAccountService.ChangeReason(input.reason(),input.verification_reference())));
    }
}
