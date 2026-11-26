import type { components } from '@adc/contracts'
/** Read-only projections documented in packages/contracts/review/workspace-review-20261123.json. */
export type AppointmentSummary = components['schemas']['AppointmentView'] & {
  patient_name?: string; patient_number?: string; dentist_name?: string; clinic_name?: string; requested_treatments?: string
}
export interface FeePreview {
  appointment_id: string; patient_name: string; patient_number: string; clinic_name: string;
  items: {treatment_name: string; standard_units: string; unit_price: string; subtotal: string}[];
  total_amount: string
}
