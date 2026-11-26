"""Render approved FK/ordinary UK and D22/technical single-row constraints.

Conditional uniqueness, cross-row facts and APP references stay in domain transactions.
Run before first application of V200 only; migrations are immutable after deployment.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
def read(path):
    return json.loads((ROOT / path).read_text('utf-8-sig'))
business = read('docs/diagrams/database/schema.json')
technical = read('specs/001-system-specification/technical-schema.json')['technical_tables']
unique = read('backend/src/test/resources/schema/unique-keys.json')
sql = ['-- D22-D24 / approved technical dictionary. No APP FKs or conditional global keys.']
def alter(table, name, clause):
    schema, table = table.split('.')
    sql.append(f'ALTER TABLE `{schema}`.`{table}` ADD CONSTRAINT `{name}` {clause};')
fk_count = 0
for table in business + technical:
    schema = table.get('schema', 'adc_business')
    for f in table['fields']:
        ref = f.get('foreign_key') if 'schema' in table else f.get('fk')
        if not ref:
            continue
        ref = ref.removeprefix('FK:')
        if schema == 'adc_business':
            ref = 'adc_business.' + ref
        target_schema, target, column = ref.split('.')
        alter(schema+'.'+table['name'], 'fk_'+table['name']+'_'+f['name'],
              f'FOREIGN KEY (`{f["name"]}`) REFERENCES `{target_schema}`.`{target}` (`{column}`) ON UPDATE RESTRICT ON DELETE RESTRICT')
        fk_count += 1
assert fk_count == 49
for table, keys in unique.items():
    for index, columns in enumerate(keys, 1):
        alter(table, 'uk_'+table.split('.')[1]+'_'+str(index),
              'UNIQUE ('+', '.join('`'+c+'`' for c in columns.split(','))+')')

checks = {
 'adc_business.Patient': ["allergy_review_status IN ('NOT_REVIEWED','NO_KNOWN','RECORDED')"],
 'adc_business.Dentist': ['termination_date IS NULL OR termination_date >= hire_date'],
 'adc_business.DentistQualification': ['expiry_date IS NULL OR expiry_date >= granted_date'],
 'adc_business.DentistSchedule': ["schedule_status IN ('NORMAL','SUSPENDED')",
    'end_time > start_time AND slot_minutes > 0 AND MOD(TIME_TO_SEC(end_time)-TIME_TO_SEC(start_time),slot_minutes*60)=0'],
 'adc_business.Appointment': ["status IN ('SCHEDULED','CANCELLED','IN_PROGRESS','COMPLETED','INVOICED')",
    "(status='CANCELLED' AND cancelled_at IS NOT NULL AND cancellation_reason IS NOT NULL AND CHAR_LENGTH(TRIM(cancellation_reason))>0 AND cancellation_kind IS NOT NULL AND cancellation_kind IN ('PATIENT_CANCEL','NO_SHOW','CLINIC_RESCHEDULE','CLINIC_CANCEL') AND attended_at IS NULL AND completed_at IS NULL) OR (status<>'CANCELLED' AND cancelled_at IS NULL AND cancellation_reason IS NULL AND cancellation_kind IS NULL AND ((status='SCHEDULED' AND attended_at IS NULL AND completed_at IS NULL) OR (status='IN_PROGRESS' AND attended_at IS NOT NULL AND completed_at IS NULL) OR (status IN ('COMPLETED','INVOICED') AND attended_at IS NOT NULL AND completed_at IS NOT NULL)))"],
 'adc_business.AppliedTreatment': ['standard_units>0 AND unit_price>=0 AND subtotal=ROUND(standard_units*unit_price,2)'],
 'adc_business.InvoiceItem': ['line_number>0 AND standard_units>0 AND unit_price>=0 AND subtotal=ROUND(standard_units*unit_price,2)'],
 'adc_business.CostEntry': ["cost_type IN ('MEDICAL_SUPPLY','OPERATING')", '(reversal_of_id IS NULL AND amount>=0) OR (reversal_of_id IS NOT NULL AND amount<0)'],
 'adc_business.QuarterlyPerformance': ['calculation_version>0 AND quarter_end>quarter_start AND incentive_rate=0.1000',
    "calculation_status IN ('DRAFT','INCOMPLETE','CALCULATED','PUBLISHED','SUPERSEDED')",
    '(net_profit IS NULL OR revenue IS NULL OR medical_supply_cost IS NULL OR operating_expense IS NULL OR net_profit=revenue-medical_supply_cost-operating_expense) AND (incentive_amount IS NULL OR net_profit IS NULL OR incentive_amount=ROUND(GREATEST(net_profit,0)*incentive_rate,2))',
    "calculation_status NOT IN ('CALCULATED','PUBLISHED','SUPERSEDED') OR (revenue IS NOT NULL AND medical_supply_cost IS NOT NULL AND operating_expense IS NOT NULL AND net_profit IS NOT NULL AND incentive_amount IS NOT NULL)",
    "calculation_status NOT IN ('PUBLISHED','SUPERSEDED') OR published_at IS NOT NULL"],
 'adc_business.AppointmentEvent': ["(event_type='BOOK' AND from_status IS NULL AND to_status='SCHEDULED') OR (from_status IS NOT NULL AND ((event_type='ATTEND' AND from_status='SCHEDULED' AND to_status='IN_PROGRESS') OR (event_type='CANCEL' AND from_status='SCHEDULED' AND to_status='CANCELLED') OR (event_type='COMPLETE' AND from_status='IN_PROGRESS' AND to_status='COMPLETED') OR (event_type='INVOICE' AND from_status='COMPLETED' AND to_status='INVOICED')))"],
 'adc_identity.Subject': ["subject_type IN ('PATIENT','STAFF','SYSTEM')", 'is_enabled IN (0,1)'],
 'adc_identity.ExternalIdentity': ["provider='WECHAT_MINIPROGRAM'"],
 'adc_identity.Session': ["client_type IN ('WEB','WECHAT') AND (client_type<>'WEB' OR csrf_secret_hash IS NOT NULL)"],
 'adc_identity.LoginThrottle': ['consecutive_failures>=0'],
 'adc_identity.BindingRequest': ["status IN ('PENDING','APPROVED')", "(status='PENDING' AND candidate_patient_id IS NULL AND reviewed_by IS NULL AND reviewed_at IS NULL AND verification_basis IS NULL) OR (status='APPROVED' AND candidate_patient_id IS NOT NULL AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND verification_basis IS NOT NULL)"],
 'adc_identity.BindingEvent': ["(action='BIND' AND old_subject_id IS NULL AND new_subject_id IS NOT NULL AND binding_request_id IS NOT NULL) OR (action='REBIND' AND old_subject_id IS NOT NULL AND new_subject_id IS NOT NULL AND old_subject_id<>new_subject_id AND binding_request_id IS NOT NULL) OR (action='UNBIND' AND old_subject_id IS NOT NULL AND new_subject_id IS NULL)"],
 'adc_identity.AccessGrant': ["role_code IN ('RECEPTION','DENTIST','CASHIER','HEADQUARTERS')", 'valid_until IS NULL OR valid_until>valid_from', '(revoked_at IS NULL AND revoked_by IS NULL) OR (revoked_at IS NOT NULL AND revoked_by IS NOT NULL)'],
}
for table, rules in checks.items():
    for i, rule in enumerate(rules, 1):
        alter(table, 'ck_'+table.split('.')[1]+'_'+str(i), 'CHECK ('+rule+')')
path = ROOT/'backend/src/main/resources/db/migration/V200__add_constraints.sql'
content = '\n'.join(sql)+'\n'
if path.exists() and path.read_text('utf-8') != content:
    raise RuntimeError('Refusing to overwrite an existing edited V200 migration')
path.write_text(content, encoding='utf-8', newline='\n')
print(f'V200: {fk_count} FKs, {sum(map(len, unique.values()))} ordinary UKs, {sum(map(len, checks.values()))} CHECKs')
