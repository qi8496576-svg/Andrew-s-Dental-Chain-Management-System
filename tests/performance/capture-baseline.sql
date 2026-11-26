-- Read-only capture in a dedicated synthetic benchmark database; contains no patient details.
SELECT JSON_OBJECT(
  'kind','adc-q03-real-mysql-counts',
  'server_uuid',@@server_uuid,
  'observed_at_utc',DATE_FORMAT(UTC_TIMESTAMP(6),'%Y-%m-%dT%H:%i:%s.%fZ'),
  'clinics',(SELECT COUNT(*) FROM adc_business.Clinic),
  'dentists',(SELECT COUNT(*) FROM adc_business.Dentist),
  'patients',(SELECT COUNT(*) FROM adc_business.Patient),
  'appointments',(SELECT COUNT(*) FROM adc_business.Appointment),
  'applied_treatments',(SELECT COUNT(*) FROM adc_business.AppliedTreatment)
);
