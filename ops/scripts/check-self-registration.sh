#!/bin/bash
set -euo pipefail
new_patient=${1:?new patient ID required}
old_patient=${2:?original test patient ID required}
appointment=${3:?appointment ID required}
[[ "$new_patient" =~ ^[0-9]{1,19}$ && "$old_patient" =~ ^[0-9]{1,19}$ && "$appointment" =~ ^[0-9]{1,19}$ ]] || exit 2
docker exec -i adc-isolated-loopback-mysql-1 sh -ec 'MYSQL_PWD="$(cat /run/secrets/mysql_root_password)" exec mysql --user=root --batch --skip-column-names' <<SQL
SELECT JSON_OBJECT('business_tables',(SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='adc_business'),'business_columns',(SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='adc_business'),'new_current_bindings',(SELECT COUNT(*) FROM adc_identity.CurrentPatientBinding WHERE patient_id=$new_patient),'original_current_bindings',(SELECT COUNT(*) FROM adc_identity.CurrentPatientBinding WHERE patient_id=$old_patient),'original_subject_hash',(SELECT SHA2(subject_id,256) FROM adc_identity.CurrentPatientBinding WHERE patient_id=$old_patient),'allergy_status',(SELECT allergy_review_status FROM adc_business.Patient WHERE patient_id=$new_patient),'self_declarations',(SELECT COUNT(*) FROM adc_identity.BindingEvent WHERE patient_id=$new_patient AND action='BIND' AND JSON_UNQUOTE(JSON_EXTRACT(verification_basis,'$.method'))='SELF_DECLARED' AND JSON_EXTRACT(verification_basis,'$.person_confirmed')=false AND JSON_EXTRACT(verification_basis,'$.allergy_reviewed')=false),'appointment_status',(SELECT status FROM adc_business.Appointment WHERE appointment_id=$appointment AND patient_id=$new_patient),'appointment_events',(SELECT COUNT(*) FROM adc_business.AppointmentEvent WHERE appointment_id=$appointment));
SQL
