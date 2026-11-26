#!/bin/bash
set -euo pipefail
umask 077
release=${1:?candidate release required}
[[ "$release" =~ ^adc-cloud-20261124-[0-9]+$ ]] || exit 2
incoming=/home/ubuntu/adc-upload/$release
target=/opt/andrew-dental/releases/$release
test -f "$incoming/candidate.json"
python3 "$incoming/ops/scripts/verify-candidate.py" "$incoming/candidate.json" --files-only
test ! -e "$target" || { echo 'Candidate already staged; refusing overwrite' >&2; exit 2; }
mkdir "$target"
cp -a "$incoming/." "$target/"
gzip -dc "$target/images.tar.gz" | docker load >/dev/null
python3 "$target/ops/scripts/verify-candidate.py" "$target/candidate.json"
echo "Candidate staged and fingerprints verified: $release"
