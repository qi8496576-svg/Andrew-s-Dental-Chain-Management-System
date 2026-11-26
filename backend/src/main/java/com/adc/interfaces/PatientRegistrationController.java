package com.adc.interfaces;

import com.adc.application.PatientRegistrationService;
import com.adc.domain.shared.BusinessValues;
import com.adc.identity.AuthSecrets;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/me/patient-registration")
public class PatientRegistrationController {
    private final PatientRegistrationService service;private final AuthSecrets secrets;
    public PatientRegistrationController(PatientRegistrationService service,AuthSecrets secrets){this.service=service;this.secrets=secrets;}
    public record Registration(String clinic_id,String full_name,LocalDate date_of_birth,String phone,String billing_address,String email,String emergency_contact_name,String emergency_contact_phone,String allergy_statement,String allergy_note,Boolean consent){}
    @PostMapping public ResponseEntity<Map<String,Object>> register(@RequestHeader("Idempotency-Key")String key,@RequestBody Registration input,HttpServletRequest request)throws Exception{
        var details=new LinkedHashMap<String,Object>();details.put("full_name",input.full_name);details.put("date_of_birth",input.date_of_birth==null?null:input.date_of_birth.toString());details.put("phone",input.phone);details.put("billing_address",input.billing_address);details.put("email",input.email);details.put("emergency_contact_name",input.emergency_contact_name);details.put("emergency_contact_phone",input.emergency_contact_phone);
        return AppointmentCommandProof.response(service.register(AppointmentCommandProof.command(request,secrets,"registerSelfPatient",key,input),BusinessValues.id(input.clinic_id),details,input.allergy_statement,input.allergy_note,Boolean.TRUE.equals(input.consent)));
    }
}
