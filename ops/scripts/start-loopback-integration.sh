#!/bin/sh
# First start of the already staged, isolated integration candidate. No public port/DNS.
set -eu
umask 077
[ "${ADC_ISOLATED_LOOPBACK:-}" = acknowledged ] || { echo 'Explicit isolated loopback start required' >&2; exit 2; }
[ "$(id -u)" = 0 ] || { echo 'Run through the controlled server operator' >&2; exit 2; }
release=/opt/andrew-dental/releases/adc-20261114-1794653395719
private=/opt/andrew-dental/private/Deployment
tls=/opt/andrew-dental/private/LoopbackTLS
project=adc-isolated-loopback
test -f "$release/candidate.json"
test -f "$release/ops/compose/compose.offline.yaml"
test -z "$(docker ps -aq --filter "label=com.docker.compose.project=$project")" || { echo 'Project already exists; preserve it and inspect rather than reinitialize' >&2; exit 1; }
test -z "$(docker volume ls -q --filter "name=^${project}_mysql_data$")" || { echo 'Existing database volume must be reviewed, not reused automatically' >&2; exit 1; }
test -z "$(ss -ltnH '( sport = :24443 )')" || { echo 'Loopback port already in use' >&2; exit 1; }
for file in mysql-root migration wechat-appid backend/adc.auth-secret backend/adc.wechat.app-secret backend/spring.datasource.password; do test -s "$private/$file"; done
# Read-only image-ID checks. Never print expanded environment or secret file values.
python3 - "$release/candidate.json" <<'PY'
import json,subprocess,sys
candidate=json.load(open(sys.argv[1]))
for image in candidate['images']:
    observed=subprocess.check_output(['docker','image','inspect','--format','{{.Id}}',image['id']],text=True).strip()
    assert observed == image['id'], 'Staged image fingerprint mismatch'
print('Existing candidate image IDs verified')
PY
mkdir "$tls" # New folder only, never overwrite any certificate/private key.
openssl req -x509 -newkey rsa:2048 -nodes -days 30 -subj /CN=localhost \
  -addext subjectAltName=DNS:localhost -keyout "$tls/localhost.key" -out "$tls/localhost.crt" 2>/dev/null
chmod 0444 "$tls/localhost.key" "$tls/localhost.crt"
export ADC_BACKEND_IMAGE=sha256:626cddda4192fabcbb626f8a1680747bb618389cec0f86d647118de131a1f0af
export ADC_ADMIN_IMAGE=sha256:4e1890cdf1dae62c374de08f927ff9ca38cbd3c6aa137816a7f78df6fc1910cd
export ADC_BACKEND_SECRETS_DIR="$private/backend"
export ADC_MYSQL_ROOT_PASSWORD_FILE="$private/mysql-root"
export ADC_MIGRATION_PASSWORD_FILE="$private/migration"
export ADC_WECHAT_APP_ID="$(cat "$private/wechat-appid")"
export ADC_TLS_CERTIFICATE_FILE="$tls/localhost.crt"
export ADC_TLS_PRIVATE_KEY_FILE="$tls/localhost.key"
export ADC_DOMAIN=localhost ADC_HTTPS_BIND=127.0.0.1 ADC_HTTPS_PORT=24443 ADC_HTTPS_ORIGIN_PORT_SUFFIX=:24443
docker compose --project-name "$project" -f "$release/ops/compose/compose.prod.yaml" -f "$release/ops/compose/compose.offline.yaml" config --quiet
docker compose --project-name "$project" -f "$release/ops/compose/compose.prod.yaml" -f "$release/ops/compose/compose.offline.yaml" up -d --no-build --pull never --wait --wait-timeout 240
test "$(curl --silent --show-error --cacert "$tls/localhost.crt" --output /dev/null --write-out '%{http_code}' https://localhost:24443/)" = 200
test "$(curl --silent --show-error --cacert "$tls/localhost.crt" --output /dev/null --write-out '%{http_code}' https://localhost:24443/api/v1/me)" = 401
docker ps --filter "label=com.docker.compose.project=$project" --format '{{.Names}} {{.Status}} {{.Ports}}'
echo 'Loopback integration healthy. No public website, DNS, production release or official WeChat-domain acceptance.'
