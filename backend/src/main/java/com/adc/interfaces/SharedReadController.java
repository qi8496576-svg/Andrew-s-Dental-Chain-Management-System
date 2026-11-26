package com.adc.interfaces;

import com.adc.application.SharedReadQueries;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class SharedReadController {
    private final SharedReadQueries queries;
    public SharedReadController(SharedReadQueries queries) {this.queries=queries;}
    @GetMapping("/requests/{requestKey}")
    public ResponseEntity<Map<String,Object>> requestResult(@PathVariable String requestKey,@RequestParam String operation,HttpServletRequest request) {
        var proof=RequestProof.from(request);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(queries.requestResult(proof.token(),proof.client(),operation,requestKey,RequestProof.requestId(request)));
    }
    @GetMapping("/audit-events")
    public ResponseEntity<Map<String,Object>> auditEvents(@RequestParam(required=false) String start,@RequestParam(required=false) String end,
        @RequestParam(required=false) String action,@RequestParam(name="object_reference",required=false) String object,
        @RequestParam(required=false) String cursor,@RequestParam(defaultValue="20") int limit,HttpServletRequest request) {
        var proof=RequestProof.from(request);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(queries.auditEvents(proof.token(),proof.client(),start,end,action,object,cursor,limit,RequestProof.requestId(request)));
    }
}
