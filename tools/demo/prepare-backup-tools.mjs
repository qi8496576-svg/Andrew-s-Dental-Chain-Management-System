// Obtain the same signed MySQL client as the backup image; no unverified download is executed.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
const root=path.resolve(import.meta.dirname,'../..'),cache=path.join(root,'tmp/backup-tools')
fs.mkdirSync(cache,{recursive:true})
const script='set -euo pipefail; curl -fsSL --connect-timeout 15 --max-time 180 -o /cache/client.rpm https://repo.mysql.com/yum/mysql-8.4-community/el/9/x86_64/mysql-community-client-8.4.13-1.el9.x86_64.rpm; curl -fsSL --max-time 60 -o /cache/mysql-key.asc https://repo.mysql.com/RPM-GPG-KEY-mysql-2025; gpg --batch --show-keys --with-colons /cache/mysql-key.asc > /cache/key-fingerprint.txt; grep -F BCA43417C3B485DD128EC6D4B7B3B788A8D3785C /cache/key-fingerprint.txt; rpm --import /cache/mysql-key.asc; rpm --checksig /cache/client.rpm > /cache/rpm-signature.txt; grep -F "digests signatures OK" /cache/rpm-signature.txt; rpm2cpio /cache/client.rpm > /cache/client.cpio'
const result=spawnSync(process.env.ADC_DOCKER||'docker',['run','--rm','--mount',`type=bind,source=${cache},target=/cache`,'--entrypoint','/bin/bash','mysql@sha256:72c368d898861f3b3a07af0e6d690400f44f048799ed46822783d9224cc2c86d','-c',script],{stdio:'inherit',windowsHide:true});assert.equal(result.status,0)
const raw=fs.readFileSync(path.join(cache,'client.cpio'));let at=0,binary
while(at+110<=raw.length){const header=raw.subarray(at,at+110).toString('ascii');assert.ok(['070701','070702'].includes(header.slice(0,6)));const fields=Array.from({length:13},(_,i)=>parseInt(header.slice(6+i*8,14+i*8),16)),size=fields[6],n=fields[11],name=raw.subarray(at+110,at+110+n-1).toString(),start=(at+110+n+3)&~3,end=start+size;assert.ok(end<=raw.length);if(['./usr/bin/mysqlbinlog','usr/bin/mysqlbinlog'].includes(name)){binary=raw.subarray(start,end);break}at=(end+3)&~3}
assert.ok(binary&&binary.subarray(0,4).equals(Buffer.from([127,69,76,70])))
fs.writeFileSync(path.join(cache,'mysqlbinlog'),binary,{mode:0o755});fs.writeFileSync(path.join(cache,'provenance.json'),JSON.stringify({mysql_version:'8.4.13',signature:'digests signatures OK',key_fingerprint:'BCA43417C3B485DD128EC6D4B7B3B788A8D3785C',binary_sha256:crypto.createHash('sha256').update(binary).digest('hex')},null,2)+'\n');console.log('Signed backup client prepared for isolated recovery tests')
