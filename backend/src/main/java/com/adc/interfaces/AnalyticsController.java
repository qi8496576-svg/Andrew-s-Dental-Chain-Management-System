package com.adc.interfaces;
import com.adc.application.AnalyticsService;
import com.adc.domain.shared.BusinessValues;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/analytics")
public class AnalyticsController {
    private final AnalyticsService service;public AnalyticsController(AnalyticsService service){this.service=service;}
    @GetMapping("/{metric}")public org.springframework.http.ResponseEntity<Map<String,Object>> get(@PathVariable String metric,@RequestParam(required=false)String clinic_id,@RequestParam String start,@RequestParam String end,@RequestParam String cutoff,@RequestParam String rule_version,@RequestParam(required=false)String treatment_id,@RequestParam(required=false)String dentist_id,HttpServletRequest request){var p=RequestProof.from(request);return AppointmentCommandProof.response(service.get(p.token(),p.client(),metric,clinic_id==null?null:BusinessValues.id(clinic_id),start,end,cutoff,rule_version,treatment_id,dentist_id,RequestProof.requestId(request)));}
}
