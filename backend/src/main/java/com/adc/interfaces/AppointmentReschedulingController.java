package com.adc.interfaces;
import com.adc.application.AppointmentReschedulingService;
import com.adc.domain.shared.*;
import com.adc.identity.AuthSecrets;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/appointments")
public class AppointmentReschedulingController {
    private final AppointmentReschedulingService service;private final AuthSecrets secrets;
    public AppointmentReschedulingController(AppointmentReschedulingService service,AuthSecrets secrets){this.service=service;this.secrets=secrets;}
    private static String text(java.util.Map<String,Object> input,String key,boolean required){Object value=input.get(key);if(value==null && !required)return null;if(!(value instanceof String text) || text.isBlank())throw new DomainFailure(400,"INVALID_REQUEST");return text;}
    @PostMapping("/{appointmentId}/reschedule")public org.springframework.http.ResponseEntity<java.util.Map<String,Object>> reschedule(@PathVariable String appointmentId,@RequestHeader("Idempotency-Key")String key,@RequestBody java.util.Map<String,Object> input,HttpServletRequest request)throws Exception{
        if(!java.util.Set.of("action","reason","verification_reference","new_clinic_id","new_schedule_id","new_scheduled_at").containsAll(input.keySet()))throw new DomainFailure(400,"INVALID_REQUEST");String action=text(input,"action",true);if(action.equals("CLINIC_CANCEL") && java.util.List.of("new_clinic_id","new_schedule_id","new_scheduled_at").stream().anyMatch(input::containsKey))throw new DomainFailure(422,"CLINIC_CANCEL_TARGET_FORBIDDEN");boolean target=action.equals("RESCHEDULE");String clinic=text(input,"new_clinic_id",target),schedule=text(input,"new_schedule_id",target),at=text(input,"new_scheduled_at",target);
        return AppointmentCommandProof.response(service.reschedule(AppointmentCommandProof.command(request,secrets,"rescheduleAppointment",key,input),BusinessValues.id(appointmentId),new AppointmentReschedulingService.Choice(action,text(input,"reason",true),text(input,"verification_reference",true),clinic==null?null:BusinessValues.id(clinic),schedule==null?null:BusinessValues.id(schedule),at==null?null:BusinessTime.timestamp(at))));
    }
}
