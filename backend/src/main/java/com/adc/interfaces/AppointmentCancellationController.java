package com.adc.interfaces;
import com.adc.application.AppointmentCancellationService;
import com.adc.domain.shared.BusinessValues;
import com.adc.identity.AuthSecrets;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/appointments")
public class AppointmentCancellationController {
    private final AppointmentCancellationService service;private final AuthSecrets secrets;
    public AppointmentCancellationController(AppointmentCancellationService service,AuthSecrets secrets){this.service=service;this.secrets=secrets;}
    public record Cancel(String reason,String verification_reference) { }
    @PostMapping("/{appointmentId}/cancel")public org.springframework.http.ResponseEntity<java.util.Map<String,Object>> cancel(@PathVariable String appointmentId,@RequestHeader("Idempotency-Key")String key,@RequestBody Cancel input,HttpServletRequest request)throws Exception{return AppointmentCommandProof.response(service.cancel(AppointmentCommandProof.command(request,secrets,"cancelAppointment",key,input),BusinessValues.id(appointmentId),input.reason,input.verification_reference));}
}
