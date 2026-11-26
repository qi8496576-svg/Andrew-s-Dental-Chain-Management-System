#!/bin/bash
# Restores the pre-domain application images and loopback endpoint; no database changes.
set -euo pipefail
runtime=/opt/andrew-dental/private/IntegrationRuntime
private=/opt/andrew-dental/private/Deployment
release=/opt/andrew-dental/releases/adc-20261114-1794653395719
test -s "$runtime/before.json"
export ADC_BACKEND_IMAGE=$(python3 -c 'import json,sys;print(next(c["image"] for c in json.load(open(sys.argv[1])) if c["name"].endswith("-backend-1")))' "$runtime/before.json")
export ADC_ADMIN_IMAGE=$(python3 -c 'import json,sys;print(next(c["image"] for c in json.load(open(sys.argv[1])) if c["name"].endswith("-admin-1")))' "$runtime/before.json")
export ADC_BACKEND_SECRETS_DIR=$private/backend ADC_MYSQL_ROOT_PASSWORD_FILE=$private/mysql-root ADC_MIGRATION_PASSWORD_FILE=$private/migration
export ADC_WECHAT_APP_ID=$(cat "$private/wechat-appid")
export ADC_TLS_CERTIFICATE_FILE=/opt/andrew-dental/private/LoopbackTLS/localhost.crt ADC_TLS_PRIVATE_KEY_FILE=/opt/andrew-dental/private/LoopbackTLS/localhost.key
export ADC_DOMAIN=localhost ADC_HTTPS_BIND=127.0.0.1 ADC_HTTPS_PORT=24443 ADC_HTTPS_ORIGIN_PORT_SUFFIX=:24443
docker compose --project-name adc-isolated-loopback -f "$release/ops/compose/compose.prod.yaml" -f "$release/ops/compose/compose.offline.yaml" up -d --no-deps --no-build --pull never --wait --wait-timeout 180 backend admin
echo 'Application rollback complete; existing database preserved'
