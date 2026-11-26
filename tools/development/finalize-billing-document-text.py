from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
from lxml import etree as E
R=Path(__file__).resolve().parents[2];p=R/'安德鲁牙科连锁管理系统需求分析与设计.docx';n={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(p) as z:parts={s:z.read(s) for s in z.namelist()}
d=E.fromstring(parts['word/document.xml']);count=0
for para in d.findall('.//w:p',n):
 nodes=para.findall('.//w:t',n);s=''.join(t.text or '' for t in nodes)
 v=s.replace('支付、收款及退款由系统外流程处理','通过独立患者账单、演示支付订单及退款订单记录缴费事实，演示不扣真实款').replace('实际收款由系统外流程处理','缴费和退款由独立账单及订单记录，演示不扣真实款').replace('Appointment及事件；不处理支付','Appointment及事件；另建诊疗待缴账单，演示缴费及退款不覆盖费用快照')
 if v!=s:nodes[0].text=v;count+=1;[setattr(t,'text','') for t in nodes[1:]]
parts['word/document.xml']=E.tostring(d,xml_declaration=True,encoding='UTF-8',standalone=True)
with ZipFile(p,'w',ZIP_DEFLATED) as z:
 for s,b in parts.items():z.writestr(s,b)
print('Updated current billing prose:',count)
