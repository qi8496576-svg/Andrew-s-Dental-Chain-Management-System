#!/bin/bash
# Owner-authorized direct-registration change. Existing schema and database volume stay in place.
set -euo pipefail
umask 077
release=${1:?candidate release required}
[[ "$release" =~ ^adc-cloud-20261124-[0-9]+$ ]] || exit 2
runtime=/opt/andrew-dental/private/IntegrationRuntime
target=/opt/andrew-dental/releases/$release
project=adc-isolated-loopback
python3 "$target/ops/scripts/verify-candidate.py" "$target/candidate.json"
test -s "$runtime/runtime.env"
before=$(docker inspect --format '{{.Id}}' "$project-mysql-1")
backup=/opt/andrew-dental/private/PreDomainBackups/$release
mkdir "$backup"
docker exec "$project-mysql-1" sh -ec 'MYSQL_PWD="$(cat /run/secrets/mysql_root_password)" exec mysqldump --user=root --single-transaction --source-data=2 --set-gtid-purged=OFF --hex-blob --routines --events --triggers --no-tablespaces --databases adc_business adc_identity adc_audit' | gzip > "$backup/full.sql.gz"
gzip -t "$backup/full.sql.gz"
sha256sum "$backup/full.sql.gz" > "$backup/full.sha256"
python3 - "$target/candidate.json" "$runtime/runtime.env" <<'PY'
import json,sys
from pathlib import Path
candidate=json.load(open(sys.argv[1]));file=Path(sys.argv[2]);text=file.read_text()
backup=file.with_name('runtime.env.before-'+candidate['release'])
with backup.open('x') as stream:stream.write(text)
replacements={'ADC_BACKEND_IMAGE':candidate['images'][0]['id'],'ADC_ADMIN_IMAGE':candidate['images'][1]['id']}
for key in replacements:assert sum(line.startswith(key+'=') for line in text.splitlines())==1
file.write_text('\n'.join(line.split('=',1)[0]+'='+replacements[line.split('=',1)[0]] if line.split('=',1)[0] in replacements else line for line in text.splitlines())+'\n')
PY
set -a; . "$runtime/runtime.env"; set +a
if ! docker compose --project-name "$project" -f "$target/ops/compose/compose.prod.yaml" -f "$target/ops/compose/compose.offline.yaml" up -d --no-deps --no-build --pull never --wait --wait-timeout 120 backend admin </dev/null; then
    cp "$runtime/runtime.env.before-$release" "$runtime/runtime.env"
    set -a; . "$runtime/runtime.env"; set +a
    docker compose --project-name "$project" -f "$target/ops/compose/compose.prod.yaml" -f "$target/ops/compose/compose.offline.yaml" up -d --no-deps --no-build --pull never --wait --wait-timeout 120 backend admin </dev/null
    echo 'Application update failed; previous images restored, database preserved' >&2
    exit 1
fi
test "$before" = "$(docker inspect --format '{{.Id}}' "$project-mysql-1")"
printf '%s\n' "$release" > "$runtime/release"
echo 'Applications healthy; exact database container preserved; no migration executed'
