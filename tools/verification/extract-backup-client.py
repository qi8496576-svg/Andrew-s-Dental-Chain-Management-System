"""Extract only mysqlbinlog from the already signature-verified RPM's newc stream."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];d=R/'tmp/backup-tools'
assert 'digests signatures OK' in (d/'rpm-signature.txt').read_text('utf-8')
assert 'BCA43417C3B485DD128EC6D4B7B3B788A8D3785C' in (d/'key-fingerprint.txt').read_text('utf-8')
raw=(d/'client.cpio').read_bytes();at=0;found=False
while at+110<=len(raw):
 header=raw[at:at+110];assert header[:6] in [b'070701',b'070702']
 fields=[int(header[6+i*8:14+i*8],16) for i in range(13)];size=fields[6];name_size=fields[11]
 name=raw[at+110:at+110+name_size-1].decode('utf-8');begin=(at+110+name_size+3)&~3;end=begin+size;assert end<=len(raw)
 if name in ['./usr/bin/mysqlbinlog','usr/bin/mysqlbinlog']:
  binary=raw[begin:end];assert binary.startswith(b'\x7fELF')
  if header[:6]==b'070702':assert sum(binary)&0xffffffff==fields[12]
  (d/'mysqlbinlog').write_bytes(binary);found=True;break
 if name=='TRAILER!!!':break
 at=(end+3)&~3
assert found,'Matching client package did not contain mysqlbinlog'
proof={'mysql_version':'8.4.13','package':'mysql-community-client-8.4.13-1.el9.x86_64.rpm','source':'https://repo.mysql.com/yum/mysql-8.4-community/el/9/x86_64/mysql-community-client-8.4.13-1.el9.x86_64.rpm','signature':'digests signatures OK','key_fingerprint':'BCA43417C3B485DD128EC6D4B7B3B788A8D3785C','rpm_sha256':hashlib.sha256((d/'client.rpm').read_bytes()).hexdigest(),'binary_sha256':hashlib.sha256(binary).hexdigest(),'bytes':len(binary)}
(d/'provenance.json').write_text(json.dumps(proof,indent=2)+'\n','utf-8');print(json.dumps(proof))
