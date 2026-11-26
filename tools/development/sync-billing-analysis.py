from pathlib import Path
import json,html,re
from zipfile import ZipFile,ZIP_DEFLATED
from lxml import etree as E
R=Path(__file__).resolve().parents[2];p=R/'图源/分析类操作与用例.json';j=json.loads(p.read_text(encoding='utf-8'))
adds={
 '患者接口':['查询本人费用()','提交演示支付(账单,请求标识)','提交退号退款(账单,原因)'],
 '收费接口':['查询诊所费用(条件)','提交演示收款(账单,请求标识)','提交演示退款(账单,原因)'],
 '管理接口':['提交挂号费配置(门店,医生,金额)'],
 '预约就诊控制':['保留收费号源(时隙,资料)','演示支付并确认预约(账单,请求标识)','查询本人费用(条件)'],
 '结算就诊控制':['建立诊疗账单(结算单)','演示缴费(账单,请求标识)','办理全额退款(账单,原因)'],
 '维护组织资源控制':['配置挂号费(门店,医生,金额)'],
 '取消预约控制':['取消并退还挂号费(就诊,请求标识)']
}
for name,ops in adds.items():
 group=j['boundaries'] if name in j['boundaries'] else j['controls'];existing=group[name]
 if name in j['boundaries']:
  public=[op for op in existing if j['operation_visibility'][name][op]=='public'];private=[op for op in existing if j['operation_visibility'][name][op]=='private'];group[name]=public+ops+private
 else:group[name]=existing+ops
 for op in ops:j['operation_visibility'][name][op]='public'
p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def render(id,group,cols,minimum,rowgap):
 width=40+cols*600+(cols-1)*45+40;elements=[];y=40;names=list(group)
 def text(x,y,value,size=22,anchor='start'):return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}">{html.escape(value)}</text>'
 for row in range(0,len(names),cols):
  heights=[]
  for col,name in enumerate(names[row:row+cols]):
   ops=group[name];h=max(minimum,138+46*len(ops));x=40+col*645;heights.append(h);elements += [f'<rect x="{x}" y="{y}" width="600" height="{h}" rx="0" fill="white" stroke="black" stroke-width="1.5"/>',text(x+300,y+35,'<<boundary>>' if id=='C2' else '<<control>>',24,'middle'),text(x+300,y+78,name,28,'middle'),f'<line x1="{x}" y1="{y+102}" x2="{x+600}" y2="{y+102}" stroke="black" stroke-width="1.5"/>']
   prior='public'
   for n,op in enumerate(ops):
    mode=j['operation_visibility'][name][op];yy=y+140+46*n
    if mode=='private' and prior=='public':elements.append(f'<line x1="{x}" y1="{yy-37}" x2="{x+600}" y2="{yy-37}" stroke="black" stroke-width="1" stroke-dasharray="7 5"/>')
    elements.append(text(x+14,yy,('+' if mode=='public' else '-')+op));prior=mode
  y+=max(heights)+rowgap
 height=y-rowgap+40
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{id}"><rect width="100%" height="100%" fill="white"/><g font-family="SimSun,Times New Roman,serif" fill="black">'+''.join(elements)+'</g></svg>'
 path=R/('docs/diagrams/uml/'+('C2-边界类图.svg' if id=='C2' else 'C3-控制类图.svg'));path.write_text(svg,encoding='utf-8')
render('C2',j['boundaries'],3,230,142);render('C3',j['controls'],4,364,100)
# Extend current responsibilities and storage overview in the Word, retaining styles.
word=R/'安德鲁牙科连锁管理系统需求分析与设计.docx';ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(word) as z:parts={n:z.read(n) for n in z.namelist()}
doc=E.fromstring(parts['word/document.xml']);body=doc.find('w:body',ns)
def txt(e):return ''.join(e.xpath('.//w:t/text()',namespaces=ns))
def settext(e,s):
 nodes=e.findall('.//w:t',ns);nodes[0].text=s
 for n in nodes[1:]:n.text=''
responsibility={'患者接口':'接收精简首次登记、看牙或洗牙需求、真实时段预约、取消及本人费用请求，显示医生资料、预约与演示缴费退款结果。','收费接口':'核定实际诊疗费用并开具费用凭据，按授权范围查询账单、办理演示收款及全额退款。','管理接口':'维护组织资源和医生展示资料、配置门店医生挂号费，按授权执行运营分析及季度绩效。','预约就诊控制':'复核本人、真实排班、资质及占用；免费直接预约，收费先保留号源，演示支付后原子确认预约。','结算就诊控制':'核定实际诊疗并保存唯一费用凭据和待缴账单，独立办理受控演示支付与退款，不改写开票历史或R1。','取消预约控制':'按原时点、状态和权限校验取消，并同事务记录适用的全额挂号费演示退款。'}
from copy import deepcopy
for table in body.findall('w:tbl',ns):
 rows=table.findall('w:tr',ns)
 if not rows:continue
 for row in rows[1:]:
  cells=row.findall('w:tc',ns);values=[txt(c) for c in cells]
  for name,value in responsibility.items():
   if name in values and len(cells)==3:settext(cells[2],value)
 if [txt(c) for c in rows[0].findall('w:tc',ns)]==['表名','用途']:
  for name,desc in [('RegistrationFeePolicy','按门店、医生配置挂号费，单位为整数分。'),('BookingHold','保存收费预约短时号源、本人确认摘要及最终预约引用。'),('PatientBill','保存挂号或实际诊疗待缴账单及金额快照。'),('PaymentOrder','保存受控演示缴费结果，每账单至多一次成功。'),('RefundOrder','保存全额演示退款、原支付、原因及操作者。')]:
   row=deepcopy(rows[-1]);cells=row.findall('w:tc',ns);settext(cells[0],name);settext(cells[1],desc);table.append(row)
parts['word/document.xml']=E.tostring(doc,xml_declaration=True,encoding='UTF-8',standalone=True)
with ZipFile(word,'w',ZIP_DEFLATED) as z:
 for n,b in parts.items():z.writestr(n,b)
print('C2/C3 retain the approved black-and-white class notation, including operation visibility')
