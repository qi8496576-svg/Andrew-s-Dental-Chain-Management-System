from pathlib import Path,PurePosixPath
import tarfile,json,hashlib,gzip,re,sys
p=Path(sys.argv[1]);archive=p/'backups.tar.gz';out=p/'verified';out.mkdir(exist_ok=True)
with tarfile.open(archive,'r:gz') as t:
 for member in t:
  name=PurePosixPath(member.name);assert not name.is_absolute() and '..' not in name.parts
  assert name.parts[0] in ['snapshots','archive','status.json']
  if member.isdir():continue
  assert member.isfile() and not member.issym() and not member.islnk()
  target=out.joinpath(*name.parts);target.parent.mkdir(parents=True,exist_ok=True)
  with t.extractfile(member) as source,target.open('wb') as dest:
   while block:=source.read(1024*1024):dest.write(block)
status=json.loads((out/'status.json').read_text('utf-8'));manifests=sorted((out/'snapshots').glob('*/MANIFEST'));assert manifests
for m in manifests:
 lines=m.read_text('utf-8').splitlines();assert len(lines)==10 and lines[0]=='ADC-FULL-BACKUP-V1'
 values=dict(s.split('=',1) for s in lines[1:]);assert values['schemas']=='adc_business,adc_identity,adc_audit' and values['server_uuid']==status['source_uuid']
 dump=m.parent/'full.sql.gz';assert dump.stat().st_size==int(values['dump_bytes']);assert hashlib.file_digest(dump.open('rb'),'sha256').hexdigest()==values['dump_sha256']
 with gzip.open(dump,'rb') as f:
  while f.read(1024*1024):pass
chain=(out/'archive/CHAIN').read_text('utf-8').splitlines();assert chain[0]=='ADC-BINLOG-CHAIN-V1' and chain[1]=='server_uuid='+status['source_uuid'];logs=[]
for line in chain[3:]:
 m=re.fullmatch(r'log=([A-Za-z0-9_.-]+)\t([0-9]+)\t([a-f0-9]{64})',line);assert m
 file=out/'archive'/m[1];assert file.stat().st_size==int(m[2]) and hashlib.file_digest(file.open('rb'),'sha256').hexdigest()==m[3];logs.append(m[1])
assert logs and [int(x.rsplit('.',1)[1]) for x in logs]==list(range(int(logs[0].rsplit('.',1)[1]),int(logs[-1].rsplit('.',1)[1])+1))
result={'status':'PASS','full_snapshots':len(manifests),'binary_log_files':len(logs),'source_uuid':status['source_uuid'],'archive_sha256':hashlib.file_digest(archive.open('rb'),'sha256').hexdigest(),'private_directory':str(p),'last_full_epoch':status['last_full_epoch'],'last_archive_epoch':status['last_archive_epoch']}
(p/'verification.json').write_text(json.dumps(result,indent=2)+'\n','utf-8');print(json.dumps(result))
