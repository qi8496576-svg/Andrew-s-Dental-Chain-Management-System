package com.adc.interfaces;

import com.adc.application.OrganizationResourceService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
public class OrganizationResourceController {
    private final OrganizationResourceService resources;
    public OrganizationResourceController(OrganizationResourceService resources){this.resources=resources;}
    @GetMapping("/api/v1/allergies")
    public ResponseEntity<Map<String,Object>> allergies(@RequestParam(required=false)String cursor,@RequestParam(defaultValue="20")int limit,HttpServletRequest request) {
        var proof=RequestProof.from(request);return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(resources.allergies(proof.token(),proof.client(),cursor,limit,RequestProof.requestId(request)));
    }
}
