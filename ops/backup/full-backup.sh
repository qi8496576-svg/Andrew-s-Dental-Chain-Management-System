#!/bin/sh
# Run with a controlled MySQL option file; never pass passwords as arguments.
set -eu
umask 077
[ "$#" -eq 2 ] || { echo 'usage: full-backup.sh MYSQL_OPTION_FILE NEW_BACKUP_DIRECTORY' >&2; exit 2; }
config=$1
destination=$2
case "$config:$destination" in -*) echo 'Absolute paths are required' >&2; exit 2;; esac
case "$config" in /*) ;; *) exit 2;; esac
case "$destination" in /*) ;; *) exit 2;; esac
[ -f "$config" ] && [ ! -L "$config" ] || exit 2
for command in mysql mysqldump gzip sha256sum; do command -v "$command" >/dev/null; done
sql() { mysql --defaults-extra-file="$config" --batch --skip-column-names --execute="$1"; }
version=$(sql 'SELECT VERSION()')
case "$version" in 8.4.*) ;; *) echo 'MySQL 8.4 is required' >&2; exit 1;; esac
uuid=$(sql 'SELECT @@server_uuid')
[ "$(sql "SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME IN ('adc_business','adc_identity','adc_audit')")" = 3 ] || exit 1
[ "$(sql "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA IN ('adc_business','adc_identity','adc_audit') AND TABLE_TYPE='BASE TABLE' AND ENGINE <> 'InnoDB'")" = 0 ] || { echo 'Non-InnoDB tables cannot use this snapshot procedure' >&2; exit 1; }
mkdir "$destination" # Refuse an existing destination; partial backups are never reused.
trap 'echo "Backup failed; incomplete directory retained, no verified manifest published" >&2' 1 2 15
# One dump/transaction for all three schemas. Do not run migrations/DDL concurrently.
mysqldump --defaults-extra-file="$config" --single-transaction --source-data=2 \
  --set-gtid-purged=OFF --hex-blob --routines --events --triggers --no-tablespaces \
  --skip-dump-date --databases adc_business adc_identity adc_audit > "$destination/full.sql"
coordinates=$(sed -n "s/^-- CHANGE REPLICATION SOURCE TO SOURCE_LOG_FILE='\([^']*\)', SOURCE_LOG_POS=\([0-9]*\);/\1 \2/p" "$destination/full.sql")
[ "$(printf '%s\n' "$coordinates" | wc -l | tr -d ' ')" = 1 ] && [ -n "$coordinates" ] || { echo 'Missing unique snapshot binlog position' >&2; exit 1; }
file=${coordinates% *}
position=${coordinates##* }
case "$file" in ''|*[!a-zA-Z0-9_.-]*) exit 1;; esac
case "$position" in ''|*[!0-9]*) exit 1;; esac
gzip "$destination/full.sql"
digest=$(sha256sum "$destination/full.sql.gz" | cut -d ' ' -f 1)
bytes=$(wc -c < "$destination/full.sql.gz" | tr -d ' ')
{
  printf '%s\n' 'ADC-FULL-BACKUP-V1' 'schemas=adc_business,adc_identity,adc_audit'
  printf 'server_uuid=%s\nmysql_version=%s\ncreated_at=%s\n' "$uuid" "$version" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf 'binlog_file=%s\nbinlog_position=%s\ndump_sha256=%s\ndump_bytes=%s\ndump_file=full.sql.gz\n' "$file" "$position" "$digest" "$bytes"
} > "$destination/MANIFEST.partial"
sh "$(dirname "$0")/verify-manifest.sh" "$destination/MANIFEST.partial"
mv "$destination/MANIFEST.partial" "$destination/MANIFEST"
printf '%s\n' 'Consistent full backup verified; binlog chain / independent storage still required.'
