#!/bin/bash
# Resume after a successfully verified V201; never repeats migration or backup.
set -euo pipefail
umask 077
release=${1:?candidate required}
[[ "$release" =~ ^adc-billing-20261125-[0-9]+$ ]] || exit 2
target=/opt/andrew-dental/releases/$release
runtime=/opt/andrew-dental/private/IntegrationRuntime
backup=/opt/andrew-dental/private/BillingBackups/$release
test -s "$backup/full.sql.gz";gzip -t "$backup/full.sql.gz"
grep -q 'Successfully applied 1 migration' "$backup/migration.log"
backend=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["images"][0]["id"])' "$target/candidate.json")
admin=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["images"][1]["id"])' "$target/candidate.json")
set -a;. "$runtime/runtime.env";set +a
export ADC_BACKEND_IMAGE=$backend ADC_ADMIN_IMAGE=$admin ADC_DEMO_PAYMENTS_ENABLED=true ADC_DEMO_PAYMENTS_CLINICS=CLOUD-TEST-C1
compose=(docker compose --project-name adc-isolated-loopback -f "$target/ops/compose/compose.prod.yaml" -f "$target/ops/compose/compose.offline.yaml")
"${compose[@]}" config --quiet < /dev/null
"${compose[@]}" up -d --no-deps --no-build --pull never --wait --wait-timeout 180 backend admin < /dev/null > "$backup/application-start.log" 2>&1
test "$(curl --silent --show-error --resolve andrewdental.cn:443:127.0.0.1 --output /dev/null --write-out '%{http_code}' https://andrewdental.cn/)" = 200
test "$(curl --silent --show-error --resolve andrewdental.cn:443:127.0.0.1 --output /dev/null --write-out '%{http_code}' https://andrewdental.cn/api/v1/me)" = 401
python3 - "$backup/before.json" "$runtime/runtime.env" "$backend" "$admin" <<'PY'
import json,sys,subprocess,pathlib
before=json.load(open(sys.argv[1]));old=next(x for x in before if x['name']=='/adc-isolated-loopback-mysql-1');now=json.loads(subprocess.check_output(['docker','inspect','adc-isolated-loopback-mysql-1']))[0];assert old['id']==now['Id'];assert old['mounts']==[{'name':m.get('Name'),'source':m['Source'],'destination':m['Destination']} for m in now['Mounts']]
p=pathlib.Path(sys.argv[2]);values={'ADC_BACKEND_IMAGE':sys.argv[3],'ADC_ADMIN_IMAGE':sys.argv[4],'ADC_DEMO_PAYMENTS_ENABLED':'true','ADC_DEMO_PAYMENTS_CLINICS':'CLOUD-TEST-C1'};lines=[line for line in p.read_text().splitlines() if line.split('=',1)[0] not in values];lines.extend(k+'='+v for k,v in values.items());q=p.with_suffix('.pending');q.write_text('\n'.join(lines)+'\n');q.chmod(0o600);q.replace(p)
PY
printf '%s\n' "$release" > "$runtime/release"
printf 'Billing integration healthy: %s; original database container and volume preserved; DEMO only\n' "$release"
