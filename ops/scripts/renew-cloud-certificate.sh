#!/bin/bash
set -euo pipefail
test "${RENEWED_LINEAGE:-}" = /etc/letsencrypt/live/andrewdental.cn || exit 0
openssl x509 -in "$RENEWED_LINEAGE/fullchain.pem" -noout -checkhost andrewdental.cn
# Keep the mounted secret inodes: Docker file binds retain an inode across replacement.
python3 - "$RENEWED_LINEAGE" <<'PY'
from pathlib import Path
import os,sys
source=Path(sys.argv[1]);target=Path('/opt/andrew-dental/private/FormalTLS')
for name in ['fullchain.pem','privkey.pem']:
    data=(source/name).read_bytes()
    with (target/name).open('wb') as stream:
        stream.write(data);stream.flush();os.fsync(stream.fileno())
    (target/name).chmod(0o444)
PY
docker exec adc-isolated-loopback-admin-1 nginx -c /tmp/nginx.conf -s reload
