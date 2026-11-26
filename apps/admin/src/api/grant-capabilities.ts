// UI choices from the server registry. Server-side validation remains authoritative.
export const grantCapabilities: Record<string, string[]> = {
  "HEADQUARTERS": [
    "account.manage",
    "authorization.manage",
    "resource.read",
    "resource.write",
    "analysis.read",
    "cost.verify",
    "performance.calculate",
    "performance.publish",
    "sensitive.drilldown",
    "audit.read",
    "correctTreatmentPrice",
    "getInvoice",
    "billing.read",
    "billing.pay",
    "billing.refund"
  ],
  "RECEPTION": [
    "searchAppointmentCandidates",
    "listAppointments",
    "createAppointment",
    "getAppointment",
    "attendAppointment",
    "cancelAppointment",
    "markNoShow",
    "rescheduleAppointment",
    "listSchedules",
    "createSchedule",
    "suspendSchedule",
    "createPatient",
    "getPatient",
    "updatePatient",
    "reviewPatientAllergies",
    "addPatientAllergy",
    "listPatientAllergies",
    "correctPatientAllergy",
    "retractPatientAllergy",
    "listBindingRequests",
    "approvePatientBinding",
    "rebindPatient",
    "revokePatientBinding"
  ],
  "DENTIST": [
    "listAppointments",
    "getAppointment",
    "completeAppointment",
    "updateClinicalNotes",
    "recordAppliedTreatment",
    "getClinicalContext",
    "getAppliedTreatment"
  ],
  "CASHIER": [
    "listAppointments",
    "getAppointment",
    "invoiceAppointment",
    "getInvoice",
    "billing.read",
    "billing.pay",
    "billing.refund"
  ]
}
