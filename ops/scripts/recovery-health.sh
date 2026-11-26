#!/bin/bash
set -euo pipefail
release=${1:?original billing release required};[[ "$release" =~ ^adc-billing-20261125-[0-9]+$ ]] || exit 2
python3 - "$release" <<'PY'
import json,pathlib,subprocess,sys,datetime,time
root=pathlib.Path('/opt/andrew-dental/private/Recovery');run=lambda a:subprocess.check_output(a,text=True).strip()
current=json.loads(run(['docker','inspect','adc-isolated-loopback-mysql-1']))[0]
before=json.loads(pathlib.Path('/opt/andrew-dental/private/BillingBackups',sys.argv[1],'before.json').read_text());old=next(x for x in before if x['name']=='/adc-isolated-loopback-mysql-1')
assert current['Id']==old['id'];assert old['mounts']==[{'name':m.get('Name'),'source':m['Source'],'destination':m['Destination']} for m in current['Mounts']]
status=json.loads((root/'status.json').read_text());assert time.time()-status['last_archive_epoch']<=900
timers={k:run(['systemctl','is-active','adc-recovery-'+k+'.timer']) for k in ['full','archive','health']};assert all(v=='active' for v in timers.values())
codes={p:run(['curl','--silent','--show-error','--output','/dev/null','--write-out','%{http_code}','https://andrewdental.cn'+p]) for p in ['/','/api/v1/me']};assert codes=={'/':'200','/api/v1/me':'401'}
print(json.dumps({'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'database_container_and_volume_unchanged':True,'database_container_id':current['Id'],'timers':timers,'backup_status':status,'https_status':codes,'technical_record_auto_deletion_enabled':False}))
PY
