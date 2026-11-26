#!/bin/bash
# Archive closed logs from the snapshot's common position. Never purge source logs.
set -euo pipefail
umask 077
[[ $# == 3 ]] || { echo 'usage: archive-binlog.sh MYSQL_OPTION_FILE FULL_MANIFEST ARCHIVE_DIRECTORY' >&2; exit 2; }
config=$1;manifest=$2;destination=$3
for p in "$config" "$manifest" "$destination"; do [[ "$p" == /* && ! -L "$p" ]] || exit 2; done
[[ -f "$config" ]] || exit 2
for command in mysql mysqlbinlog sha256sum gzip; do command -v "$command" > /dev/null || { echo "Missing backup tool: $command" >&2;exit 1; }; done
bash "$(dirname "$0")/verify-manifest.sh" "$manifest" > /dev/null
value(){ sed -n "s/^$1=//p" "$manifest"; }
sql(){ mysql --defaults-extra-file="$config" --batch --skip-column-names --execute="$1"; }
uuid=$(sql 'SELECT @@server_uuid');[[ "$uuid" == "$(value server_uuid)" ]] || { echo 'Snapshot/source UUID mismatch' >&2;exit 1; }
start=$(value binlog_file)
mkdir -p "$destination"
lock="$destination/.archive.lockdir"
mkdir "$lock" 2>/dev/null || { echo 'Archive already running or a previous lock requires inspection' >&2;exit 1; }
tmp=''
trap 'if [[ -n "$tmp" ]]; then rm -rf -- "$tmp"; fi; rmdir -- "$lock"' EXIT
if [[ -f "$destination/CHAIN" ]]; then grep -Fqx "server_uuid=$uuid" "$destination/CHAIN" || exit 1; fi
# Rotation closes the formerly active file at a transaction boundary.
sql 'FLUSH BINARY LOGS' > /dev/null
current=$(sql 'SHOW BINARY LOG STATUS' | cut -f1)
prefix=${start%.*};first=${start##*.};last=${current##*.}
[[ "$current" == "$prefix".* && "$first" =~ ^[0-9]+$ && "$last" =~ ^[0-9]+$ ]] || exit 1
tmp=$(mktemp -d "$destination/.archive-XXXXXXXX")
{
 printf 'ADC-BINLOG-CHAIN-V1\nserver_uuid=%s\narchived_at=%s\n' "$uuid" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
 for ((n=10#$first;n<10#$last;n++)); do
  printf -v file '%s.%06d' "$prefix" "$n"
  if [[ ! -f "$destination/$file" ]]; then
   mysqlbinlog --defaults-extra-file="$config" --read-from-remote-server --raw --result-file="$tmp/" "$file"
   mysqlbinlog --verify-binlog-checksum "$tmp/$file" > /dev/null
   mv -- "$tmp/$file" "$destination/$file"
  fi
  [[ ! -L "$destination/$file" ]] || exit 1
  mysqlbinlog --verify-binlog-checksum "$destination/$file" > /dev/null
  printf 'log=%s\t%s\t%s\n' "$file" "$(wc -c < "$destination/$file" | tr -d ' ')" "$(sha256sum "$destination/$file" | cut -d ' ' -f1)"
 done
} > "$tmp/CHAIN"
[[ $(grep -c '^log=' "$tmp/CHAIN") -gt 0 ]] || exit 1
mv -- "$tmp/CHAIN" "$destination/CHAIN"
printf 'Closed binary logs archived and verified; source_uuid=%s\n' "$uuid"
