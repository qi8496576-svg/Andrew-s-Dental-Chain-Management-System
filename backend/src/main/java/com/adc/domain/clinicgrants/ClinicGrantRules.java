package com.adc.domain.clinicgrants;

import com.adc.domain.shared.DomainFailure;
import java.util.*;

/** Versioned operation capability registry; no dynamic roles or implicit wildcard access. */
public final class ClinicGrantRules {
    private ClinicGrantRules(){ }
    private static final Map<String,Set<String>> CAPABILITIES=Map.of(
        "HEADQUARTERS",Set.of("account.manage","authorization.manage","resource.read","resource.write","analysis.read","cost.verify","performance.calculate","performance.publish","sensitive.drilldown","audit.read","correctTreatmentPrice","getInvoice","billing.read","billing.pay","billing.refund"),
        "RECEPTION",Set.of("searchAppointmentCandidates","listAppointments","createAppointment","getAppointment","attendAppointment","cancelAppointment","markNoShow","rescheduleAppointment","listSchedules","createSchedule","suspendSchedule","createPatient","getPatient","updatePatient","reviewPatientAllergies","addPatientAllergy","listPatientAllergies","correctPatientAllergy","retractPatientAllergy","listBindingRequests","approvePatientBinding","rebindPatient","revokePatientBinding"),
        "DENTIST",Set.of("listAppointments","getAppointment","completeAppointment","updateClinicalNotes","recordAppliedTreatment","getClinicalContext","getAppliedTreatment"),
        "CASHIER",Set.of("listAppointments","getAppointment","invoiceAppointment","getInvoice","billing.read","billing.pay","billing.refund"));
    public static void capabilities(String role,Set<String> capabilities) {
        if(!CAPABILITIES.containsKey(role) || capabilities==null || !CAPABILITIES.get(role).containsAll(capabilities))throw new DomainFailure(400,"INVALID_REQUEST");
    }
}

