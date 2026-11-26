from pathlib import Path
import json,re
from copy import deepcopy
from zipfile import ZipFile,ZIP_DEFLATED
from lxml import etree as E
R=Path(__file__).resolve().parents[2];F=R/'specs/001-system-specification';N={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
word=R/'安德鲁牙科连锁管理系统需求分析与设计.docx'
with ZipFile(word) as z:parts={n:z.read(n) for n in z.namelist()}
doc=E.fromstring(parts['word/document.xml'])
def txt(e):return ''.join(e.xpath('.//w:t/text()',namespaces=N))
def settext(e,value):
 nodes=e.findall('.//w:t',N);nodes[0].text=value
 for n in nodes[1:]:n.text=''
for p in doc.findall('.//w:p',N):
 s=txt(p);v=s.replace('业务表仍为19张','业务表为24张')
 if s.startswith('15 张表使用无业务含义'):v='19张表使用无业务含义的BIGINT单列主键；PatientAllergy、DentistQualification、TreatmentQualification、AppointmentRequestedTreatment和RegistrationFeePolicy五张表采用复合主键。患者、门店、员工、费用凭据及治疗项目的业务编号另设唯一约束，业务改号不改变对象引用。'
 elif '15张业务表采用无业务含义' in s:v=s.replace('15张业务表采用无业务含义的单列代理主键，4张关联表采用两端外键组成的复合主键','19张业务表采用单列代理主键，5张表采用复合主键，包含原4张关联表及门店—医生挂号费策略')
 if v!=s:settext(p,v)
for table in doc.findall('.//w:body/w:tbl',N):
 rows=table.findall('w:tr',N)
 if not rows:continue
 header=[txt(c) for c in rows[0].findall('w:tc',N)]
 extra=[]
 if header==['业务请求','服务端处理及提交范围','失败与重试']:
  extra=[['收费预约与演示缴费','复核本人、排班、资质及正式/临时占用；冻结费用并保留号源，成功演示缴费后原子建立预约、支付记录、审计和回执。','过期或资料变更关闭保留；并发及重试不重复收费预约；演示不扣真实款。'],['账单查询与演示退款','本人或授权岗位按诊所范围读取账单；合法退号同事务全额演示退款；保留原单与退款原因。','旧关联和越权拒绝；重复退款不重复记账；原Invoice及R1不回写。']]
 elif header==['父表','子表','基数','实现方式']:
  extra=[['Clinic / Dentist','RegistrationFeePolicy','各1:N','clinic_id、dentist_id；二者组成策略主键'],['Patient / DentistSchedule','BookingHold','各1:N','patient_id、schedule_id；其余业务外键见表D28'],['BookingHold','PatientBill','1:0..1','hold_id可空且唯一；挂号账单必须关联号源'],['Invoice','PatientBill','1:0..1','invoice_id可空且唯一；诊疗账单必须关联费用凭据'],['PatientBill','PaymentOrder','1:0..1','bill_id非空且唯一'],['PaymentOrder','RefundOrder','1:0..1','payment_id非空且唯一，全额退款保留原因与操作者']]
 if extra:
  for values in extra:
   row=deepcopy(rows[-1])
   for c,v in zip(row.findall('w:tc',N),values):settext(c,v)
   table.append(row)
 if header==['表名','用途']:
  for row in table.findall('w:tr',N)[1:-1]:
   for c in row.findall('w:tc',N):
    borders=c.find('w:tcPr/w:tcBorders/w:bottom',N)
    if borders is not None:borders.getparent().remove(borders)
parts['word/document.xml']=E.tostring(doc,xml_declaration=True,encoding='UTF-8',standalone=True)
with ZipFile(word,'w',ZIP_DEFLATED) as z:
 for name,data in parts.items():z.writestr(name,data)
catalog=json.loads((F/'tasks-catalog.json').read_text(encoding='utf-8'))
definitions=[
 ('T057','精简登记及演示费用测试',['T051'],['backend/src/test/java/com/adc/infrastructure/PatientBillingIT.java','backend/src/test/java/com/adc/infrastructure/PatientBillingHttpIT.java','tests/unit/mini-registration.test.mjs'],['AC-PB-01','AC-PB-02','AC-PB-03'],'X'),
 ('T058','预约费用数据迁移与契约',['T057'],['backend/src/main/resources/db/migration/V201__patient_booking_and_demo_billing.sql','docs/diagrams/database/schema.json','specs/001-system-specification/contracts/openapi.json'],['AC-G04','AC-PB-02'],'X'),
 ('T059','精简资料与患者预约体验',['T058'],['apps/patient-miniprogram/miniprogram/pages/patient-bindings/index.ts','apps/patient-miniprogram/miniprogram/pages/appointment-booking/index.ts'],['AC-PB-01'],'X'),
 ('T060','号源保留及演示费用后端',['T058'],['backend/src/main/java/com/adc/application/PatientBillingService.java','backend/src/main/java/com/adc/infrastructure/PatientBillingStore.java','backend/src/main/java/com/adc/interfaces/PatientBillingController.java'],['AC-PB-02','AC-PB-03'],'X'),
 ('T061','双端费用及医生资料页面',['T059','T060'],['apps/admin/src/views/patient-bills/index.vue','apps/admin/src/views/organization-resources/DoctorFeePolicy.vue','apps/patient-miniprogram/miniprogram/pages/patient-bills/index.ts'],['AC-PB-01','AC-PB-03'],'X'),
 ('T062','预约缴费云端与微信联调',['T061'],['docs/verification/patient-billing-20261125/README.md','tools/deployment/configure-billing-demo.mjs'],['AC-PB-01','AC-PB-02','AC-PB-03'],' '),
 ('T063','当前需求文档与Spec一致性',['T058','T064'],['安德鲁牙科连锁管理系统需求分析与设计.docx','specs/001-system-specification/spec.md','tools/diagrams/verify.py'],['AC-G04','AC-G08','AC-PB-01','AC-PB-02','AC-PB-03'],' '),
 ('T064','确认并发布当前ERD及清理旧图源',['T058'],['图源/D1_数据库ER图.pdf','docs/diagrams/database/D1-database.dbml','docs/diagrams/official/D1.png'],['AC-G04'],' ')
]
newops=['createBookingHold','listPatientBills','getPatientBill','payDemoBill','closePatientBill','refundPatientBill','getRegistrationFee','setRegistrationFee']
api=json.loads((F/'contracts/openapi.json').read_text(encoding='utf-8'))
for id,title,deps,paths,acceptance,status in definitions:
 assert not any(t['id']==id for t in catalog['tasks'])
 catalog['tasks'].append(dict(id=id,key=id,title=title,legacy=[],description=title+'。依照已批准的最小变更范围实现并以实际结果验收。',story=None,dependencies=deps,paths=paths,acceptance=acceptance,requirements=['FR-026'],operations=newops if id=='T060' else [],status=status,parallel=False))
 catalog['execution_order'].append(id)
for op in newops:catalog['operations'][op]={'implementation':['T060','T061'],'contract_verification':['T057','T062']}
for ac in ['AC-PB-01','AC-PB-02','AC-PB-03']:catalog['acceptance_to_verification'][ac]=[t[0] for t in definitions if ac in t[4]]
catalog['updated_date']='2026-11-25';catalog['implementation_progress']['remaining_scope']='T052—T056按各自条件验收；T062—T064按本轮实际联调、图源及文档验证完成。真实商户扣款不在演示范围。'
(F/'tasks-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=F/'tasks.md';s=p.read_text(encoding='utf-8').replace('不引入支付/渠道/税费/折扣/退款','形成独立诊疗待缴账单；演示支付及退款由独立费用服务处理，不增加税费或折扣').replace('不显示收付款按钮或已付款文案','费用凭据与缴费记录分开显示，通过独立费用页面办理受控演示缴费')
s+='\n\n## 患者预约与演示费用\n\n'
for id,title,deps,paths,acceptance,status in definitions:s+=f'- [{status}] {id} **{title}**。'+('；'.join('`'+x+'`' for x in paths))+f'。依赖：{", ".join(deps)}。验收：{", ".join(acceptance)}。\n\n'
p.write_text(s,encoding='utf-8')
p=F/'task-traceability.md';s=p.read_text(encoding='utf-8');s+='\n\n## 患者预约与演示费用\n\n| 需求或验收 | 任务 |\n| --- | --- |\n| FR-026 | T057—T064 |\n| AC-PB-01 | T057、T059、T061、T062、T063 |\n| AC-PB-02 | T057、T058、T060、T062、T063 |\n| AC-PB-03 | T057、T060、T061、T062、T063 |\n\n'+ '\n'.join('| '+op+' | T060、T061；验证T057、T062 |' for op in newops)+'\n';p.write_text(s,encoding='utf-8')
print('Current 64-task trace and document data/fee relationships synchronized')
