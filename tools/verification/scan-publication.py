"""Scan only the curated public tree; output paths and counts, never secret values."""
from pathlib import Path
import os,re,json,zipfile,hashlib
ROOT=Path(__file__).resolve().parents[2]
DEST=ROOT/'tmp/github-publication/shallow'
patterns={
 'private_key':rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
 'github_token':rb'(?<![\w-])(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})',
 'tencent_secret_id':rb'AKID[A-Za-z0-9]{30,}',
 'aws_key':rb'AKIA[A-Z0-9]{16}',
 'wechat_session_key':rb'"session_key"\s*:\s*"[A-Za-z0-9+/]{20,}={0,2}"',
}
secrets=set()
private=Path('D:/secrets/AndrewDental')
def visit(v,key=''):
 if isinstance(v,dict):
  for k,x in v.items():visit(x,k)
 elif isinstance(v,list):
  for x in v:visit(x,key)
 elif isinstance(v,str) and len(v)>=12 and re.search(r'password|secret|token|cookie|session_key',key,re.I):secrets.add(v.encode())
if private.is_dir():
 for p in private.rglob('*.json'):
  try:visit(json.loads(p.read_text('utf-8-sig')))
  except (ValueError,OSError):pass
 for p in private.rglob('*'):
  if p.is_file() and (p.name in {'mysql-root','migration','adc.auth-secret','adc.wechat.app-secret','spring.datasource.password'}):
   try:
    v=p.read_bytes().strip()
    if len(v)>=12:secrets.add(v)
   except OSError:pass
findings=[];count=0
manifest=json.loads((ROOT/'tmp/github-publication/inventory.json').read_text('utf8'))
paths=set(manifest['files'])|{'D1_数据库ER图.pdf'}
for rel in sorted(paths):
  p=DEST/rel;data=p.read_bytes();count+=1
  buffers=[data]
  if p.suffix=='.docx':
   with zipfile.ZipFile(p) as z:buffers.extend(z.read(n) for n in z.namelist() if n.endswith('.xml'))
  for kind,pattern in patterns.items():
   if any(re.search(pattern,b) for b in buffers):findings.append({'path':rel,'kind':kind})
  if any(value in b for value in secrets for b in buffers):findings.append({'path':rel,'kind':'exact_owner_secret'})
result={'files_scanned':count,'known_owner_values_checked':len(secrets),'findings':findings,'passed':not findings,'secret_values_printed':False}
(ROOT/'tmp/github-publication/security-scan.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf8')
print(json.dumps(result,ensure_ascii=False));raise SystemExit(0 if not findings else 1)
