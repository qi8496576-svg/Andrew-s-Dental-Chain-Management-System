package com.adc.interfaces;
import com.adc.application.AppointmentNoShowService;
import com.adc.domain.shared.BusinessValues;
import com.adc.identity.AuthSecrets;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/appointments")
public class AppointmentNoShowController {
    private final AppointmentNoShowService service;private final AuthSecrets secrets;
    public AppointmentNoShowController(AppointmentNoShowService service,AuthSecrets secrets){this.service=service;this.secrets=secrets;}
    public record NoShow(String reason,String verification_reference) { }
    @PostMapping("/{appointmentId}/no-show")public org.springframework.http.ResponseEntity<java.util.Map<String,Object>> mark(@PathVariable String appointmentId,@RequestHeader("Idempotency-Key")String key,@RequestBody NoShow input,HttpServletRequest request)throws Exception{return AppointmentCommandProof.response(service.mark(AppointmentCommandProof.command(request,secrets,"markNoShow",key,input),BusinessValues.id(appointmentId),input.reason,input.verification_reference));}
}
