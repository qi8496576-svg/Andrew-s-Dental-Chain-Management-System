#!/bin/bash
# Update only the web application image. No migrations or database recreation.
set -euo pipefail
umask 077
release=${1:?release required}
[[ "$release" =~ ^adc-admin-[0-9]{8}-[0-9]+$ ]] || exit 2
incoming=/home/ubuntu/adc-upload/$release
target=/opt/andrew-dental/releases/$release
runtime=/opt/andrew-dental/private/IntegrationRuntime
test ! -e "$target"
python3 - "$incoming" <<'PY'
import hashlib,json,sys,pathlib
root=pathlib.Path(sys.argv[1]).resolve();m=json.loads((root/'candidate.json').read_text())
assert m['frontend_only'] and not m['contains_secrets']
for item in m['files']+[{'path':'images.tar.gz','sha256':m['archive']['sha256']}]:
 p=(root/item['path']).resolve();assert p.is_relative_to(root) and p.is_file()
 assert hashlib.file_digest(p.open('rb'),'sha256').hexdigest()==item['sha256']
PY
mkdir "$target"
cp -a "$incoming/." "$target/"
gzip -dc "$target/images.tar.gz" | docker load >/dev/null
python3 - "$target/candidate.json" <<'PY'
import json,subprocess,sys
m=json.load(open(sys.argv[1]));a=json.loads(subprocess.check_output(['docker','image','inspect',m['image']['reference']],text=True))[0]
assert a['Id']==m['image']['id'] and a['Os']=='linux' and a['Architecture']=='amd64'
PY
before=$(docker inspect --format '{{.Id}}' adc-isolated-loopback-mysql-1 adc-isolated-loopback-backend-1)
cp "$runtime/runtime.env" "$runtime/runtime.env.before-$release"
cp "$runtime/release" "$target/previous-release"
python3 - "$target/candidate.json" "$runtime/runtime.env" <<'PY'
import json,pathlib,sys
m=json.load(open(sys.argv[1]));p=pathlib.Path(sys.argv[2]);lines=p.read_text().splitlines()
assert sum(x.startswith('ADC_ADMIN_IMAGE=') for x in lines)==1
p.write_text('\n'.join('ADC_ADMIN_IMAGE='+m['image']['id'] if x.startswith('ADC_ADMIN_IMAGE=') else x for x in lines)+'\n')
PY
set -a; . "$runtime/runtime.env"; set +a
if ! docker compose --project-name adc-isolated-loopback -f "$target/ops/compose/compose.prod.yaml" -f "$target/ops/compose/compose.offline.yaml" up -d --no-deps --no-build --pull never --wait --wait-timeout 120 admin </dev/null; then
 cp "$runtime/runtime.env.before-$release" "$runtime/runtime.env"
 set -a; . "$runtime/runtime.env"; set +a
 docker compose --project-name adc-isolated-loopback -f "$target/ops/compose/compose.prod.yaml" -f "$target/ops/compose/compose.offline.yaml" up -d --no-deps --no-build --pull never --wait admin </dev/null
 exit 1
fi
test "$before" = "$(docker inspect --format '{{.Id}}' adc-isolated-loopback-mysql-1 adc-isolated-loopback-backend-1)"
printf '%s\n' "$release" > "$runtime/release"
echo 'Web application updated; backend and database containers preserved'
