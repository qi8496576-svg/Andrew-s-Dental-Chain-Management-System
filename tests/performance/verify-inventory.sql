-- Read-only checks after generation in a dedicated synthetic MySQL instance.
SELECT JSON_OBJECT(
 'kind','adc-q03-inventory-checks',
 'business_tables',(SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='adc_business' AND table_type='BASE TABLE'),
 'business_columns',(SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='adc_business'),
 'business_foreign_keys',(SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema='adc_business' AND constraint_type='FOREIGN KEY'),
 'care_inventory',(SELECT COUNT(*) FROM adc_business.Appointment WHERE status='IN_PROGRESS'),
 'invoice_inventory',(SELECT COUNT(*) FROM adc_business.Appointment WHERE status='COMPLETED'),
 'preexisting_invoices',(SELECT COUNT(*) FROM adc_business.Invoice),
 'duplicate_occupied_slots',(SELECT COUNT(*) FROM (SELECT dentist_id,scheduled_at FROM adc_business.Appointment GROUP BY dentist_id,scheduled_at HAVING COUNT(*)>1) x),
 'ineligible_treatments',(SELECT COUNT(*) FROM adc_business.AppliedTreatment a
   JOIN adc_business.Appointment p ON p.appointment_id=a.appointment_id
   WHERE a.performed_at<p.attended_at OR a.subtotal<>ROUND(a.standard_units*a.unit_price,2)
   OR NOT EXISTS (SELECT 1 FROM adc_business.DentistClinicAssignment d WHERE d.dentist_id=a.dentist_id AND d.clinic_id=p.clinic_id AND d.is_active=1 AND d.start_date<=DATE(CONVERT_TZ(a.performed_at,'+00:00','+08:00')) AND (d.end_date IS NULL OR d.end_date>=DATE(CONVERT_TZ(a.performed_at,'+00:00','+08:00'))))
   OR EXISTS (SELECT 1 FROM adc_business.TreatmentQualification tq WHERE tq.treatment_id=a.treatment_id AND tq.is_mandatory=1 AND NOT EXISTS (SELECT 1 FROM adc_business.DentistQualification dq WHERE dq.dentist_id=a.dentist_id AND dq.qualification_id=tq.qualification_id AND dq.verification_status='VERIFIED' AND dq.granted_date<=DATE(CONVERT_TZ(a.performed_at,'+00:00','+08:00')) AND (dq.expiry_date IS NULL OR dq.expiry_date>=DATE(CONVERT_TZ(a.performed_at,'+00:00','+08:00')))))),
 'missing_state_events',(SELECT COUNT(*) FROM adc_business.Appointment a WHERE NOT EXISTS (SELECT 1 FROM adc_business.AppointmentEvent e WHERE e.appointment_id=a.appointment_id AND e.event_type='BOOK') OR NOT EXISTS (SELECT 1 FROM adc_business.AppointmentEvent e WHERE e.appointment_id=a.appointment_id AND e.event_type='ATTEND') OR (a.status='COMPLETED' AND NOT EXISTS (SELECT 1 FROM adc_business.AppointmentEvent e WHERE e.appointment_id=a.appointment_id AND e.event_type='COMPLETE')))
);
