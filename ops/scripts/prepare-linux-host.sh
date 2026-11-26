#!/bin/sh
# Explicit operator step; reads no application secrets and never deletes existing data.
set -eu
test "$(uname -m)" = x86_64
. /etc/os-release
test "$ID" = ubuntu
test "$VERSION_CODENAME" = noble
if test -e /opt/andrew-dental; then
    test -d /opt/andrew-dental
    test -z "$(find /opt/andrew-dental -mindepth 1 -maxdepth 1 -print -quit)" || { printf '%s\n' 'Existing project content must be reviewed; no overwrite performed' >&2; exit 1; }
fi
if ! command -v docker >/dev/null 2>&1; then
    for adc_package in docker.io docker-compose docker-compose-v2 docker-doc podman-docker containerd runc; do
        if dpkg-query -W -f='${Status}' "$adc_package" 2>/dev/null | grep -q '^install ok installed$'; then
            printf '%s\n' 'Conflicting existing runtime package; review required, nothing removed' >&2; exit 1
        fi
    done
    sudo -n apt-get update -qq
    sudo -n apt-get install -y -qq ca-certificates curl
    sudo -n install -m 0755 -d /etc/apt/keyrings
    if ! test -e /etc/apt/keyrings/docker.asc; then
        sudo -n curl --fail --show-error --silent --location https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
        sudo -n chmod a+r /etc/apt/keyrings/docker.asc
    fi
    if ! test -e /etc/apt/sources.list.d/docker.sources; then
        printf 'Types: deb\nURIs: https://download.docker.com/linux/ubuntu\nSuites: noble\nComponents: stable\nArchitectures: amd64\nSigned-By: /etc/apt/keyrings/docker.asc\n' | sudo -n tee /etc/apt/sources.list.d/docker.sources >/dev/null
    fi
    sudo -n apt-get update -qq
    sudo -n apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
sudo -n docker version --format '{{.Server.Version}}'
sudo -n docker compose version
if ! test -e /opt/andrew-dental; then sudo -n install -d -o ubuntu -g ubuntu -m 0750 /opt/andrew-dental; fi
printf '%s\n' 'HOST_RUNTIME_PREPARED_NO_APPLICATION_DEPLOYED'
