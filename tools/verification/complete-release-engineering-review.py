from pathlib import Path
from lxml import etree as E
import json,hashlib,re,shutil
R=Path(__file__).resolve().parents[2];F=R/'specs/001-system-specification'
def read(p):return json.loads((R/p).read_text('utf-8-sig'))
log=(R/'tmp/patient-billing-full-tests.log').read_text('utf-8');assert 'BUILD SUCCESS' in log
summary=E.parse(str(R/'backend/target/failsafe-reports/failsafe-summary.xml')).getroot();counts={k:int(summary.findtext(k,'0')) for k in ['completed','errors','failures','skipped']};assert counts['completed']>=174 and not any(counts[k] for k in ['errors','failures','skipped'])
assert 'pass 12' in (R/'tmp/final-contract-check.log').read_text('utf-8')
for p in ['docs/verification/quality/q01-automation.json','docs/verification/performance/q03-small-run.json','docs/verification/performance/q03-cloud-read.json','docs/verification/recovery/q05-local-drill.json','docs/verification/recovery/q05-cloud-drill.json']:assert read(p).get('status')=='PASS'
runtime=read('docs/verification/release-runtime-status.json');assert all(x['health']=='healthy' for x in runtime['containers'])
deployment=read('docs/verification/performance/application-update.json');image=deployment['candidate']['images'][0]['id'];assert image==next(x['image'] for x in runtime['containers'] if 'backend' in x['name'])
shutil.copy2(R/'tmp/patient-billing-full-tests.log',R/'docs/verification/release-full-backend.log');shutil.copy2(R/'backend/target/failsafe-reports/failsafe-summary.xml',R/'docs/verification/release-full-failsafe-summary.xml')
report={'date':'2026-11-26','engineering_review':'COMPLETE','production_release':'NOT_AUTHORIZED_OR_EXECUTED','candidate_release':deployment['candidate']['release'],'backend_image':image,'full_integration_counts':counts,'unit_tests':24,'admin_component_tests':53,'browser_tests':19,'patient_tests':32,'contract_tests':12,'quarter_acceptance':'T056 next; controlled fictional complete-quarter drill, no real-quarter claim','documentation_pdf':'export once after final Word stabilizes','remaining_production_conditions':['负责人对具体候选的正式发布批准','小程序ICP备案及平台发布条件由负责人自行办理','正式持续运行前确认持续在线的服务器外备份接收位置，当前Windows任务需要开机联网并登录'],'limitations':['演示支付，不扣真实款；真实商户支付未接入','本轮微信工具未连接；已有真实微信联调与当前自动化范围分别保留，不伪称新增真机实验']}
(R/'docs/verification/release-engineering-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
p=F/'tasks.md';s=p.read_text('utf-8').replace('- [ ] T055 ','- [X] T055 ');marks=re.findall(r'^- \[([ Xx])\] (T\d+)',s,re.M);pending=[t for m,t in marks if m==' '];s=re.sub(r'当前64项任务已完成\d+项[^\n]*',f'当前64项任务已完成{64-len(pending)}项，未完成项目：'+','.join(pending)+'。工程审核不等于正式发布授权，详见验收证据。',s);p.write_text(s,'utf-8')
p=F/'tasks-catalog.json';d=json.loads(p.read_text('utf-8'))
for t in d['tasks']:
 if t['id']=='T055':t['status']='X';t['completion_evidence']='docs/verification/release-engineering-review.json'
d['implementation_progress'].update(completed_task_count=64-len(pending),pending_tasks=pending,remaining_scope='当前未完成：'+','.join(pending)+'；正式发布另需负责人批准及平台条件');d['quality_metric_review']['deferred_execution']='T056采用受控虚构完整季度实际演练，不声称真实营业结果';p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n','utf-8')
p=R/'docs/verification/release-readiness.md';s=p.read_text('utf-8');s+='\n工程就绪审核已完成，具体候选、全量测试和正式发布前条件见release-engineering-review.json。T055完成表示审核和未完成条件清单已形成，不表示正式发布获批。T056随后执行受控虚构完整季度演练。\n';p.write_text(s,'utf-8')
p=F/'plan.md';s=p.read_text('utf-8').replace('Constitution 2.0.0','Constitution 3.0.0');p.write_text(s,'utf-8')
print(json.dumps(report,ensure_ascii=False))
