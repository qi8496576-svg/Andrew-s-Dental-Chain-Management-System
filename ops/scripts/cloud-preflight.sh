#!/bin/bash
# Read-only inspection. Never print environment values or database credentials.
set -euo pipefail
python3 - <<'PY'
import datetime,json,subprocess
def run(args):return subprocess.check_output(args,text=True).strip()
rows=[json.loads(line) for line in run(['docker','ps','-a','--filter','label=com.docker.compose.project=adc-isolated-loopback','--format','{{json .}}']).splitlines()]
sql="""SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='adc_business';
SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='adc_business';
SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA='adc_business';
SELECT COUNT(*) FROM adc_identity.flyway_schema_history WHERE success=1 AND type='SQL';
SELECT COUNT(*) FROM adc_business.Clinic;
SELECT COUNT(*) FROM adc_business.Patient;
SELECT COUNT(*) FROM adc_identity.StaffAccount;
SELECT COUNT(*) FROM adc_identity.AccessGrant;
SELECT version,checksum FROM adc_identity.flyway_schema_history WHERE success=1 AND type='SQL' ORDER BY installed_rank;"""
result=subprocess.run(['docker','exec','-i','adc-isolated-loopback-mysql-1','sh','-ec','MYSQL_PWD="$(cat /run/secrets/mysql_root_password)" exec mysql --user=root --batch --skip-column-names'],input=sql,text=True,capture_output=True,check=True).stdout.strip().splitlines()
keys=['business_tables','business_columns','business_foreign_keys','migrations','clinics','patients','staff_accounts','grants']
report={'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'kind':'read-only-preflight','containers':[{'name':r['Names'],'image':r['Image'],'state':r['Status'],'ports':r['Ports']} for r in rows],'database':dict(zip(keys,map(int,result[:8]))),'migration_fingerprints':result[8:],'listeners':run(['ss','-ltnH']),'certificate_files':run(['find','/opt/andrew-dental/private','-maxdepth','4','-type','f','-name','*.crt'])}
assert [report['database'][key] for key in keys[:4]] in ([19,163,30,33],[24,209,44,34])
print(json.dumps(report,ensure_ascii=False,indent=2))
PY
