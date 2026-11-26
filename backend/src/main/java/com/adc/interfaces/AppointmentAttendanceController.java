package com.adc.interfaces;
import com.adc.application.AppointmentAttendanceService;
import com.adc.domain.shared.BusinessValues;
import com.adc.identity.AuthSecrets;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/appointments")
public class AppointmentAttendanceController {
    private final AppointmentAttendanceService service;private final AuthSecrets secrets;
    public AppointmentAttendanceController(AppointmentAttendanceService service,AuthSecrets secrets){this.service=service;this.secrets=secrets;}
    public record Attend(String verification_reference) { }
    @PostMapping("/{appointmentId}/attend")public org.springframework.http.ResponseEntity<java.util.Map<String,Object>> attend(@PathVariable String appointmentId,@RequestHeader("Idempotency-Key")String key,@RequestBody Attend input,HttpServletRequest request)throws Exception{return AppointmentCommandProof.response(service.attend(AppointmentCommandProof.command(request,secrets,"attendAppointment",key,input),BusinessValues.id(appointmentId),input.verification_reference));}
}
