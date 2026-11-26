#!/bin/bash
# Owner-approved incremental V201, synthetic demo clinic only. No real payment provider.
set -euo pipefail
umask 077
release=${1:?billing candidate required}
[[ "$release" =~ ^adc-billing-20261125-[0-9]+$ ]] || exit 2
incoming=/home/ubuntu/adc-upload/$release
target=/opt/andrew-dental/releases/$release
runtime=/opt/andrew-dental/private/IntegrationRuntime
project=adc-isolated-loopback
test -s "$runtime/runtime.env"
test ! -e "$target"
python3 - "$incoming" <<'PY'
import json,hashlib,sys,pathlib
r=pathlib.Path(sys.argv[1]);m=json.loads((r/'candidate.json').read_text());assert m['contains_secrets'] is False
for f in [*m['files'],{'path':'images.tar.gz','sha256':m['archive']['sha256']}]:
 p=r/f['path'];assert p.resolve().is_relative_to(r.resolve());h=hashlib.sha256()
 with p.open('rb') as stream:
  for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
 assert h.hexdigest()==f['sha256'],f['path']
PY
mkdir "$target";cp -a "$incoming/." "$target/"
gzip -dc "$target/images.tar.gz" | docker load >/dev/null
backend=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["images"][0]["id"])' "$target/candidate.json")
admin=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["images"][1]["id"])' "$target/candidate.json")
docker image inspect "$backend" "$admin" >/dev/null
backup=/opt/andrew-dental/private/BillingBackups/$release
mkdir -p "$backup";chmod 0700 "$backup"
cp "$runtime/runtime.env" "$backup/runtime.env"
cp "$runtime/release" "$backup/release"
docker inspect "$project-mysql-1" "$project-backend-1" "$project-admin-1" | python3 -c 'import sys,json;print(json.dumps([{ "name":c["Name"],"id":c["Id"],"image":c["Image"],"mounts":[{"name":m.get("Name"),"source":m["Source"],"destination":m["Destination"]} for m in c["Mounts"]]} for c in json.load(sys.stdin)],indent=2))' > "$backup/before.json"
test "$(docker inspect --format '{{.State.Health.Status}}' "$project-mysql-1")" = healthy
docker stop --time 30 "$project-backend-1" >/dev/null
trap 'docker start "adc-isolated-loopback-backend-1" >/dev/null 2>&1 || true' ERR
docker exec "$project-mysql-1" sh -ec 'MYSQL_PWD="$(cat /run/secrets/mysql_root_password)" exec mysqldump --user=root --single-transaction --source-data=2 --set-gtid-purged=OFF --hex-blob --routines --events --triggers --no-tablespaces --databases adc_business adc_identity adc_audit' | gzip > "$backup/full.sql.gz"
gzip -t "$backup/full.sql.gz";sha256sum "$backup/full.sql.gz" > "$backup/full.sha256"
set -a;. "$runtime/runtime.env";set +a
export ADC_BACKEND_IMAGE=$backend ADC_ADMIN_IMAGE=$admin ADC_DEMO_PAYMENTS_ENABLED=true ADC_DEMO_PAYMENTS_CLINICS=CLOUD-TEST-C1
compose=(docker compose --project-name "$project" -f "$target/ops/compose/compose.prod.yaml" -f "$target/ops/compose/compose.offline.yaml")
"${compose[@]}" config --quiet
"${compose[@]}" run --rm --no-deps --interactive=false --pull never migrator < /dev/null > "$backup/migration.log" 2>&1
"${compose[@]}" up -d --no-deps --no-build --pull never --wait --wait-timeout 180 backend admin < /dev/null > "$backup/application-start.log" 2>&1
test "$(curl --silent --show-error --resolve andrewdental.cn:443:127.0.0.1 --output /dev/null --write-out '%{http_code}' https://andrewdental.cn/)" = 200
test "$(curl --silent --show-error --resolve andrewdental.cn:443:127.0.0.1 --output /dev/null --write-out '%{http_code}' https://andrewdental.cn/api/v1/me)" = 401
python3 - "$backup/before.json" <<'PY'
import json,sys,subprocess
before=json.load(open(sys.argv[1]));old=next(x for x in before if x['name']=='/adc-isolated-loopback-mysql-1');now=json.loads(subprocess.check_output(['docker','inspect','adc-isolated-loopback-mysql-1']))[0]
assert old['id']==now['Id'];assert old['mounts']==[{'name':m.get('Name'),'source':m['Source'],'destination':m['Destination']} for m in now['Mounts']]
PY
python3 - "$runtime/runtime.env" "$backend" "$admin" <<'PY'
import sys,pathlib
p=pathlib.Path(sys.argv[1]);values={'ADC_BACKEND_IMAGE':sys.argv[2],'ADC_ADMIN_IMAGE':sys.argv[3],'ADC_DEMO_PAYMENTS_ENABLED':'true','ADC_DEMO_PAYMENTS_CLINICS':'CLOUD-TEST-C1'};lines=[]
for line in p.read_text().splitlines():
 key=line.split('=',1)[0]
 if key not in values:lines.append(line)
lines.extend(k+'='+v for k,v in values.items());q=p.with_suffix('.pending');q.write_text('\n'.join(lines)+'\n');q.chmod(0o600);q.replace(p)
PY
printf '%s\n' "$release" > "$runtime/release"
trap - ERR
printf 'Billing integration activated: %s; same database container and volume; DEMO only\n' "$release"
