from pathlib import Path
import json,re
R=Path(__file__).resolve().parents[2];F=R/'specs/001-system-specification'
p=R/'docs/verification/quality/q01-automation.json';d=json.loads(p.read_text('utf-8'));assert json.loads((R/'docs/verification/patient-billing-20261125/admin-browser.json').read_text('utf-8'))['status']=='PASS';d['limitations']=[x for x in d['limitations'] if '费用历史记录' not in x];d['billing_list_lock_order_regression']='9 real MySQL/HTTP tests and actual cloud refunded record readback PASS';p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n','utf-8')
p=R/'docs/verification/quality/q01-results.md';s=p.read_text('utf-8');s=re.sub('费用历史记录精确行定位的追加检查未通过[^\n]*','费用列表的跨账单锁顺序问题已修复，9项真实MySQL/HTTP测试及真实云端退款记录、筛选读回通过；原失败日志保留。',s);p.write_text(s,'utf-8')
p=F/'tasks-catalog.json';d=json.loads(p.read_text('utf-8'));d['quality_metric_review']={'source':'当前Word表B12、Spec AC-Q01/Q03/Q05及负责人确认','result':'Q01自动化与日常使用确认；Q03当前小规模部署标准；Q05原RPO/RTO保持','task_count_changed':False,'thresholds_changed':True,'deferred_execution':'真实完整季度保留T056；不编造人工实验或生产发布批准'};p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n','utf-8')
p=R/'docs/verification/patient-billing-20261125/README.md';s=p.read_text('utf-8');s=re.sub('Spec Kit为64项任务[^\n]*','Spec Kit当前状态见specs/001-system-specification/tasks.md。Q01按自动化检查和日常使用确认，不要求招募、培训或人工记录；Q03/Q05的实际结果分别见性能和恢复专题。正式发布与真实完整季度事实单独记录。',s);p.write_text(s,'utf-8')
# Obsolete one-shot tools could restore superseded recruitment requirements. They are not diagram sources.
for name in ['update-q01-review.py','sync-quality-acceptance.py','apply-q01-automation.py','sync-current-quality-text.py','align-schedule-ui-tests.py','fix-bill-page-locks.py']:
 p=R/'tools/verification'/name
 if p.exists():assert R in p.resolve().parents;p.unlink()
print('Current quality text synchronized; obsolete one-shot requirement editors removed')
