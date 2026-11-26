from pathlib import Path
from lxml import etree as E
import json,re
R=Path(__file__).resolve().parents[2];F=R/'specs/001-system-specification'
cloud=json.loads((R/'docs/verification/quality/q01-cloud-pages.json').read_text('utf-8'));assert cloud['status']=='PASS' and len(cloud['pages'])==9
assert json.loads((R/'docs/verification/patient-billing-20261125/admin-browser.json').read_text('utf-8'))['status']=='PASS','Real bill data readback must pass before completing Q01'
admin=E.parse(str(R/'apps/admin/test-results/vitest.xml')).getroot();browser=E.parse(str(R/'apps/admin/test-results/playwright.xml')).getroot()
assert int(admin.get('tests','0'))==53 and int(admin.get('failures','0'))==0
assert int(browser.get('tests','0'))==19 and int(browser.get('failures','0'))==0
assert 'pass 32' in (R/'tmp/q01-mini-tests.log').read_text('utf-8')
report={'date':'2026-11-26','status':'PASS','human_experiment_required':False,'admin_component_tests':53,'browser_tests':19,'patient_interaction_tests':32,'real_cloud_pages':9,'api_mocked_in_cloud_page_check':False,'developer_tool_rechecked_this_run':False,'limitations':['组件及本机浏览器夹具测试使用受控模拟接口，实际云端页面走查没有mock','现有真实微信业务联调保留原范围；本轮开发工具连接不可用，未声称重做原生或真机实验','费用历史记录精确行定位的追加检查未通过，保留于admin-browser.json，未作为Q01页面走查成功的依据']}
(R/'docs/verification/quality/q01-automation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
(R/'docs/verification/quality/q01-results.md').write_text('# Q01 页面与业务流程体验检查\n\n当前自动化标准通过，不要求招募参与者、培训或提交人工实验记录。\n\n管理端53项组件测试、19项浏览器测试，患者端32项交互测试通过；双端类型检查和构建通过。组件及本机浏览器夹具使用受控模拟接口，覆盖导航、预约、诊疗提示、费用确认、未知结果查询和排班的周概览、日视图及筛选。真实云端九个主要业务页面实际登录、路由、标题、内容及脚本错误检查通过，无API mock。\n\n排班路由首次模块编译已移至测试准备阶段，导航断言时限保留；旧布局浏览器用例已按当前界面更新。正式图稿没有改变。\n\n结果及范围见q01-automation.json与q01-cloud-pages.json。当前微信工具连接不可用，未声称本轮重做原生或真机实验。费用历史记录精确行定位的追加检查未通过，保留原失败记录供发布审核继续定位；它不作为本项页面走查通过的依据。\n','utf-8')
p=F/'tasks.md';s=p.read_text('utf-8').replace('- [ ] T052 ','- [X] T052 ');marks=re.findall(r'^- \[([ Xx])\] (T\d+)',s,re.M);pending=[i for m,i in marks if m==' '];complete=len(marks)-len(pending);s=re.sub(r'当前64项任务已完成\d+项[^\n]*',f'当前64项任务已完成{complete}项，未完成项目：'+','.join(pending)+'。实际证据见tasks-catalog.json。',s);p.write_text(s,'utf-8')
p=F/'tasks-catalog.json';d=json.loads(p.read_text('utf-8'))
for t in d['tasks']:
 if t['id']=='T052':t['status']='X'
d['implementation_progress'].update(date='2026-11-26',completed_task_count=complete,pending_tasks=pending,remaining_scope='当前未完成：'+','.join(pending)+'。Q01不再要求人工实验记录。');p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n','utf-8')
p=R/'docs/verification/release-readiness.md';s=p.read_text('utf-8').replace('自动化检查执行中；不再要求招募、培训或人工记录','自动化检查通过，范围与限制见quality/q01-results.md；不要求人工实验记录');p.write_text(s,'utf-8')
print(json.dumps(report,ensure_ascii=False))
