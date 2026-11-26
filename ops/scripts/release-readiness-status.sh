#!/bin/bash
set -euo pipefail
python3 - <<'PY'
import json,subprocess,shutil,time,pathlib,datetime
names=['adc-isolated-loopback-mysql-1','adc-isolated-loopback-backend-1','adc-isolated-loopback-admin-1']
data=json.loads(subprocess.check_output(['docker','inspect',*names],text=True))
containers=[{'name':x['Name'],'image':x['Image'],'running':x['State']['Running'],'health':x['State'].get('Health',{}).get('Status'),'memory_limit':x['HostConfig']['Memory']} for x in data]
assert all(x['running'] and x['health']=='healthy' for x in containers)
backup=json.loads(pathlib.Path('/opt/andrew-dental/private/Recovery/status.json').read_text());assert time.time()-backup['last_archive_epoch']<=900 and time.time()-backup['last_full_epoch']<=86400
usage=shutil.disk_usage('/opt/andrew-dental')
print(json.dumps({'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'containers':containers,'disk':{'total_bytes':usage.total,'free_bytes':usage.free,'used_bytes':usage.used},'backup_status':backup,'secrets_printed':False,'deployment_performed':False}))
PY
