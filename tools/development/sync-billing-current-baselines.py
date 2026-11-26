from pathlib import Path
import json,re
R=Path(__file__).resolve().parents[2];F=R/'specs/001-system-specification'
rep={'19 表、163 字段、30 条外键':'24 表、209 字段、44 条外键','19表、163字段和30外键':'24表、209字段和44外键','19张业务表、163字段和30外键':'24张业务表、209字段和44外键','19张业务表':'24张业务表','原19业务表/163字段/30FK':'24业务表/209字段/44FK','19/163/30':'24/209/44','19/163':'24/209','PK/UK/30 FK':'PK/UK/44 FK','84个AC':'87个AC','83个operationId':'91个operationId','全部25项FR':'全部26项FR','83项操作目录':'91项操作目录','Spec的84个验收场景':'Spec的87个验收场景','维持24表、209字段和30外键':'维持24表、209字段和44外键'}
paths=[F/p for p in ['tasks.md','task-traceability.md','technical-data-model.md','traceability.md','checklists/requirements.md','checklists/design.md'] if (F/p).exists()]+[R/'docs/diagrams/README.md',R/'docs/references/conversion-report.md']
for p in paths:
 lines=p.read_text('utf-8').splitlines();out=[]
 for s in lines:
  if not re.match(r'^2026-\d\d-\d\d[：:]',s):
   for a,b in rep.items():s=s.replace(a,b)
  s=s.replace('禁止新增业务表/字段','业务变更以负责人已批准的24表字典及V201范围为准').replace('不新增支付业务','演示缴费及全额退款使用独立账单和订单，始终标识不扣真实款').replace('不新增支付、渠道、收退款、税费/折扣','演示费用与诊疗开票分开；真实微信商户支付、渠道对账、税费/折扣未接入').replace('没有支付、支付渠道或付款表','演示费用属于业务库的挂号费策略、号源保留、账单、支付及退款表；技术身份模型不重复存业务支付事实').replace('系统物理表总数33，业务表仍为 19','系统物理表总数38，业务表为24').replace('原 19 表，见业务基线报告','24 表，见当前业务基线报告').replace('保护原 ERD 的表/字段/键计数','与已批准ERD及V201后的字典保持一致').replace('原业务 44 条外键不变','业务库44条外键').replace('菜单权限、支付、成本封账','菜单权限、成本封账').replace('业务 19 表，技术 14 表','业务24表，技术14表').replace('56项任务、51项完成','64项任务，完成状态见tasks-catalog.json').replace('无支付关系','另以PatientBill、PaymentOrder及RefundOrder关联费用办理事实').replace('业务字段表保持19表、163字段和30外键','业务字段表为24表、209字段和44外键')
  out.append(s)
 p.write_text('\n'.join(out)+'\n','utf-8')
catalog=json.loads((F/'tasks-catalog.json').read_text('utf-8'))
for key,story in catalog['stories'].items():
 for field in ['rules','app','ui','check','entities']:
  if field in story:
   story[field]=story[field].replace('patient_details 原必填资料','patient_details 中姓名、生日及联系电话，其他资料可后补').replace('不引入支付/渠道/税费/折扣/退款','另建独立诊疗待缴账单，演示支付退款不回写Invoice/R1；不增加真实渠道、税费或折扣').replace('不显示收付款按钮或已付款文案','在独立费用页面提供有权限的演示缴费和退款入口')
for task in catalog['tasks']:
 for field in ['description','title']:
  if field in task:
   for a,b in rep.items():task[field]=task[field].replace(a,b)
catalog['execution_order']=[x for x in catalog['execution_order'] if x!='T063'];catalog['execution_order'].append('T063')
(F/'tasks-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n','utf-8')
mapping=json.loads((R/'docs/requirements/table-requirement-map.json').read_text('utf-8'))
schema=json.loads((R/'docs/diagrams/database/schema.json').read_text('utf-8'))
for t in schema[-5:]:
 if not any(x['table']==t['name'] for x in mapping):mapping.append({'analysis':t['label'],'table':t['name'],'strategy':'费用业务事实 → 表','requirements':['UC06'] if t['name']=='RegistrationFeePolicy' else ['UC01','UC04'],'schema_caption':t['caption'],'figures':['D1']})
(R/'docs/requirements/table-requirement-map.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2)+'\n','utf-8')
p=R/'docs/requirements/requirement-index.json';requirements=json.loads(p.read_text('utf-8'))
for row in requirements:
 new=['RegistrationFeePolicy','BookingHold','PatientBill','PaymentOrder','RefundOrder'] if row['id']=='UC01' else ['PatientBill','PaymentOrder','RefundOrder'] if row['id']=='UC04' else ['RegistrationFeePolicy'] if row['id']=='UC06' else []
 for field in ['tables','all_related_tables']:
  if field in row:row[field]=list(dict.fromkeys(row[field]+new))
p.write_text(json.dumps(requirements,ensure_ascii=False,indent=2)+'\n','utf-8')
print('Current task definitions, navigation references and table trace synchronized')
