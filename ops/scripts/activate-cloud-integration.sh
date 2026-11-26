#!/bin/bash
# Approved public-domain integration only. Keeps the exact existing database volume.
set -euo pipefail
umask 077
release=${1:?candidate release required}
[[ "$release" =~ ^adc-cloud-20261124-[0-9]+$ ]] || exit 2
project=adc-isolated-loopback
target=/opt/andrew-dental/releases/$release
private=/opt/andrew-dental/private
runtime=$private/IntegrationRuntime
tls=$private/FormalTLS
test -f "$target/candidate.json"
test ! -e "$runtime/runtime.env" || { echo 'Runtime already configured; inspect instead of overwriting' >&2; exit 2; }
python3 "$target/ops/scripts/verify-candidate.py" "$target/candidate.json"
openssl x509 -in /etc/letsencrypt/live/andrewdental.cn/fullchain.pem -noout -checkhost andrewdental.cn
openssl x509 -in /etc/letsencrypt/live/andrewdental.cn/fullchain.pem -noout -checkend 2592000
test -z "$(ss -ltnH '( sport = :443 )')" || { echo 'Port 443 already occupied' >&2; exit 2; }
test "$(docker inspect --format '{{.State.Health.Status}}' "$project-mysql-1")" = healthy
mkdir -p "$runtime" "$private/PreDomainBackups"
chmod 0700 "$runtime" "$private/PreDomainBackups"
docker inspect "$project-mysql-1" "$project-backend-1" "$project-admin-1" | python3 -c 'import json,sys;print(json.dumps([{ "name":c["Name"],"id":c["Id"],"image":c["Image"],"mounts":[{"name":m.get("Name"),"source":m["Source"],"destination":m["Destination"]} for m in c["Mounts"]]} for c in json.load(sys.stdin)],indent=2))' > "$runtime/before.json"
backup=$private/PreDomainBackups/$release
mkdir "$backup"
docker exec "$project-mysql-1" sh -ec 'MYSQL_PWD="$(cat /run/secrets/mysql_root_password)" exec mysqldump --user=root --single-transaction --source-data=2 --set-gtid-purged=OFF --hex-blob --routines --events --triggers --no-tablespaces --databases adc_business adc_identity adc_audit' | gzip > "$backup/full.sql.gz"
gzip -t "$backup/full.sql.gz"
sha256sum "$backup/full.sql.gz" > "$backup/full.sha256"
test ! -e "$tls" || { echo 'Formal TLS directory already exists; preserve it for inspection' >&2; exit 2; }
mkdir "$tls"; chmod 0700 "$tls"
cp /etc/letsencrypt/live/andrewdental.cn/fullchain.pem "$tls/fullchain.pem"
cp /etc/letsencrypt/live/andrewdental.cn/privkey.pem "$tls/privkey.pem"
chmod 0444 "$tls/fullchain.pem" "$tls/privkey.pem"
backend=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["images"][0]["id"])' "$target/candidate.json")
admin=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["images"][1]["id"])' "$target/candidate.json")
cat > "$runtime/runtime.env" <<EOF
ADC_BACKEND_IMAGE=$backend
ADC_ADMIN_IMAGE=$admin
ADC_BACKEND_SECRETS_DIR=$private/Deployment/backend
ADC_MYSQL_ROOT_PASSWORD_FILE=$private/Deployment/mysql-root
ADC_MIGRATION_PASSWORD_FILE=$private/Deployment/migration
ADC_WECHAT_APP_ID=$(cat "$private/Deployment/wechat-appid")
ADC_TLS_CERTIFICATE_FILE=$tls/fullchain.pem
ADC_TLS_PRIVATE_KEY_FILE=$tls/privkey.pem
ADC_DOMAIN=andrewdental.cn
ADC_HTTPS_BIND=0.0.0.0
ADC_HTTPS_PORT=443
ADC_HTTPS_ORIGIN_PORT_SUFFIX=
EOF
chmod 0600 "$runtime/runtime.env"
printf '%s\n' "$release" > "$runtime/release"
set -a; . "$runtime/runtime.env"; set +a
compose=(docker compose --project-name "$project" -f "$target/ops/compose/compose.prod.yaml" -f "$target/ops/compose/compose.offline.yaml")
"${compose[@]}" config --quiet
"${compose[@]}" up -d --no-deps --no-build --pull never --wait --wait-timeout 180 backend admin
test "$(curl --silent --show-error --resolve andrewdental.cn:443:127.0.0.1 --output /dev/null --write-out '%{http_code}' https://andrewdental.cn/)" = 200
test "$(curl --silent --show-error --resolve andrewdental.cn:443:127.0.0.1 --output /dev/null --write-out '%{http_code}' https://andrewdental.cn/api/v1/me)" = 401
docker inspect "$project-mysql-1" | python3 -c 'import json,sys;before=json.load(open(sys.argv[1]));current=json.load(sys.stdin)[0];old=next(c for c in before if c["name"]=="/adc-isolated-loopback-mysql-1");assert old["id"]==current["Id"],"Database container unexpectedly changed";print("Database container and volume preserved")' "$runtime/before.json"
echo "Public-domain integration activated: $release; production release not performed"
