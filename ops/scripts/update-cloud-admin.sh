#!/bin/bash
# Frontend-only correction after initial activation. Never touches backend or database.
set -euo pipefail
umask 077
release=${1:?candidate release required}
[[ "$release" =~ ^adc-cloud-20261124-[0-9]+$ ]] || exit 2
runtime=/opt/andrew-dental/private/IntegrationRuntime
target=/opt/andrew-dental/releases/$release
python3 "$target/ops/scripts/verify-candidate.py" "$target/candidate.json"
test -s "$runtime/runtime.env"
before=$(docker inspect --format '{{.Id}}' adc-isolated-loopback-mysql-1 adc-isolated-loopback-backend-1)
python3 - "$target/candidate.json" "$runtime/runtime.env" <<'PY'
import json,sys,subprocess
from pathlib import Path
candidate=json.load(open(sys.argv[1]));file=Path(sys.argv[2]);text=file.read_text()
current_backend=subprocess.check_output(['docker','inspect','--format','{{.Image}}','adc-isolated-loopback-backend-1'],text=True).strip()
assert current_backend==candidate['images'][0]['id'],'Unexpected backend change'
backup=file.with_name('runtime.env.before-'+candidate['release'])
with backup.open('x') as stream:stream.write(text)
lines=text.splitlines();assert sum(line.startswith('ADC_ADMIN_IMAGE=') for line in lines)==1
file.write_text('\n'.join('ADC_ADMIN_IMAGE='+candidate['images'][1]['id'] if line.startswith('ADC_ADMIN_IMAGE=') else line for line in lines)+'\n')
PY
set -a; . "$runtime/runtime.env"; set +a
docker compose --project-name adc-isolated-loopback -f "$target/ops/compose/compose.prod.yaml" -f "$target/ops/compose/compose.offline.yaml" up -d --no-deps --no-build --pull never --wait --wait-timeout 90 admin </dev/null
test "$before" = "$(docker inspect --format '{{.Id}}' adc-isolated-loopback-mysql-1 adc-isolated-loopback-backend-1)"
printf '%s\n' "$release" > "$runtime/release"
echo 'Frontend updated; backend and database container IDs preserved'
