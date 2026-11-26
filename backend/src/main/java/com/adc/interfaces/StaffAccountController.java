package com.adc.interfaces;

import com.adc.application.*;
import com.adc.identity.AuthSecrets;
import com.adc.domain.shared.BusinessValues;
import com.adc.infrastructure.CanonicalJson;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@RestController
@RequestMapping("/api/v1/identity/staff-accounts")
public class StaffAccountController {
    private final StaffAccountService accounts;private final AuthSecrets secrets;
    public StaffAccountController(StaffAccountService accounts,AuthSecrets secrets){this.accounts=accounts;this.secrets=secrets;}
    public record Creation(@NotBlank String staff_reference,@NotBlank String username,String dentist_id) { }
    public record Reason(@NotBlank String reason,String verification_reference) { }
    public record Recovery(@NotBlank String verification_reference,@NotBlank String reason,@NotEmpty String replacement_password) {@Override public String toString(){return "CredentialRecovery[credentials redacted]";}}
    private AtomicCommandExecutor.Command command(HttpServletRequest request,String operation,String key,Object input,boolean sensitive) {
        var proof=RequestProof.from(request);String json=JsonMapper.builder().build().writeValueAsString(input);
        byte[] hash=CanonicalJson.requestHash(request.getMethod(),request.getRequestURI(),request.getHeader("If-Match"),json);
        if(sensitive)hash=secrets.derive("sensitive-request-receipt",HexFormat.of().formatHex(hash));
        return new AtomicCommandExecutor.Command(proof.token(),proof.client(),operation,key,hash,RequestProof.requestId(request));
    }
    private static ResponseEntity<Map<String,Object>> response(Map<String,Object> view){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(view);}
    @GetMapping
    public ResponseEntity<Map<String,Object>> list(@RequestParam(required=false)String cursor,@RequestParam(defaultValue="20")int limit,HttpServletRequest request) {
        var proof=RequestProof.from(request);return response(accounts.list(proof.token(),proof.client(),cursor,limit,RequestProof.requestId(request)));
    }
    @PostMapping
    public ResponseEntity<Map<String,Object>> create(@RequestHeader("Idempotency-Key")String key,@Valid @RequestBody Creation input,HttpServletRequest request)throws Exception {
        return response(accounts.create(command(request,"createStaffAccount",key,input,false),new StaffAccountService.NewAccount(input.staff_reference,input.username,input.dentist_id==null?null:BusinessValues.id(input.dentist_id))));
    }
    @PostMapping("/{subjectId}/activate")
    public ResponseEntity<Map<String,Object>> activate(@PathVariable String subjectId,@RequestHeader("Idempotency-Key")String key,@Valid @RequestBody Reason input,HttpServletRequest request)throws Exception {
        return response(accounts.activate(command(request,"activateStaffAccount",key,input,false),subjectId,new StaffAccountService.ChangeReason(input.reason,input.verification_reference)));
    }
    @PostMapping("/{subjectId}/deactivate")
    public ResponseEntity<Map<String,Object>> deactivate(@PathVariable String subjectId,@RequestHeader("Idempotency-Key")String key,@Valid @RequestBody Reason input,HttpServletRequest request)throws Exception {
        return response(accounts.deactivate(command(request,"deactivateStaffAccount",key,input,false),subjectId,new StaffAccountService.ChangeReason(input.reason,input.verification_reference)));
    }
    @PostMapping("/{subjectId}/credential-recovery")
    public ResponseEntity<Map<String,Object>> recover(@PathVariable String subjectId,@RequestHeader("Idempotency-Key")String key,@Valid @RequestBody Recovery input,HttpServletRequest request)throws Exception {
        return response(accounts.recover(command(request,"credentialrecoveryStaffAccount",key,input,true),subjectId,new StaffAccountService.Recovery(input.verification_reference,input.reason,input.replacement_password)));
    }
}
