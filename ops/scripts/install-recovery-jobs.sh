#!/bin/bash
set -euo pipefail
umask 077
release=${1:?release required};[[ "$release" =~ ^adc-recovery-20261125-[0-9]+$ ]] || exit 2
upload=/home/ubuntu/adc-upload/$release;root=/opt/andrew-dental/private/Recovery
python3 - "$upload" <<'PY'
import json,pathlib,hashlib,sys
p=pathlib.Path(sys.argv[1]).resolve();m=json.loads((p/'manifest.json').read_text())
for x in m['files']:
 f=(p/x['file']).resolve();assert p in f.parents and not f.is_symlink();assert hashlib.file_digest(f.open('rb'),'sha256').hexdigest()==x['sha256']
PY
[[ ! -L "$root" ]] || exit 1
install -d -m 700 "$root/bin" "$root/snapshots" "$root/archive"
for file in full-backup.sh verify-manifest.sh archive-binlog.sh restore-to-position.sh verify-consistency.sh cloud-cycle.sh mysqlbinlog;do install -m 700 "$upload/$file" "$root/bin/$file";done
install -m 600 "$upload/provenance.json" "$root/bin/provenance.json"
"$root/bin/cloud-cycle.sh" full > "$root/installation.log" 2>&1
for kind in full archive health;do
 case "$kind" in full) action=full;;archive) action=archive;;health) action=status;;esac
 cat > "/etc/systemd/system/adc-recovery-$kind.service" <<EOF
[Unit]
Description=Andrew Dental $kind backup operation
After=docker.service
Requires=docker.service
[Service]
Type=oneshot
UMask=0077
ExecStart=$root/bin/cloud-cycle.sh $action
TimeoutStartSec=300
EOF
done
cat > /etc/systemd/system/adc-recovery-full.timer <<'EOF'
[Unit]
Description=Andrew Dental daily consistent full backup
[Timer]
OnCalendar=*-*-* 18:00:00 UTC
Persistent=true
[Install]
WantedBy=timers.target
EOF
for kind in archive health;do
 cat > "/etc/systemd/system/adc-recovery-$kind.timer" <<EOF
[Unit]
Description=Andrew Dental $kind interval
[Timer]
OnBootSec=60s
OnUnitActiveSec=300s
[Install]
WantedBy=timers.target
EOF
done
systemctl daemon-reload
systemctl enable --now adc-recovery-full.timer adc-recovery-archive.timer adc-recovery-health.timer > /dev/null
"$root/bin/cloud-cycle.sh" status
printf 'Daily full / five-minute archive / health timers enabled; no pruning or database restore performed\n'
