from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
from lxml import etree as E
import json,re
R=Path(__file__).resolve().parents[2];F=R/'specs/001-system-specification';W=R/'安德鲁牙科连锁管理系统需求分析与设计.docx'
pairs=[('系统上线后首个资料齐备的完整自然季度','受控虚构完整自然季度演练'),('系统上线后首个资料齐备的完整季度','受控虚构完整自然季度演练'),('上线后首个资料齐备的完整自然季度','受控虚构完整自然季度演练'),('上线后首个资料齐备的完整季度','受控虚构完整自然季度演练'),('上线后首个资料齐备完整自然季度','受控虚构完整自然季度演练'),('上线首个资料齐备的完整季度','受控虚构完整自然季度演练'),('首个真实完整季度','受控虚构完整季度演练'),('首个真实、资料齐备的完整自然季度','受控虚构完整季度演练')]
note='本系统采用受控虚构完整自然季度演练验收，不将演练结果表述为真实营业结果。初始历史资料为明确标记的虚构夹具，核算、独立复核发布和分析通过真实后端与数据库执行；模拟业务时钟与实际执行耗时分开说明。资料齐备后核算及复核发布不超过1个工作日，统一资料覆盖率及有效治疗七项要素可追溯率均为100%；工作日历及缺项按表A1a处理。'
N={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(W) as z:parts={n:z.read(n) for n in z.namelist()}
doc=E.fromstring(parts['word/document.xml']);changed=0
for paragraph in doc.findall('.//w:p',N):
 nodes=paragraph.findall('.//w:t',N);old=''.join(x.text or '' for x in nodes);new=old
 for a,b in pairs:new=new.replace(a,b)
 if '系统在' in old and '按表A1a验收' in old:new=note
 if new!=old:
  nodes[0].text=new
  for n in nodes[1:]:n.text=''
  changed+=1
assert changed>=3,changed
parts['word/document.xml']=E.tostring(doc,xml_declaration=True,encoding='UTF-8',standalone=True);tmp=W.with_suffix('.pending.docx')
with ZipFile(tmp,'w',ZIP_DEFLATED) as z:
 for n,b in parts.items():z.writestr(n,b)
tmp.replace(W)
for name in ['spec.md','plan.md','quickstart.md','traceability.md','task-traceability.md']:
 p=F/name;s=p.read_text('utf-8')
 for a,b in pairs:s=s.replace(a,b)
 s=s.replace('上线后首个资料齐备完整自然季度','受控虚构完整自然季度演练').replace('模拟季度仅是演练，不能提前完成后续真实季度指标。','完整虚构季度按T056及AC-SC-01/02实际演练，不声称真实运营指标。').replace('真实完整自然季度的运行事实不能用模拟替代。','虚构完整季度的结果须来自实际服务与数据库，不表述为真实营业事实。').replace('不以模拟时钟替代','模拟时钟及实际执行耗时分开披露').replace('未到该时点保持未完成','尚未取得演练结果保持未完成')
 if name=='spec.md':s=s.replace('，2.0.0，Ratified','，3.0.0，Ratified');s=re.sub(r'(?m)^\| AC-SC-01 .*$', '| AC-SC-01 | 受控虚构完整自然季度，全部演练诊所资料、封账、零成本/归属、排班及模拟工作日历齐备 | 实际执行R1核算与独立复核发布，记录模拟业务时钟及实际墙钟耗时，资料等待单列 | 工作日耗时≤1；来源和金额可追溯，不跳过复核，不声称真实营业结果。 |',s);s=re.sub(r'(?m)^\| AC-SC-02 .*$', '| AC-SC-02 | 同一虚构完整季度的全部演练营业诊所、患者使用、预约及有效治疗明细齐备 | 从真实数据库计算覆盖率与七项要素追溯率，正向逐条核对并验证缺项会被识别 | 两项均100%；缺项明确拒绝完整结论，不凭页面打开或静态填入比例认定通过。 |',s)
 if name=='quickstart.md':s=s.replace('不能在当前虚构季度演练中提前勾选','按受控虚构季度的实际结果判定，不填造真实营业事实')
 p.write_text(s,'utf-8')
p=R/'.specify/memory/constitution.md';s=p.read_text('utf-8')
for a,b in pairs:s=s.replace(a,b)
s=s.replace('**Version**: 2.0.0','**Version**: 3.0.0');s+='\n季度验收采用负责人确认的受控虚构完整自然季度演练。R1、独立复核、100%资料覆盖及七项追溯不降低，初始虚构夹具、模拟业务时钟和实际墙钟耗时明确分开；不宣称真实营业效果。\n';p.write_text(s,'utf-8')
p=F/'tasks.md';s=p.read_text('utf-8');s=re.sub(r'(?m)^- \[ \] T056 .*$', '- [ ] T056 **受控虚构完整季度演练**。按AC-SC-01/02在隔离真实MySQL中准备完整虚构季度及全部演练诊所资料，实际执行R1核算和独立身份复核发布。统一资料覆盖和有效治疗七项追溯均100%，缺成本拒绝发布、缺诊所使用记录不伪报完整；模拟工作日耗时≤1，实际墙钟耗时另列。初始历史为明确标记的虚构夹具，不声称真实营业结果，不改变生产业务时钟或在线资料。文件：`backend/src/test/java/com/adc/infrastructure/CourseQuarterAcceptanceIT.java`、`docs/verification/business/first-complete-quarter.md`、`docs/verification/business/coverage-traceability.md`。依赖：T055。验收：AC-SC-01, AC-SC-02。',s);p.write_text(s,'utf-8')
p=F/'tasks-catalog.json';d=json.loads(p.read_text('utf-8'))
for t in d['tasks']:
 if t['id']=='T056':t.update(title='受控虚构完整季度演练',description=note,paths=['backend/src/test/java/com/adc/infrastructure/CourseQuarterAcceptanceIT.java','docs/verification/business/first-complete-quarter.md','docs/verification/business/coverage-traceability.md'])
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n','utf-8')
for name in ['ops/runbooks/release-checklist.md','docs/verification/release-readiness.md']:
 p=R/name;s=p.read_text('utf-8');s=s.replace('首个真实完整季度的覆盖率、七项追溯及一个工作日核算属于T056运行期验收，不能在当前虚构季度演练中提前勾选。','T056采用受控虚构完整季度演练，覆盖率、七项追溯及一个工作日核算须真实执行；结果不代表真实营业。').replace('需首个真实、资料齐备的完整自然季度，当前不具备运行期事实','受控虚构完整季度演练执行中，不再等待真实营业季度');p.write_text(s,'utf-8')
(F/'amendments/20261126-course-quarter.json').write_text(json.dumps({'date':'2026-11-26','status':'owner-authorized','scope':note,'pdf_export_policy':'Wait until Word content is stable; export once at the end','schema_or_production_clock_changed':False},ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({'word_paragraphs_updated':changed,'constitution':'3.0.0','pdf_exported':False},ensure_ascii=False))
