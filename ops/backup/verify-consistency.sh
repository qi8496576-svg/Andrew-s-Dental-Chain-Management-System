#!/bin/bash
set -euo pipefail
[[ $# == 1 && "$1" == /* && -f "$1" && ! -L "$1" ]] || exit 2
result=$(mysql --defaults-extra-file="$1" --batch --skip-column-names <<'SQL'
SELECT IF((SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='adc_business')=24,0,1);
SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='adc_business')=209,0,1);
SELECT IF((SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA='adc_business')=44,0,1);
SELECT IF((SELECT COUNT(*) FROM adc_identity.flyway_schema_history WHERE success=1 AND type='SQL')=34,0,1);
SELECT COUNT(*) FROM adc_business.AppliedTreatment WHERE subtotal<>ROUND(standard_units*unit_price,2);
SELECT COUNT(*) FROM adc_business.Invoice i WHERE i.total_amount<>(SELECT COALESCE(SUM(x.subtotal),0) FROM adc_business.InvoiceItem x WHERE x.invoice_id=i.invoice_id);
SELECT COUNT(*) FROM adc_business.InvoiceItem x JOIN adc_business.Invoice i ON i.invoice_id=x.invoice_id JOIN adc_business.AppliedTreatment a ON a.applied_treatment_id=x.applied_treatment_id WHERE a.appointment_id<>i.appointment_id;
SELECT COUNT(*) FROM adc_business.Appointment a WHERE (a.status='INVOICED')<>(EXISTS(SELECT 1 FROM adc_business.Invoice i WHERE i.appointment_id=a.appointment_id));
SELECT COUNT(*) FROM (SELECT dentist_id,quarter_start,quarter_end FROM adc_business.QuarterlyPerformance WHERE calculation_status='PUBLISHED' GROUP BY dentist_id,quarter_start,quarter_end HAVING COUNT(*)>1) x;
SELECT COUNT(*) FROM adc_business.QuarterlyPerformance WHERE calculation_status IN ('CALCULATED','PUBLISHED','SUPERSEDED') AND (net_profit<>revenue-medical_supply_cost-operating_expense OR incentive_amount<>ROUND(GREATEST(net_profit,0)*0.10,2));
SELECT COUNT(*) FROM adc_identity.CurrentPatientBinding b LEFT JOIN adc_business.Patient p ON b.patient_id=p.patient_id WHERE p.patient_id IS NULL;
SELECT COUNT(*) FROM adc_identity.GrantClinicScope g LEFT JOIN adc_business.Clinic c ON c.clinic_id=g.clinic_id WHERE c.clinic_id IS NULL;
SELECT COUNT(*) FROM adc_identity.StaffAccount s LEFT JOIN adc_business.Dentist d ON d.dentist_id=s.dentist_id WHERE s.dentist_id IS NOT NULL AND d.dentist_id IS NULL;
SELECT COUNT(*) FROM adc_business.PaymentOrder p JOIN adc_business.PatientBill b ON b.bill_id=p.bill_id WHERE p.amount_fen<>b.amount_fen OR (p.status='SUCCEEDED' AND b.status<>'PAID') OR (p.status='REFUNDED' AND b.status<>'REFUNDED');
SELECT COUNT(*) FROM adc_business.RefundOrder r JOIN adc_business.PaymentOrder p ON p.payment_id=r.payment_id WHERE r.amount_fen<>p.amount_fen OR p.status<>'REFUNDED';
SQL
)
[[ $(printf '%s\n' "$result" | wc -l) == 15 ]] || exit 1
if printf '%s\n' "$result" | grep -qv '^0$';then echo 'Recovery consistency check failed' >&2;exit 1;fi
printf 'PASS: 24 tables / 209 fields / 44 FKs / 34 migrations; 15 structure and business checks\n'
