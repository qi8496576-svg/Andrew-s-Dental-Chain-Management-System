#!/bin/bash
# Owner-approved synthetic integration data; never substitutes for real staff verification.
set -euo pipefail
umask 077
test "${1:-}" = owner-approved-synthetic-integration || exit 2
private=/opt/andrew-dental/private
fixture=$private/CloudTest
runtime=$private/IntegrationRuntime
test -s "$runtime/runtime.env"
test ! -e "$fixture" || { echo 'Fixture already exists; continue from its journal instead of reinitializing' >&2; exit 2; }
counts=$(docker exec adc-isolated-loopback-mysql-1 sh -ec 'MYSQL_PWD="$(cat /run/secrets/mysql_root_password)" exec mysql --user=root --batch --skip-column-names --execute="SELECT COUNT(*) FROM adc_business.Clinic; SELECT COUNT(*) FROM adc_identity.StaffAccount;"')
test "$counts" = $'0\n0' || { echo 'Existing business or staff data found; initialization refused' >&2; exit 2; }
mkdir "$fixture"; chmod 0700 "$fixture"
printf '%s\n' 'owner-approved-cloud-synthetic-integration-only-20261124' > "$fixture/purpose"
openssl rand -base64 32 > "$fixture/admin-password"
python3 - "$fixture" <<'PY'
import json,sys
from pathlib import Path
directory=Path(sys.argv[1]);password=(directory/'admin-password').read_text().strip()
reference='OWNER_APPROVED_20261124_SYNTHETIC_INTEGRATION_NOT_REAL_STAFF'
input={'username':'cloud-admin','staff_reference':reference,'operator_reference':reference,'clinic_ids':['1'],'capabilities':['account.manage','authorization.manage','resource.read','resource.write','analysis.read','cost.verify','performance.calculate','performance.publish','sensitive.drilldown','audit.read'],'valid_until':None}
(directory/'bootstrap.json').write_text(json.dumps(input),encoding='utf8')
(directory/'accounts.json').write_text(json.dumps({'purpose':'owner-approved-cloud-synthetic-integration-only-20261124','admin':{'username':'cloud-admin','password':password}},indent=2),encoding='utf8')
PY
chmod 0444 "$fixture/admin-password" "$fixture/bootstrap.json"
docker exec -i adc-isolated-loopback-mysql-1 sh -ec 'MYSQL_PWD="$(cat /run/secrets/mysql_root_password)" exec mysql --user=root' <<'SQL'
INSERT INTO adc_business.Clinic VALUES (1,'CLOUD-TEST-C1','云端联调虚构诊所，仅作验收，不是真实机构',NULL,'000',NULL,NULL,true,UTC_TIMESTAMP());
SQL
set -a; . "$runtime/runtime.env"; set +a
release=$(cat "$runtime/release")
target=/opt/andrew-dental/releases/$release
docker compose --project-name adc-isolated-loopback -f "$target/ops/compose/compose.prod.yaml" -f "$target/ops/compose/compose.offline.yaml" run --rm --no-deps --entrypoint java \
 -v "$fixture/admin-password:/run/cloudtest/admin-password:ro" -v "$fixture/bootstrap.json:/run/cloudtest/bootstrap.json:ro" \
 -e ADC_BOOTSTRAP_DB_PASSWORD_FILE=/run/secrets/spring.datasource.password -e ADC_BOOTSTRAP_PASSWORD_FILE=/run/cloudtest/admin-password -e ADC_BOOTSTRAP_INPUT_FILE=/run/cloudtest/bootstrap.json \
 operator -Xmx192m -Dloader.main=com.adc.identity.bootstrap.HeadquartersBootstrap -cp /app/app.jar org.springframework.boot.loader.launch.PropertiesLauncher </dev/null
touch "$fixture/bootstrap-complete"
echo 'Owner-approved synthetic cloud headquarters initialized; credentials remain private'
