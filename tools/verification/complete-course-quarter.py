from pathlib import Path
import json,re,shutil
R=Path(__file__).resolve().parents[2];F=R/'specs/001-system-specification';B=R/'docs/verification/business'
d=json.loads((B/'course-quarter.json').read_text('utf-8'));assert d['status']=='PASS' and d['calculator']!=d['reviewer'];assert d['incomplete_publication_rejected'] and d['missing_clinic_usage_rejected'];c=d['results']['coverage'];t=d['results']['traceability'];assert c['value']==t['value']=='1.000000';assert c['numerator']==c['denominator']=='2';assert t['numerator']==t['denominator']=='3'
shutil.copy2(R/'tmp/billing-regression.log',B/'course-quarter-tests.log')
(B/'first-complete-quarter.md').write_text(f'''# 受控虚构完整季度演练

结果：PASS。评价期间为{d['period']}，全部两个虚构营业门店及两个参与核算的牙医均在演练范围内。初始历史是明确标记的受控夹具，不是逐笔历史API的真实营业记录；随后核算、独立复核、分析和保存使用实际服务、鉴权、事务与MySQL。

R1核算得到收入1000.00、医疗用品100.00、运营费用200.00，净利润{d['r1_profit']}、激励{d['r1_incentive']}。计算身份{d['calculator']}与复核发布身份{d['reviewer']}分离，两名牙医均成功发布当前版本。

模拟业务时钟固定在2026-11-11，模拟工作日历计算为0个工作日；实际执行墙钟耗时{d['wall_seconds']:.3f}秒。两者分开披露，结果不代表真实营业季度、真实吞吐或实际运营效果。

缺成本时结果为INCOMPLETE并拒绝发布；刻意构造某门店缺少当季治疗使用记录时，返回DATA_USAGE_EVIDENCE_INCOMPLETE，未伪报100%。比例及来源见coverage-traceability.md与course-quarter.json。

重复入口：tools/verification/Verify-BillingRegression.ps1 -Cases CourseQuarterAcceptanceIT。需要已就绪的Docker、Java21及项目依赖；仅新建和清理本次拥有的隔离MySQL，不修改云端数据、结构或生产业务时钟。原始结果位于course-quarter-tests.log及后端对应JUnit报告。
''','utf-8')
rows='\n'.join('| '+r['clinic_id']+' | '+str(r['patient_usage_evidence'])+' | '+str(r['appointment_usage_evidence'])+' | '+str(r['treatment_usage_evidence'])+' |' for r in c['rows'])
(B/'coverage-traceability.md').write_text(f'''# 虚构季度资料覆盖及七项要素追溯

实测覆盖率为{c['numerator']}/{c['denominator']}，100%；七项要素完整为{t['numerator']}/{t['denominator']}，100%，缺失数0。不是静态页面中写入的比例，取自同一受控季度真实数据库及分析服务结果。

| 虚构门店 | 患者使用证据 | 预约使用证据 | 治疗使用证据 |
| --- | --- | --- | --- |
{rows}

七项为患者、就诊、实际实施牙医、治疗项目、标准单位数、历史单价和实施时间。全部3条有效治疗均逐项纳入，含收费及免费治疗；源快照摘要、完整诊所名单及演练日历引用见course-quarter.json。

反向检查刻意构造门店季度使用缺项，系统拒绝完整覆盖结论。所有资料均为虚构夹具；本结果不表示实际营业诊所或真实患者的运营效果。
''','utf-8')
p=F/'tasks.md';s=p.read_text('utf-8').replace('- [ ] T056 ','- [X] T056 ');assert len(re.findall(r'^- \[[Xx]\] T\d+',s,re.M))==64;s=re.sub(r'当前64项任务已完成\d+项[^\n]*','当前64项任务已按已批准的课程虚构演示及自动化验收口径完成。正式发布批准、平台上架及真实微信商户支付不在已完成声明内；具体证据见tasks-catalog.json。',s);p.write_text(s,'utf-8')
p=F/'tasks-catalog.json';x=json.loads(p.read_text('utf-8'))
for task in x['tasks']:
 if task['id']=='T056':task['status']='X';task['completion_evidence']='docs/verification/business/course-quarter.json'
x['status']='implementation-and-approved-course-acceptance-complete';x['task_revision']='ADC-TASKS-20261126-02';x['implementation_progress'].update(completed_through='T064',completed_task_count=64,next_task=None,pending_tasks=[],remaining_scope='当前已批准课程实现及验收任务完成；正式发布批准、平台条件和真实商户支付另行处理');p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n','utf-8')
p=F/'spec.md';s=p.read_text('utf-8').replace('质量验收尚未执行。','当前质量结果见各任务证据，不以文档存在推断执行结果。');s=re.sub('当前质量验收以任务及实际证据为准。[^\n]*','当前已批准课程实现及验收任务均有对应证据：Q01自动化、Q03当前小规模部署、Q05恢复及T056受控虚构完整季度演练已通过，TD-01一期不自动删除。正式发布与平台上架未执行，不将演练表述为真实营业结果。',s);p.write_text(s,'utf-8')
p=R/'docs/verification/release-readiness.md';s=p.read_text('utf-8').replace('受控虚构完整季度演练执行中，不再等待真实营业季度','受控虚构完整季度演练已通过；来源、模拟时钟及实际耗时分开披露').replace('T056随后执行受控虚构完整季度演练。','T056受控虚构完整季度演练已完成，工程任务64/64；正式发布仍需条件确认及负责人批准。');p.write_text(s,'utf-8')
p=R/'docs/verification/release-engineering-review.json';x=json.loads(p.read_text('utf-8'));x['quarter_acceptance']='PASS: controlled fictional complete-quarter drill; not real operations';p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({'tasks_complete':64,'quarter_status':'PASS','coverage':'2/2','traceability':'3/3','wall_seconds':d['wall_seconds'],'pdf_exported':False},ensure_ascii=False))
