#!/bin/bash
# Application-only correction. Existing database, volume, migrations and TLS remain in place.
set -euo pipefail
umask 077
release=${1:?release required}
[[ "$release" =~ ^adc-billing-fix-20261125-[0-9]+$ ]] || exit 2
upload=/home/ubuntu/adc-upload/$release
target=/opt/andrew-dental/releases/$release
runtime=/opt/andrew-dental/private/IntegrationRuntime
test ! -e "$target"
python3 - "$upload" <<'PY'
import pathlib,json,hashlib,sys
p=pathlib.Path(sys.argv[1]);m=json.loads((p/'candidate.json').read_text());assert m['application_only'] is True
for x in [m['archive']]+m['files']:
 f=(p/x.get('path',x.get('file'))).resolve();assert p.resolve() in f.parents
 assert hashlib.file_digest(f.open('rb'),'sha256').hexdigest()==x['sha256']
PY
install -d -m 750 "$target"
cp -a "$upload/." "$target/"
docker inspect adc-isolated-loopback-mysql-1 > "$target/database-container-before.json"
docker load --input "$target/images.tar.gz" > "$target/image-load.log"
set -a;. "$runtime/runtime.env";set +a
backend=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["images"][0]["id"])' "$target/candidate.json")
admin=$ADC_ADMIN_IMAGE
export ADC_BACKEND_IMAGE=$backend
compose=(docker compose --project-name adc-isolated-loopback -f "$target/ops/compose/compose.prod.yaml" -f "$target/ops/compose/compose.offline.yaml")
"${compose[@]}" config --quiet < /dev/null
"${compose[@]}" up -d --no-deps --no-build --pull never --wait --wait-timeout 180 backend < /dev/null > "$target/application-start.log" 2>&1
test "$(curl --silent --show-error --resolve andrewdental.cn:443:127.0.0.1 --output /dev/null --write-out '%{http_code}' https://andrewdental.cn/)" = 200
test "$(curl --silent --show-error --resolve andrewdental.cn:443:127.0.0.1 --output /dev/null --write-out '%{http_code}' https://andrewdental.cn/api/v1/me)" = 401
python3 - "$target/database-container-before.json" "$runtime/runtime.env" "$backend" <<'PY'
import json,sys,subprocess,pathlib
b=json.load(open(sys.argv[1]))[0];a=json.loads(subprocess.check_output(['docker','inspect','adc-isolated-loopback-mysql-1']))[0];assert b['Id']==a['Id'];assert b['Mounts']==a['Mounts']
p=pathlib.Path(sys.argv[2]);lines=[x for x in p.read_text().splitlines() if not x.startswith('ADC_BACKEND_IMAGE=')];lines.append('ADC_BACKEND_IMAGE='+sys.argv[3]);q=p.with_suffix('.pending');q.write_text('\n'.join(lines)+'\n');q.chmod(0o600);q.replace(p)
PY
printf '%s\n' "$release" > "$runtime/release"
printf 'Application update healthy: %s; database container and volume unchanged; no migrations executed\n' "$release"
