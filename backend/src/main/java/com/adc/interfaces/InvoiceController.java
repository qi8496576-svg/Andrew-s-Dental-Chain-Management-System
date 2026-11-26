package com.adc.interfaces;
import com.adc.application.InvoiceService;
import com.adc.domain.shared.*;
import com.adc.identity.AuthSecrets;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1")
public class InvoiceController {
    private final InvoiceService service;private final AuthSecrets secrets;
    public InvoiceController(InvoiceService service,AuthSecrets secrets){this.service=service;this.secrets=secrets;}
    @PostMapping("/appointments/{appointmentId}/invoice")public org.springframework.http.ResponseEntity<Map<String,Object>> issue(@PathVariable String appointmentId,@RequestHeader("Idempotency-Key")String key,@RequestBody(required=false)Map<String,Object> body,HttpServletRequest request)throws Exception{if(body!=null && !body.isEmpty())throw new DomainFailure(400,"INVALID_REQUEST");return AppointmentCommandProof.response(service.issue(AppointmentCommandProof.command(request,secrets,"invoiceAppointment",key,Map.of()),BusinessValues.id(appointmentId)));}
    @GetMapping("/appointments/{appointmentId}/fee-preview")public org.springframework.http.ResponseEntity<Map<String,Object>> preview(@PathVariable String appointmentId,HttpServletRequest request){var proof=RequestProof.from(request);return AppointmentCommandProof.response(service.preview(proof.token(),proof.client(),BusinessValues.id(appointmentId),RequestProof.requestId(request)));}
    @GetMapping("/invoices/{invoiceId}")public org.springframework.http.ResponseEntity<Map<String,Object>> get(@PathVariable String invoiceId,HttpServletRequest request){var proof=RequestProof.from(request);return AppointmentCommandProof.response(service.get(proof.token(),proof.client(),BusinessValues.id(invoiceId),RequestProof.requestId(request)));}
}
