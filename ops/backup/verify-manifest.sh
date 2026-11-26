#!/bin/sh
set -eu
[ "$#" -eq 1 ] || { echo 'usage: verify-manifest.sh MANIFEST' >&2; exit 2; }
manifest=$1
[ -f "$manifest" ] && [ ! -L "$manifest" ] || exit 1
[ "$(wc -l < "$manifest" | tr -d ' ')" = 10 ] || { echo 'Invalid manifest length' >&2; exit 1; }
line() { sed -n "${1}p" "$manifest"; }
[ "$(line 1)" = ADC-FULL-BACKUP-V1 ] && [ "$(line 2)" = schemas=adc_business,adc_identity,adc_audit ] || exit 1
line 3 | grep -Eq '^server_uuid=[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
line 4 | grep -Eq '^mysql_version=8\.4\.[0-9a-zA-Z_.+-]+$'
line 5 | grep -Eq '^created_at=[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$'
line 6 | grep -Eq '^binlog_file=[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$'
line 7 | grep -Eq '^binlog_position=[0-9]+$'
[ "$(line 7 | cut -d = -f 2)" -ge 4 ]
line 8 | grep -Eq '^dump_sha256=[0-9a-f]{64}$'
line 9 | grep -Eq '^dump_bytes=[1-9][0-9]*$'
[ "$(line 10)" = dump_file=full.sql.gz ] || exit 1
dump=$(dirname "$manifest")/full.sql.gz
[ -f "$dump" ] && [ ! -L "$dump" ] || exit 1
[ "$(wc -c < "$dump" | tr -d ' ')" = "$(line 9 | cut -d = -f 2)" ] || exit 1
[ "$(sha256sum "$dump" | cut -d ' ' -f 1)" = "$(line 8 | cut -d = -f 2)" ] || { echo 'Backup checksum mismatch' >&2; exit 1; }
gzip -t "$dump"
printf '%s\n' 'Manifest, snapshot archive and SHA-256 verified (not a signature or PITR-chain validation).'
