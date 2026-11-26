#!/bin/bash
# Project-owned cloud backup cycle. No restore or pruning is performed here.
set -euo pipefail
umask 077
mode=${1:-archive};root=/opt/andrew-dental/private/Recovery;container=adc-isolated-loopback-mysql-1
[[ "$mode" == full || "$mode" == archive || "$mode" == status ]] || exit 2
[[ -d "$root/bin" && ! -L "$root" ]] || exit 2
if [[ "$mode" == status ]];then
 python3 - "$root" <<'PY'
import pathlib,json,time,sys
p=pathlib.Path(sys.argv[1]);s=json.loads((p/'status.json').read_text());now=time.time();s['full_age_seconds']=round(now-s['last_full_epoch']);s['archive_age_seconds']=round(now-s['last_archive_epoch']);s['healthy']=s['full_age_seconds']<=86400 and s['archive_age_seconds']<=900;print(json.dumps(s));sys.exit(0 if s['healthy'] else 1)
PY
 exit $?
fi
exec 9>"$root/.cycle.lock";flock -n 9 || exit 0
expected=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["binary_sha256"])' "$root/bin/provenance.json")
[[ $(sha256sum "$root/bin/mysqlbinlog" | cut -d ' ' -f1) == "$expected" ]] || exit 1
docker exec "$container" mkdir -p /tmp/adc-recovery/ops /tmp/adc-recovery/archive < /dev/null
docker cp "$root/bin/." "$container:/tmp/adc-recovery/ops/"
docker exec "$container" bash -c 'set -e;umask 077;{ printf "[client]\nuser=root\npassword=";cat /run/secrets/mysql_root_password;printf "\nhost=127.0.0.1\n";} > /tmp/adc-recovery/client.cnf;chmod 0755 /tmp/adc-recovery/ops/mysqlbinlog' < /dev/null
exec_in(){ docker exec -e PATH=/tmp/adc-recovery/ops:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin "$container" "$@" < /dev/null; }
mkdir -p "$root/snapshots" "$root/archive"
if [[ "$mode" == full || -z $(find "$root/snapshots" -mindepth 2 -maxdepth 2 -name MANIFEST -print -quit) ]];then
 stamp=$(date -u +%Y%m%dT%H%M%SZ);[[ ! -e "$root/snapshots/$stamp" ]] || { sleep 1;stamp=$(date -u +%Y%m%dT%H%M%SZ); }
 exec_in bash /tmp/adc-recovery/ops/full-backup.sh /tmp/adc-recovery/client.cnf "/tmp/adc-recovery/full-$stamp"
 docker cp "$container:/tmp/adc-recovery/full-$stamp" "$root/snapshots/.pending-$stamp"
 mv "$root/snapshots/.pending-$stamp" "$root/snapshots/$stamp"
fi
oldest=$(find "$root/snapshots" -mindepth 2 -maxdepth 2 -name MANIFEST -print | sort | head -n1)
[[ "$oldest" == "$root/snapshots/"*/MANIFEST ]] || exit 1
docker exec "$container" mkdir -p /tmp/adc-recovery/base < /dev/null
docker cp "$(dirname "$oldest")/." "$container:/tmp/adc-recovery/base/"
if [[ -f "$root/archive/CHAIN" ]];then docker cp "$root/archive/." "$container:/tmp/adc-recovery/archive/";fi
exec_in bash /tmp/adc-recovery/ops/archive-binlog.sh /tmp/adc-recovery/client.cnf /tmp/adc-recovery/base/MANIFEST /tmp/adc-recovery/archive
docker cp "$container:/tmp/adc-recovery/archive/." "$root/archive/"
python3 - "$root" <<'PY'
import pathlib,json,time,sys,datetime
p=pathlib.Path(sys.argv[1]);manifests=sorted((p/'snapshots').glob('*/MANIFEST'));m=dict(x.split('=',1) for x in manifests[-1].read_text().splitlines()[1:]);s={'last_full_epoch':datetime.datetime.fromisoformat(m['created_at'].replace('Z','+00:00')).timestamp(),'last_archive_epoch':time.time(),'source_uuid':m['server_uuid'],'full_snapshots':len(manifests),'archived_files':len(list((p/'archive').glob('*.[0-9]*'))),'pruning_enabled':False};q=p/'status.pending';q.write_text(json.dumps(s)+'\n');q.replace(p/'status.json')
PY
printf 'Cloud consistent backup and closed-log archive completed\n'
