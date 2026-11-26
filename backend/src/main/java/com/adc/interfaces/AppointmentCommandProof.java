package com.adc.interfaces;
import com.adc.application.AtomicCommandExecutor;
import com.adc.identity.AuthSecrets;
import com.adc.infrastructure.CanonicalJson;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HexFormat;
import org.springframework.http.*;
import tools.jackson.databind.json.JsonMapper;

final class AppointmentCommandProof {
    private static final JsonMapper JSON=JsonMapper.builder().build();
    private AppointmentCommandProof() { }
    static AtomicCommandExecutor.Command command(HttpServletRequest request,AuthSecrets secrets,String operation,String key,Object input){var proof=RequestProof.from(request);var hash=CanonicalJson.requestHash(request.getMethod(),request.getRequestURI(),null,JSON.writeValueAsString(input));return new AtomicCommandExecutor.Command(proof.token(),proof.client(),operation,key,secrets.derive("sensitive-appointment-transition",HexFormat.of().formatHex(hash)),RequestProof.requestId(request));}
    static ResponseEntity<java.util.Map<String,Object>> response(java.util.Map<String,Object> body){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).eTag(CanonicalJson.etag(JSON.writeValueAsString(body))).body(body);}
}
