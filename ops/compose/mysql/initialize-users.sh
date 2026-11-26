#!/bin/bash
# Sourced by the official MySQL entry point, on an EMPTY volume only, after 01-bootstrap.sql.
# Official helper functions intentionally accept absent positional arguments.
set -e
# Windows bind mounts may make this file executable. Support both the official
# entry point's sourced and executed .sh modes without putting passwords in argv.
if ! declare -F docker_process_sql >/dev/null; then
    source /usr/local/bin/docker-entrypoint.sh
    docker_setup_env mysqld
fi
adc_migration_password=$(cat /run/secrets/migration_password)
adc_runtime_password=$(cat /run/secrets/runtime_password)
# Restrict provisioned passwords to generated Base64; never interpolate arbitrary SQL text.
for adc_password in "$adc_migration_password" "$adc_runtime_password"; do
    case "$adc_password" in ''|*[!A-Za-z0-9+/=]*) printf '%s\n' 'Expected a generated Base64 database credential' >&2; exit 1;; esac
    test "${#adc_password}" -ge 43 || exit 1
done
docker_process_sql <<EOSQL
CREATE USER 'adc_migrator'@'%' IDENTIFIED BY '$adc_migration_password';
GRANT 'adc_migration_role' TO 'adc_migrator'@'%';
SET DEFAULT ROLE 'adc_migration_role' TO 'adc_migrator'@'%';
CREATE USER 'adc_runtime'@'%' IDENTIFIED BY '$adc_runtime_password';
GRANT 'adc_runtime_role' TO 'adc_runtime'@'%';
SET DEFAULT ROLE 'adc_runtime_role' TO 'adc_runtime'@'%';
EOSQL
unset adc_migration_password adc_runtime_password adc_password
