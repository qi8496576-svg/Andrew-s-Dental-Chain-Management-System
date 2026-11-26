#!/bin/bash
# stdout is a binary tar stream. Never add logging to stdout.
set -euo pipefail
mode=${1:?mode required};root=/opt/andrew-dental/private/Recovery
exec 9>"$root/.cycle.lock";flock -s 9
if [[ "$mode" == backups ]];then
 exec tar -czf - -C "$root" snapshots archive status.json
elif [[ "$mode" == configuration ]];then
 set -a;. /opt/andrew-dental/private/IntegrationRuntime/runtime.env;set +a
 python3 - <<'PY'
import os,tarfile,pathlib,sys
base=pathlib.Path('/opt/andrew-dental/private').resolve()
with tarfile.open(fileobj=sys.stdout.buffer,mode='w|gz') as t:
 for name in ['ADC_BACKEND_SECRETS_DIR','ADC_MYSQL_ROOT_PASSWORD_FILE','ADC_MIGRATION_PASSWORD_FILE','ADC_TLS_CERTIFICATE_FILE','ADC_TLS_PRIVATE_KEY_FILE']:
  p=pathlib.Path(os.environ[name]).resolve();tls=name in ['ADC_TLS_CERTIFICATE_FILE','ADC_TLS_PRIVATE_KEY_FILE'];allowed=base in p.parents or (tls and pathlib.Path('/etc/letsencrypt/archive/andrewdental.cn') in p.parents);assert allowed and p.exists();t.add(p,arcname=name,recursive=True)
 t.add(base/'IntegrationRuntime/runtime.env',arcname='runtime.env')
 t.add(base/'IntegrationRuntime/release',arcname='release')
PY
else exit 2;fi
