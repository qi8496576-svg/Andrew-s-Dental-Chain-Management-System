from pathlib import Path
import json,hashlib,copy
R=Path(__file__).resolve().parents[2];C=R/'specs/001-system-specification/contracts'
names=['api.md','identity.md','operations.md','openapi.json'];before={n:hashlib.sha256((C/n).read_bytes()).hexdigest() for n in names}
p=C/'openapi.json';api=json.loads(p.read_text(encoding='utf-8'));ss=api['components']['schemas']
optional=['billing_address','emergency_contact_name','emergency_contact_phone']
for name in ['PatientCreate','PatientPatch','PatientView','AppointmentPatientDetails','SelfPatientRegistration']:
    v=ss[name]
    for n in optional:
        if n in v.get('properties',{}):
            x=v['properties'][n]
            if x.get('type')=='string':x['type']=['string','null']
            elif 'anyOf' in x and not any(t.get('type')=='null' for t in x['anyOf']):x['anyOf'].append({'type':'null'})
    if 'required' in v:v['required']=[x for x in v['required'] if x not in optional]
    v['description']='首次登记只要求姓名、生日、电话和本人过敏声明；地址、邮箱和紧急联系人后补，缺失保存NULL。'+v.get('description','')
for name in ['DentistInput','DentistPatch','DentistView','Candidate']:
    for n,m in [('professional_title',40),('specialty',255),('introduction',1000)]:ss[name]['properties'][n]={'type':['string','null'],'maxLength':m}
ss['Candidate']['properties']['registration_fee_fen']={'type':'integer','minimum':0,'maximum':100000000}
ss['Candidate']['description']='医生职称、方向和简介是患者可见投影，不包含家庭住址、生日或私人联系方式；未维护时返回null。挂号费用分表示，不能根据治疗目录价推断。'
def ref(n):return {'$ref':'#/components/schemas/'+n}
def obj(properties,required=None):return {'type':'object','additionalProperties':False,'properties':properties,'required':list(properties) if required is None else required}
nullableId={'anyOf':[ref('Id'),{'type':'null'}]}
ss['PatientPayment']=obj({'payment_id':ref('Id'),'status':{'type':'string','enum':['SUCCEEDED','REFUNDED']},'paid_at':{'type':'string','format':'date-time'},'refund_id':nullableId,'refund_reason':{'type':['string','null']}})
ss['PatientBill']=obj({'bill_id':ref('Id'),'patient_id':ref('Id'),'clinic_id':ref('Id'),'kind':{'type':'string','enum':['REGISTRATION','TREATMENT']},'amount_fen':{'type':'integer','minimum':0,'maximum':1000000000000},'status':{'type':'string','enum':['PENDING','PAID','CLOSED','REFUNDED']},'hold_id':nullableId,'appointment_id':nullableId,'invoice_id':nullableId,'mode':{'type':'string','enum':['DEMO']},'payment_notice':{'const':'演示支付，不扣真实款'},'clinic_name':{'type':'string'},'expires_at':{'type':['string','null'],'format':'date-time'},'scheduled_at':{'type':['string','null'],'format':'date-time'},'dentist_name':{'type':['string','null']},'payment':{'anyOf':[ref('PatientPayment'),{'type':'null'}]},'demo_enabled':{'type':'boolean'},'can_refund':{'type':'boolean'}})
ss['PatientBillPage']=obj({'items':{'type':'array','items':ref('PatientBill')},'next_cursor':{'type':['string','null']}})
ss['RegistrationFee']=obj({'clinic_id':ref('Id'),'dentist_id':ref('Id'),'amount_fen':{'type':'integer','minimum':0},'demo_enabled':{'type':'boolean'}})
ss['RegistrationFeeInput']=obj({'amount_fen':{'type':'integer','minimum':0,'maximum':100000000}})
ss['PatientRefundInput']=obj({'reason':{'type':'string','minLength':1,'maxLength':255}})
ss['EmptyCommand']=obj({})
template=copy.deepcopy(api['paths']['/me/patient-registration']['post'])
defs=[('/booking-holds','post','createBookingHold','收费预约的五分钟号源保留','AppointmentCreate','PatientBill'),('/patient-bills','get','listPatientBills','本人或授权诊所费用列表',None,'PatientBillPage'),('/patient-bills/{billId}','get','getPatientBill','费用详情及演示支付退款记录',None,'PatientBill'),('/patient-bills/{billId}/demo-payments','post','payDemoBill','演示缴费并确认收费预约，不扣真实款','EmptyCommand','PatientBill'),('/patient-bills/{billId}/close','post','closePatientBill','取消未付号源，不登记爽约','EmptyCommand','PatientBill'),('/patient-bills/{billId}/refunds','post','refundPatientBill','符合退号事实或收费人员授权的全额演示退款','PatientRefundInput','PatientBill'),('/registration-fees/{clinicId}/{dentistId}','get','getRegistrationFee','查询门店医生挂号费',None,'RegistrationFee'),('/registration-fees/{clinicId}/{dentistId}','put','setRegistrationFee','按resource.write配置演示门店挂号费','RegistrationFeeInput','RegistrationFee')]
import re
rows=[]
for path,method,op,title,request,response in defs:
    v=copy.deepcopy(template);v.update(operationId=op,summary=title,description=title+'；服务端校验当前本人关联/岗位和诊所范围、原订单金额及状态。')
    v['security']=[{'miniSession':[]},{'webSession':[]}]
    if op=='createBookingHold':v['security']=[{'miniSession':[]}]
    if op=='setRegistrationFee':v['security']=[{'webSession':[]}]
    v['parameters']=copy.deepcopy(template['parameters']) if method!='get' else []
    for name in re.findall(r'{(.*?)}',path):v['parameters'].append({'name':name,'in':'path','required':True,'schema':ref('Id')})
    if op=='listPatientBills':v['parameters'] += [{'name':'cursor','in':'query','schema':ref('Id')},{'name':'limit','in':'query','schema':{'type':'integer','minimum':1,'maximum':100,'default':20}}]
    v['responses']['200']['content']['application/json']['schema']=ref(response)
    v['responses']['200'].pop('headers',None)
    if request:v['requestBody']={'required':True,'content':{'application/json':{'schema':ref(request)}}}
    else:v.pop('requestBody',None)
    v['x-requirements']=['FR-026'];v['x-acceptance']=['AC-PB-01','AC-PB-02']
    api['paths'].setdefault(path,{})[method]=v
    rows.append(f'| {method.upper()} {path} | {op} | FR-026 | {title}；本人/岗位与诊所范围由后端校验 | AC-PB-01、AC-PB-02 |')
api['info']['description']='统一后端当前业务契约；INVOICED表示费用凭据，不表示付款；演示支付不扣真实款、不计入真实收款或R1。'
p.write_text(json.dumps(api,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
with (C/'operations.md').open('a',encoding='utf-8') as f:f.write('\n'+'\n'.join(rows)+'\n')
with (C/'api.md').open('a',encoding='utf-8') as f:f.write('''
## 患者费用与收费预约

首次登记保留姓名、生日、电话和过敏声明，地址及紧急联系人可空。医生患者投影只提供职称、主要方向、简介和姓名，不返回私人资料。入口“看牙检查／洗牙洁牙”映射实际启用的治疗项目。

收费预约先校验并保留真实号源五分钟（最迟至开诊前）；PENDING账单不等于预约。统一医生/排班锁校验Appointment和未过期BookingHold占用，直接createAppointment不得绕过非零挂号费。金额由后台策略冻结为整数分；付款原子生成PaymentOrder、正式Appointment及BOOK事件、审计和回执。重复请求或不同键并发仅一次成功；过期、停诊或资质改变关闭保留而不生成预约/爽约。取消已付挂号预约时同事务全额演示退款，停诊改约退款后重新预约。

Invoice/InvoiceItem只对应实际完成的治疗，生成独立TREATMENT账单；开票不等于已付款。演示支付仅ADC_DEMO_PAYMENTS_ENABLED及明确诊所白名单启用；始终显示“演示支付，不扣真实款”，不调用微信扣款、不计入实际收款或R1。挂号费策略使用resource.read/write；账单读取billing.read、演示收款/关闭billing.pay、退款billing.refund按CASHIER/HEADQUARTERS当前诊所授权，患者仅当前关联本人。退款不改变已冻结Invoice和R1；真实商户支付未实现。

| 409 | REGISTRATION_PAYMENT_REQUIRED / FREE_BOOKING_REQUIRED / DEMO_PAYMENT_DISABLED / PAID_BILL_REQUIRED / PAID_BILL_CANNOT_CLOSE / TREATMENT_BILL_CANNOT_CLOSE / CANCEL_APPOINTMENT_FIRST / DEMO_PAYMENT_REQUIRED | 费用或当前状态不允许该操作 |
| 422 | INVALID_AMOUNT | 金额必须为范围内整数分 |
''')
with (C/'identity.md').open('a',encoding='utf-8') as f:f.write('\n费用服务仍使用当前有效的本人关联；未关联、换号或撤销后不得读取或支付原患者账单。演示支付不增加匿名支付或按编号认领病历入口。billing.read/pay/refund是CASHIER和HEADQUARTERS可单独授予的后端能力，仍受诊所范围约束；金额不可由客户端修改。\n')
count=sum(1 for v in api['paths'].values() for k in v if k in ['get','post','put','patch','delete'])
amend=dict(id='ADC-CONTRACT-20261125-06',status='owner-approved',previous_amendment='ADC-CONTRACT-20261124-05',authorization='负责人批准最小数据库、医生资料和精简登记调整，选择演示支付闭环；ERD正式图替换须先单独预览确认。',operation_count=count,business_schema_changed=True,files=[dict(path='specs/001-system-specification/contracts/'+n,before_sha256=before[n],after_sha256=hashlib.sha256((C/n).read_bytes()).hexdigest()) for n in names])
(C/'approved-amendments/20261125-patient-billing.json').write_text(json.dumps(amend,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('approved operations',count)
