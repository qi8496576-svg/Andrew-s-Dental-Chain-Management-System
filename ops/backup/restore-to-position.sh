#!/bin/bash
# Only a fresh, isolated target with a different UUID can be restored.
set -euo pipefail
umask 077
[[ $# == 5 ]] || { echo 'usage: restore-to-position.sh TARGET_OPTION_FILE FULL_MANIFEST CHAIN TARGET_LOG TARGET_POSITION' >&2; exit 2; }
config=$1;manifest=$2;chain=$3;stop_file=$4;stop_position=$5
for p in "$config" "$manifest" "$chain"; do [[ "$p" == /* && -f "$p" && ! -L "$p" ]] || exit 2; done
[[ "$stop_file" =~ ^[A-Za-z0-9_-][A-Za-z0-9_.-]*$ && "$stop_position" =~ ^[0-9]+$ && "$stop_position" -ge 4 ]] || exit 2
bash "$(dirname "$0")/verify-manifest.sh" "$manifest" > /dev/null
value(){ sed -n "s/^$1=//p" "$manifest"; }
sql(){ mysql --defaults-extra-file="$config" --batch --skip-column-names --execute="$1"; }
[[ "$(sql 'SELECT VERSION()')" == 8.4.* ]] || exit 1
[[ "$(sql 'SELECT @@server_uuid')" != "$(value server_uuid)" ]] || { echo 'Refusing restore to original instance' >&2;exit 1; }
[[ "$(sql "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA IN ('adc_business','adc_identity','adc_audit')")" == 0 ]] || { echo 'Refusing restore to nonempty target' >&2;exit 1; }
[[ $(head -n1 "$chain") == ADC-BINLOG-CHAIN-V1 ]] && grep -Fqx "server_uuid=$(value server_uuid)" "$chain" || exit 1
start_file=$(value binlog_file);start_position=$(value binlog_position);prefix=${start_file%.*};expected=$((10#${start_file##*.}));files=();found=false
while IFS=$'\t' read -r entry bytes digest; do
 [[ "$entry" == log=* ]] || continue
 file=${entry#log=}
 [[ "$file" == "$prefix".* && "${file##*.}" =~ ^[0-9]+$ && $((10#${file##*.})) == "$expected" && "$bytes" =~ ^[0-9]+$ && "$digest" =~ ^[a-f0-9]{64}$ ]] || { echo 'Incomplete or invalid binlog chain' >&2;exit 1; }
 ((expected+=1));path=$(dirname "$chain")/$file
 [[ -f "$path" && ! -L "$path" && $(wc -c < "$path" | tr -d ' ') == "$bytes" && $(sha256sum "$path" | cut -d ' ' -f1) == "$digest" ]] || { echo 'Binlog checksum/size mismatch' >&2;exit 1; }
 files+=("$path")
 if [[ "$file" == "$stop_file" ]]; then [[ "$stop_position" -le "$bytes" ]] || exit 1;found=true;break;fi
done < "$chain"
[[ "$found" == true && ${#files[@]} -gt 0 ]] || { echo 'Target position not archived' >&2;exit 1; }
if [[ "$start_file" == "$stop_file" ]];then [[ "$stop_position" -ge "$start_position" ]] || exit 1;fi
work=$(mktemp -d);trap 'rm -rf -- "$work"' EXIT
# Decode and checksum the entire selected interval before mutating the empty target.
mysqlbinlog --verify-binlog-checksum --start-position="$start_position" --stop-position="$stop_position" "${files[@]}" > "$work/replay.sql"
gzip -dc "$(dirname "$manifest")/full.sql.gz" > "$work/full.sql"
mysql --defaults-extra-file="$config" < "$work/full.sql"
mysql --defaults-extra-file="$config" < "$work/replay.sql"
# Restored login sessions must not become valid again after rollback.
sql 'UPDATE adc_identity.Session SET revoked_at=UTC_TIMESTAMP() WHERE revoked_at IS NULL' > /dev/null
bash "$(dirname "$0")/verify-consistency.sh" "$config"
printf 'Restored three schemas to %s:%s; previous sessions revoked\n' "$stop_file" "$stop_position"
