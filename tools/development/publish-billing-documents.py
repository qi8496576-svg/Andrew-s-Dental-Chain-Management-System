from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
from lxml import etree as E
from copy import deepcopy
import json,re,hashlib,shutil
R=Path(__file__).resolve().parents[2];N={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'};W='{'+N['w']+'}'
def text(e):return ''.join(e.xpath('.//w:t/text()',namespaces=N))
def settext(e,value):
 nodes=e.findall('.//w:t',N)
 if not nodes:
  run=E.SubElement(e,W+'r');nodes=[E.SubElement(run,W+'t')]
 nodes[0].text=value
 for n in nodes[1:]:n.text=''
def writejson(path,value):(R/path).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
H=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
schema=json.loads((R/'docs/diagrams/database/schema.json').read_text(encoding='utf-8'))
for i,t in enumerate(schema[-5:]):t['caption']='D'+str(27+i)
writejson('docs/diagrams/database/schema.json',schema)
review=R/'图稿待确认/预约费用ERD';figs=json.loads((R/'docs/diagrams/figure-index.json').read_text(encoding='utf-8'));erd=next(f for f in figs if f['id']=='D1')
shutil.copyfile(review/'D1-预约费用ERD待确认.pdf',R/'图源/D1_数据库ER图.pdf')
for file in [erd['official_image'],erd['media'],*erd['matching_original_pngs']]:shutil.copyfile(review/'D1-预约费用ERD待确认.png',R/file)
erd['media_sha256']=H(R/erd['official_image']);erd['source_status']='owner-approved-20261125-layout; current-vector-pdf-and-dbml';writejson('docs/diagrams/figure-index.json',figs)
# Keep the established DBML notes and original conditional/index definitions.
p=R/'docs/diagrams/database/D1-database.dbml';dbml=p.read_text(encoding='utf-8').replace('19 tables, 163 fields, 30 foreign keys','24 tables, 209 fields, 44 foreign keys').replace('独立于19张业务表','独立于24张业务表')
for name in ['billing_address','emergency_contact_name','emergency_contact_phone']:dbml=re.sub(r'(?m)^(  '+name+r' [^\n]+)\[not null\]',r'\1[null]',dbml,count=1)
match=re.search(r'Table Dentist \{.*?\n\}',dbml,re.S);block=match.group(0);block=block[:-2]+''.join(f'\n  {f["name"]} {f["type"].lower()} [null]' for f in schema[4]['fields'][-3:])+'\n}';dbml=dbml[:match.start()]+block+dbml[match.end():]
for t in schema[-5:]:
 dbml+='\n\nTable '+t['name']+" {\n  Note: '"+t['caption']+' '+t['label']+"；完整约束参见 constraints.md'\n"
 for f in t['fields']:
  opts=['null' if f['nullable'] else 'not null']
  if f['pk'] and sum(x['pk'] for x in t['fields'])==1:opts+=['pk']
  if f['unique']=='UNIQUE':opts+=['unique']
  dbml+='  '+f['name']+' '+f['type'].lower()+' ['+', '.join(opts)+']\n'
 pk=[f['name'] for f in t['fields'] if f['pk']]
 if len(pk)>1:dbml+='  indexes {\n    ('+', '.join(pk)+') [pk]\n  }\n'
 dbml+='}\n'
 for f in t['fields']:
  if f['fk']:dbml+='Ref: '+t['name']+'.'+f['name']+' > '+f['fk']+'\n'
p.write_text(dbml,encoding='utf-8')
# Update the actual Word while retaining all original paragraph/table formatting.
word=R/'安德鲁牙科连锁管理系统需求分析与设计.docx'
with ZipFile(word) as z:parts={n:z.read(n) for n in z.namelist()}
doc=E.fromstring(parts['word/document.xml']);body=doc.find('w:body',N);replacements={}
explicit={
 106:'首次患者自行填写姓名、出生日期、联系电话和本人过敏声明并确认，系统生成唯一患者编号、新建本人档案并自动关联当前微信账号，不要求人工批准。地址、邮箱及紧急联系人后补。已有档案按当前有效关联或前台核实结果识别；受保护资料冲突或疑似重复不得自动覆盖、合并或认领。',
 177:'就诊结算核定实际治疗费用并生成唯一费用凭据，同时形成独立待缴账单。INVOICED不表示已付款。挂号费由门店按医生配置，收费预约先短时保留号源，支付成功后正式建立预约。本系统在明确的虚构测试门店提供演示缴费和全额退款，始终标识“演示支付，不扣真实款”，不调用微信扣款。真实微信支付及渠道对账须另行接入商户服务；演示金额不计入真实收款，R1继续按实际诊疗开票口径计算。',
 232:'字段列表：患者编号、姓名、出生日期、联系电话；联系地址、邮箱及紧急联系人可在后续就诊补充；本人过敏声明、过敏目录项、程度、备注、确认状态、核实人和原因。',
 320:'结算控制先让就诊确认可结算，再创建结算单。结算单委托就诊组织有效施用治疗，每项施用治疗将历史价格与单位数计入结算明细，结算单汇总总价。唯一结算单、开票快照、独立诊疗待缴账单和INVOICED状态同事务保存，重复请求返回原单。缴费与退款是独立事务，不把费用凭据状态冒充已付款，不覆盖历史诊疗价格。',
 364:'原有实体和多对多关联按既定关系映射，InvoiceItem保存开票快照，AppointmentEvent保存就诊状态事件。另由挂号费策略、号源保留、患者账单、支付订单及退款订单保存预约收费和费用办理事实，共形成24张业务表。边界类和控制类不直接映射为业务表。',
 374:'图D1给出24张业务表的关系，字段定义见表D3—D21及D27—D31；完整性和业务基数结合表D22—D24阅读。挂号费策略位于资源区，号源保留位于预约区，账单、支付及退款位于费用区。全库包含209个字段和44条外键，普通和条件唯一约束共同保证当前事实与历史记录一致。',
 380:'表D2列出24张业务表。表D3—D21及D27—D31给出字段定义，表D22—D24给出约束、状态和主要关系。',
 384:'下列24张业务表列明字段、类型、主键、外键、可空性和唯一性。UNIQUE表示单列唯一，UNIQUE(组合)表示共同构成唯一约束，条件组合仅对指定状态生效。JSON用于不可分离的审计、核算及短时预约意向快照，不代替应有的实体关联。',
 495:'表示层分为患者微信小程序与工作人员Web管理后台。小程序提供精简首次登记、已有档案安全关联、看牙检查或洗牙需求选择、医生职称与擅长展示、真实时段预约、取消及我的费用；收费预约先保留号源，演示缴费后确认。Web按前台、牙医、收费和总部岗位组织工作区。双端访问同一业务API，服务端校验身份、功能权限、诊所范围、金额及状态，前端不自行生成排班或决定业务成功。'
}
def countfix(s):
 for a,b in [('19张表','24张表'),('19 张表','24 张表'),('19张业务表','24张业务表'),('19 张业务表','24 张业务表'),('163个字段','209个字段'),('163 个字段','209 个字段'),('30条外键','44条外键'),('30 条外键','44 条外键')]:s=s.replace(a,b)
 return s
for i,e in enumerate(body):
 if e.tag!=W+'p' or not text(e):continue
 old=text(e);new=explicit.get(i,countfix(old)).replace('填写现有必填资料','填写姓名、出生日期、联系电话').replace('自行填写本人必填资料','自行填写姓名、出生日期、联系电话')
 if new!=old:settext(e,new);replacements[old]=new
field_tables=[]
for e in body.findall('w:tbl',N):
 rows=e.findall('w:tr',N)
 if rows and text(rows[0].find('w:tc',N))=='字段名':field_tables.append(e)
assert len(field_tables)==19
def cells(f):return [f['name'],f['type'],'Yes' if f['pk'] else 'No',('FK:'+f['fk']) if f['fk'] else 'No','NULL' if f['nullable'] else 'NOT NULL',f['unique']]
def fieldtable(table,t):
 rows=table.findall('w:tr',N);template=deepcopy(rows[1])
 for row in rows[1:]:table.remove(row)
 for f in t['fields']:
  row=deepcopy(template)
  for cell,value in zip(row.findall('w:tc',N),cells(f)):settext(cell,value)
  table.append(row)
for table,t in zip(field_tables,schema[:19]):fieldtable(table,t)
# Extend the existing analysis-to-storage and relation overview tables.
for e in body.findall('w:tbl',N):
 rows=e.findall('w:tr',N)
 if not rows:continue
 header=[text(c) for c in rows[0].findall('w:tc',N)]
 if header[0] in ['分析类或来源','业务域']:
  for t in schema[-5:]:
   row=deepcopy(rows[-1]);values=[t['label'],t['name'],'设计细化 → 非空或条件外键','UC01、UC04'] if header[0]=='分析类或来源' else ['预约费用',t['name'],t['label']]
   for cell,value in zip(row.findall('w:tc',N),values):settext(cell,value)
   e.append(row)
def para(template,value):e=deepcopy(template);settext(e,value);return e
heading=deepcopy(body[497]);normal=deepcopy(body[498]);caption=deepcopy(body[499]);template=deepcopy(field_tables[-1]);section=body.find('w:sectPr',N)
append=[]
append+=[para(heading,'（十六）患者费用与短时号源'),para(normal,'首次登记只保留姓名、生日、联系电话、过敏声明及本人确认；其他联系资料后补。预约入口将“看牙检查”和“洗牙洁牙”映射至真实启用项目，专业治疗仍可展开选择；医生卡片展示已维护的职称、主要方向和简介，职称不代替已核验执业资质。'),para(normal,'挂号费以整数分配置并冻结于账单。非零收费时先保留号源五分钟，最多至预约开始；待缴记录不等于预约。服务端同时检查正式预约及未过期号源，支付前再次核对排班、资质和本人资料快照。超时、停诊、占用或确认资料变化时关闭保留，不创建预约或爽约。成功支付、正式预约、BOOK事件、审计及回执整体提交，重复或并发请求只成功一次。'),para(normal,'演示支付仅在服务端开关和明确测试门店白名单下启用，页面始终提示“演示支付，不扣真实款”。患者只操作当前关联本人的账单；授权收费和总部人员按诊所范围获得billing.read、billing.pay、billing.refund能力。合法取消已付挂号预约时同事务全额演示退款；诊所原因改约沿用原预约流程，退还原挂号费并不对替代预约另行加收。治疗账单来自真实Invoice和InvoiceItem，全额退款记录独立保留，不改写原费用凭据或R1。')]
for t in schema[-5:]:
 append.append(para(caption,'表 '+t['caption']+'  '+t['name']+'（'+t['label']+'）表结构'));newtable=deepcopy(template);fieldtable(newtable,t);append.append(newtable)
for e in append:body.insert(body.index(section),e)
parts['word/document.xml']=E.tostring(doc,xml_declaration=True,encoding='UTF-8',standalone=True)
parts['word/media/'+Path(erd['media']).name]=(R/erd['media']).read_bytes()
with ZipFile(word,'w',ZIP_DEFLATED) as z:
 for name,data in parts.items():z.writestr(name,data)
# Match all current prose and field tables in the A-D text copies.
for md in (R/'docs/requirements').glob('[ABCD]-*.md'):
 s=md.read_text(encoding='utf-8')
 for old,new in replacements.items():s=s.replace(old,new)
 if md.name.startswith('D-'):
  for t in schema[:19]:
   pattern=r'(表 '+t['caption']+r'\s+[^\n]+\n\n<!-- word-block:\d+ -->\n\n)(\| 字段名[^\n]*\n\|[^\n]*\n)(.*?)(?=\n\n)'
   s=re.sub(pattern,lambda m:m[1]+m[2]+'\n'.join('| '+' | '.join(cells(f))+' |' for f in t['fields']),s,flags=re.S)
  s+='\n\n### （十六）患者费用与短时号源\n\n'+'\n\n'.join(text(e) for e in append[1:4])+'\n'
  for t in schema[-5:]:s+='\n\n表 '+t['caption']+'  '+t['name']+'（'+t['label']+'）表结构\n\n| 字段名 | 数据类型 | 主键 | 外键 | 是否为空 | 是否唯一 |\n| --- | --- | --- | --- | --- | --- |\n'+'\n'.join('| '+' | '.join(cells(f))+' |' for f in t['fields'])+'\n'
 md.write_text(s,encoding='utf-8')
for p in [R/'docs/originals'/word.name,R/'docs/references/provided'/word.name]:shutil.copyfile(word,p)
print('Published approved ERD and current Word',H(word))
