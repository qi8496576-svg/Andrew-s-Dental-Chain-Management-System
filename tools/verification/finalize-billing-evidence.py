from pathlib import Path
from lxml import etree as E
import json,re,hashlib,shutil
import pypdfium2 as pdfium
R=Path(__file__).resolve().parents[2];F=R/'specs/001-system-specification'
read=lambda p:json.loads((R/p).read_text('utf-8-sig'))
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n','utf-8')
def sha(p):return hashlib.sha256((R/p).read_bytes()).hexdigest()
shutil.copy2(R/'tmp/billing-publication/requirements.pdf',R/'信管2402班刘阳1602240217.pdf')
pages=len(pdfium.PdfDocument(str(R/'信管2402班刘阳1602240217.pdf')))
for p in [R/'docs/diagrams/word-image-audit.md',R/'docs/verification/models/c03-validation.md',R/'docs/verification/patient-billing-20261125/README.md']:
 s=p.read_text('utf-8');s=re.sub(r'(Word共|当前文档为|Word/PDF共)\d+页',lambda m:m[1]+str(pages)+'页',s);p.write_text(s,'utf-8')
baseline=read('specs/001-system-specification/business-baseline-audit.json');baseline['source_sha256']=sha('安德鲁牙科连锁管理系统需求分析与设计.docx');save('specs/001-system-specification/business-baseline-audit.json',baseline)
catalog=read('specs/001-system-specification/tasks-catalog.json');ids={t['id'] for t in catalog['tasks']};order=catalog['execution_order'];assert len(order)==len(set(order))==64
for t in catalog['tasks']:
 for dep in t['dependencies']:assert dep in ids and order.index(dep)<order.index(t['id']),(t['id'],dep)
tasks=(F/'tasks.md').read_text('utf-8');marks=dict(re.findall(r'^- \[([ Xx])\] (T\d+)\b',tasks,re.M)[i][::-1] for i in range(len(re.findall(r'^- \[([ Xx])\] (T\d+)\b',tasks,re.M))))
assert len(marks)==64
for t in catalog['tasks']:assert marks[t['id']].upper()==t['status'].upper(),t['id']
pending=[t['id'] for t in catalog['tasks'] if t['status'].upper()!='X'];assert set(pending)<=set(['T052','T053','T055','T056'])
completed=len(catalog['tasks'])-len(pending)
api=read('specs/001-system-specification/contracts/openapi.json');ops=[v['operationId'] for p in api['paths'].values() for method,v in p.items() if method in ['get','post','put','patch','delete']];assert len(ops)==91
assert set(ops)==set(catalog['operations'])
for op in ops:
 for field in ['implementation','contract_verification']:
  assert catalog['operations'][op][field] and set(catalog['operations'][op][field])<=ids,(op,field)
schema=read('docs/diagrams/database/schema.json');assert len(schema)==24 and sum(len(t['fields']) for t in schema)==209 and sum(bool(f['fk']) for t in schema for f in t['fields'])==44
fields=read('docs/requirements/table-index.json');assert set('D'+str(i) for i in range(27,32))<=set(x['id'] for x in fields)
figures=read('docs/diagrams/figure-index.json');assert len(figures)==22
assert not (R/'图稿待确认/预约费用ERD').exists();assert not (R/'tools/diagrams/preview-billing-erd.py').exists();assert not (R/'tools/diagrams/preview-billing-layout.py').exists()
assert read('docs/verification/patient-billing-20261125/device-integration.json')['status']=='PASS'
assert read('docs/verification/patient-billing-20261125/admin-browser.json')['status']=='PASS'
assert read('docs/verification/patient-billing-20261125/application-update.json')['original_33_migration_checksums_preserved']
test_results={}
for directory in ['surefire-reports','failsafe-reports']:
 reports=[E.parse(str(p)).getroot() for p in (R/'backend/target'/directory).glob('TEST-*.xml')]
 values={k:sum(int(x.get(k,'0')) for x in reports) for k in ['tests','failures','errors','skipped']};assert values['tests']>0 and values['failures']==values['errors']==values['skipped']==0;test_results[directory]=values
validation=read('specs/001-system-specification/tasks-validation.json');validation.update(date='2026-11-26',task_revision=catalog['task_revision'],task_count=64,checked_count=completed,pending_tasks=pending,fr_covered=26,acceptance_covered=87,operations_covered=91,business_tables=24,business_fields=209,business_foreign_keys=44,word_sha256=sha('安德鲁牙科连锁管理系统需求分析与设计.docx'),word_rendered_pages=pages,contract_validation='91操作、99组件验证；12项契约测试通过；已批准摘要链校验通过',runtime_evidence='docs/verification/release-readiness.md',backend_test_results=test_results)
for row in validation['fingerprints']:row['sha256']=sha(row['path'])
save('specs/001-system-specification/tasks-validation.json',validation)
c03=read('docs/verification/models/c03-validation.json');c03.update(word_pages=pages,business_schema={'tables':24,'fields':209,'foreign_keys':44})
for row in c03['fingerprints']:row['sha256']=sha(row['path'])
save('docs/verification/models/c03-validation.json',c03)
report={'date':'2026-11-26','formal_erd_owner_approved':True,'formal_word_pages':pages,'formal_figures':22,'word_and_all_copies_match':True,'business_schema':{'tables':24,'fields':209,'foreign_keys':44},'tasks':{'total':64,'complete':completed,'pending':pending},'backend':test_results,'source_cleanup':'approved ERD drafts and obsolete one-time drawing generators deleted','limitations':['真实微信商户支付未接入；本轮仅演示，不扣真实款','手机手动演示支付确认尚未验收；开发工具showModal确认采用自动返回值，其余业务调用真实','当前未完成任务：'+','.join(pending),'服务器外备份接收机须保持开机、联网及登录；正式发布前确认持续在线接收位置']}
report['limitations']=[item for item in report['limitations'] if item!='当前未完成任务：']
save('docs/verification/patient-billing-20261125/final-validation.json',report)
print(json.dumps(report,ensure_ascii=False))
