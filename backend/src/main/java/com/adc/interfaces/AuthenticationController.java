package com.adc.interfaces;

import com.adc.application.AuthenticationService;
import com.adc.identity.*;
import com.adc.domain.shared.DomainFailure;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Duration;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class AuthenticationController {
    private final AuthenticationService auth;private final AuthenticationTransactions transactions;private final WebRequestProtection csrf;
    public AuthenticationController(AuthenticationService auth,AuthenticationTransactions transactions,WebRequestProtection csrf){this.auth=auth;this.transactions=transactions;this.csrf=csrf;}
    public record StaffLogin(@NotBlank @Size(max=100) String username,@NotEmpty String password) {
        @Override public String toString(){return "StaffLogin[credentials redacted]";}
    }
    public record WechatLogin(@NotBlank String code) {@Override public String toString(){return "WechatLogin[code redacted]";}}
    @GetMapping("/auth/csrf")
    public ResponseEntity<Map<String,String>> initialize(HttpServletRequest request,HttpServletResponse response) {
        String session=WebRequestProtection.cookie(request,"adc_session");
        String token=session==null?csrf.initializeAnonymous(response):transactions.rotateCsrf(session);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of("csrf_token",token));
    }
    @PostMapping("/auth/staff-sessions")
    public ResponseEntity<Map<String,Object>> staff(@Valid @RequestBody StaffLogin login,HttpServletRequest request,HttpServletResponse response) {
        var issued=auth.staff(login.username,login.password,WebRequestProtection.cookie(request,"adc_session"),RequestProof.requestId(request));
        response.addHeader("Set-Cookie",ResponseCookie.from("adc_session",issued.token()).path("/api/v1").secure(true).httpOnly(true).sameSite("Lax").maxAge(Duration.ofHours(8)).build().toString());
        response.addHeader("Set-Cookie",ResponseCookie.from("adc_preauth","").path("/api/v1/auth").secure(true).httpOnly(true).sameSite("Lax").maxAge(Duration.ZERO).build().toString());
        var body=new LinkedHashMap<>(issued.identity());body.remove("binding");body.put("expires_at",issued.expiresAt().toString());body.put("csrf_token",issued.csrf());
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);
    }
    @PostMapping("/auth/wechat-sessions")
    public ResponseEntity<Map<String,Object>> wechat(@Valid @RequestBody WechatLogin login,HttpServletRequest request) {
        if(request.getHeader("Origin")!=null || request.getHeader("Authorization")!=null || WebRequestProtection.cookie(request,"adc_session")!=null)throw new DomainFailure(403,"ACCESS_DENIED");
        var issued=auth.wechat(login.code,request.getRemoteAddr(),RequestProof.requestId(request));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of("access_token",issued.token(),"expires_at",issued.expiresAt().toString(),"subject_id",issued.subjectId(),"subject_type","PATIENT","binding_status",issued.identity().get("binding")==null?"UNBOUND":"BOUND"));
    }
    @GetMapping("/me")
    public ResponseEntity<Map<String,Object>> me(HttpServletRequest request) {
        var proof=RequestProof.from(request);return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(auth.me(proof.token(),proof.client()));
    }
    @DeleteMapping("/auth/session")
    public ResponseEntity<Void> logout(@RequestHeader("Idempotency-Key") String key,HttpServletRequest request,HttpServletResponse response)throws Exception {
        var proof=RequestProof.from(request);auth.logout(proof.token(),proof.client(),key,RequestProof.requestId(request));
        if(proof.client().equals("WEB"))response.addHeader("Set-Cookie",ResponseCookie.from("adc_session","").path("/api/v1").secure(true).httpOnly(true).sameSite("Lax").maxAge(Duration.ZERO).build().toString());
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }
}
