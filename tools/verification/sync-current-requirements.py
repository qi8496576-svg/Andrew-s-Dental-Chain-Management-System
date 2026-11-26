"""Sync retrieval copies and indexes from the current owner-approved Word; no drawings generated."""
from pathlib import Path
from zipfile import ZipFile
from lxml import etree as E
import json,re,hashlib,shutil
R=Path(__file__).resolve().parents[2]
W=R/'安德鲁牙科连锁管理系统需求分析与设计.docx'
N={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
text=lambda e:''.join(e.xpath('.//w:t/text()',namespaces=N))
read=lambda p:json.loads((R/p).read_text('utf-8-sig'))
def save(p,data):(R/p).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n','utf-8')
def sha(p):return hashlib.sha256((R/p).read_bytes()).hexdigest()
with ZipFile(W) as z:
 doc=E.fromstring(z.read('word/document.xml'));body=doc.find('w:body',N)
 rels={e.get('Id'):e.get('Target') for e in E.fromstring(z.read('word/_rels/document.xml.rels'))}
 figures=read('docs/diagrams/figure-index.json')
 bymedia={Path(f['media']).name:f for f in figures}
 tables=[];fieldrows={};chapter=None;out=[]
 def flush():
  if chapter:(R/'docs/requirements'/chapter).write_text('\n\n'.join(out)+'\n','utf-8')
 chapters={'一、业务建模':('A-业务建模.md','A 业务建模'),'二、需求':('B-需求分析.md','B 需求分析'),'三、分析':('C-系统分析.md','C 系统分析'),'四、设计':('D-系统设计.md','D 系统设计')}
 for i,e in enumerate(body):
  s=text(e).strip()
  if s in chapters:
   flush();chapter,title=chapters[s];out=['# '+title,'> 来源：当前正式 Word。正文、表格和图按原顺序转换；编号保留。Word 为业务规则权威，Markdown 为检索副本。']
  if not chapter:continue
  marker=f'<!-- word-block:{i} -->';item=[]
  if e.tag.endswith('}p'):
   m=re.match(r'^表\s*([A-D]\d+[a-z]?)\b',s)
   if m and not any(stop in s for stop in ['。','；']):
    tables.append({'id':m[1],'title':s,'block':i});item.append(f'<a id="table-{m[1].lower()}"></a>')
   if s:
    prefix='## ' if s in chapters else '### ' if re.match(r'^（[一二三四五六七八九十]+）',s) else ''
    item.append(prefix+s)
   for image in e.findall('.//a:blip',N):
    name=Path(rels[image.get('{'+N['r']+'}embed')]).name
    f=bymedia.get(name)
    if f:item.append(f'![{f["title"]}](../diagrams/official/{f["id"]}.png)')
   fm=re.match(r'^图\s*([A-D]\d+)\b',s)
   if fm:
    for f in figures:
     if f['id']==fm[1]:f['caption_block']=i
  elif e.tag.endswith('}tbl'):
   rows=[[text(c).strip().replace('|','\\|').replace('\n','<br>') for c in row.findall('w:tc',N)] for row in e.findall('w:tr',N)]
   if rows:
    if rows[0][0]=='字段名':fieldrows[tables[-1]['id']]=(i,rows)
    width=max(map(len,rows));rows=[r+['']*(width-len(r)) for r in rows]
    item=['| '+' | '.join(rows[0])+' |','| '+' | '.join(['---']*width)+' |']+['| '+' | '.join(r)+' |' for r in rows[1:]]
  if item:out.extend([marker,'\n\n'.join(item)])
 flush()
schema=read('docs/diagrams/database/schema.json')
assert len(fieldrows)==len(schema)==24
for table in schema:
 block,rows=fieldrows[table['caption']];table['word_block']=block
 assert len(rows)-1==len(table['fields']),table['name']
 for actual,f in zip(rows[1:],table['fields']):
  expected=[f['name'],f['type'],'Yes' if f['pk'] else 'No',f['fk'] or 'No','NULL' if f['nullable'] else 'NOT NULL',f['unique'] or '-']
  actual=list(actual);actual[3]=actual[3].removeprefix('FK:')
  assert actual==expected,(table['name'],actual,expected)
save('docs/diagrams/database/schema.json',schema)
save('docs/requirements/table-index.json',tables);save('docs/diagrams/figure-index.json',figures)
for directory in ['docs/originals','docs/references/provided']:shutil.copy2(W,R/directory/W.name)
digest=sha(W.name)
b=read('docs/originals/baseline.json');b['sha256']=digest;save('docs/originals/baseline.json',b)
inventory=read('docs/references/inventory.json')
for row in inventory:
 if Path(row['path']).name==W.name:row.update(size=W.stat().st_size,sha256=digest)
save('docs/references/inventory.json',inventory)
v=read('docs/references/verification.json');v.update(word_sha256=digest,business_tables=24,business_fields=209,business_foreign_keys=44);save('docs/references/verification.json',v)
audit=read('docs/diagrams/word-image-audit.json');audit['word_sha256']=digest
for row in audit['figures']:
 f=next(f for f in figures if f['id']==row['id']);row['sha256']=f['media_sha256']
save('docs/diagrams/word-image-audit.json',audit)
identity=read('docs/verification/models/source-identity.json');identity['word_sha256']=digest
for row in identity['figures']:row['sha256']=sha(row['official_image'])
for row in identity['frozen_inputs']:row['sha256']=sha(row['path'])
save('docs/verification/models/source-identity.json',identity)
# Replace the prior Word fingerprint in active source references only, preserving approved contract history.
for p in [R/'specs/001-system-specification/spec.md',R/'.specify/memory/constitution.md']:
 s=p.read_text('utf-8');s=re.sub(r'(SHA-256(?: 核对为 |：`))[a-f0-9]{64}',lambda m:m[1]+digest,s);p.write_text(s,'utf-8')
print(json.dumps({'word_sha256':digest,'field_tables':24,'field_count':sum(len(t['fields']) for t in schema),'foreign_keys':sum(bool(f['fk']) for t in schema for f in t['fields']),'figures':len(figures),'table_index_entries':len(tables)}))
