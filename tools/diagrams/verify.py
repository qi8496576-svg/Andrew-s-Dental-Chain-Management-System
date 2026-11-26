from pathlib import Path
from zipfile import ZipFile
from lxml import etree as E
import hashlib,json,re
ROOT=Path.cwd();H=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
figures=json.loads((ROOT/'docs/diagrams/figure-index.json').read_text(encoding='utf8'))
word=ROOT/'安德鲁牙科连锁管理系统需求分析与设计.docx';ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(word) as z:
 document=E.fromstring(z.read('word/document.xml'))
 for f in figures:
  assert (ROOT/f['source']).exists(),f['source']
  expected=f['media_sha256'];assert H(ROOT/f['official_image'])==expected,f['id']
  assert hashlib.sha256(z.read('word/media/'+Path(f['media']).name)).hexdigest()==expected,f['id']
  assert H(ROOT/f['media'])==expected,f['media']
  for alias in f['matching_original_pngs']:assert H(ROOT/alias)==expected,alias
  if f['source'].endswith('.svg'):
   source=ROOT/f['source'];r=E.fromstring(source.read_bytes())
   assert E.QName(r).localname=='svg'
   assert H(source)==H(ROOT/'docs/diagrams/official'/(f['id']+'.svg')),f['id']
   colors={e.get(k) for e in r.iter() for k in ['fill','stroke'] if e.get(k)}
   assert colors<={'black','white','none'},(f['id'],colors)
   for alias in f['matching_original_pngs']:assert H((ROOT/alias).with_suffix('.svg'))==H(source)
 assert len(figures)==22
for copy in ['docs/originals','docs/references/provided']:assert H(ROOT/copy/word.name)==H(word)
baseline=json.loads((ROOT/'docs/originals/baseline.json').read_text(encoding='utf8'));assert baseline['sha256']==H(word)
rows=[]
for table in document.findall('.//w:body/w:tbl',ns):
 data=[[''.join(c.xpath('.//w:t/text()',namespaces=ns)) for c in row.findall('w:tc',ns)] for row in table.findall('w:tr',ns)]
 if data and data[0][0]=='字段名':rows.append(data)
schema=json.loads((ROOT/'docs/diagrams/database/schema.json').read_text(encoding='utf8'))
assert len(rows)==len(schema)==24
for data,table in zip(rows,schema):
 expected=[[f['name'],f['type'],'Yes' if f['pk'] else 'No',f['fk'] or 'No','NULL' if f['nullable'] else 'NOT NULL',f['unique'] or '-'] for f in table['fields']]
 actual=[r[:3]+[r[3].removeprefix('FK:')]+r[4:] for r in data[1:]]
 assert actual==expected,table['name']
assert sum(len(t['fields']) for t in schema)==209
assert sum(bool(f['fk']) for t in schema for f in t['fields'])==44
print('PASS: 22 Word/PNG figures match; 18 canonical SVGs match; current Word copies identical; 24 business field tables / 209 fields / 44 FKs match')
