from pathlib import Path
import json,re,hashlib
R=Path(__file__).resolve().parents[2]
schema=json.loads((R/'docs/diagrams/database/schema.json').read_text(encoding='utf-8'))
core=[R/'.specify/memory/constitution.md',R/'README.md',R/'docs/diagrams/database/constraints.md',R/'docs/diagrams/README.md',R/'图源/说明.md']
feature=R/'specs/001-system-specification'
core += [feature/n for n in ['spec.md','plan.md','data-model.md','research.md','quickstart.md','traceability.md','technical-data-model.md']]
core += [feature/'contracts'/n for n in ['api.md','identity.md']]
common={
 '19 表、163 字段、30 外键':'24 表、209 字段、44 外键','19表/163字段/30FK':'24表/209字段/44FK','19/163/30':'24/209/44',
 '19 张业务表、163 个字段、30 条外键':'24 张业务表、209 个字段、44 条外键','19 张表、\n  163 个字段、30 条外键':'24 张表、\n  209 个字段、44 条外键',
 '19张业务表':'24张业务表','19 张业务表':'24 张业务表','19张表':'24张表','19 张表':'24 张表','19表':'24表',
 '163字段':'209字段','163 字段':'209 字段','163个字段':'209个字段','163 个字段':'209 个字段','30FK':'44FK','30条外键':'44条外键','30 条外键':'44 条外键',
 '15 单列代理主键及 4 复合关联主键':'19 单列代理主键及 5 复合关联主键','15 张为单列代理主键，4 张为原复合关联主键':'19 张为单列代理主键，5 张为复合主键','15 张表采用单列代理主键，4 张关联表采用复合主键':'19 张表采用单列代理主键，5 张表采用复合主键',
 '姓名、出生日期、账单地址、电话及紧急联系人姓名/电话必填，邮箱可空。':'姓名、出生日期和联系电话必填；地址、邮箱及紧急联系人可空，后续就诊时补充。',
 '姓名、出生日期、电话、账单地址、紧急联系人及电话、可选邮箱、本人过敏声明和确认':'姓名、出生日期、联系电话、本人过敏声明和确认，地址、邮箱与紧急联系人后补',
 '填写现有必填资料':'填写姓名、出生日期、联系电话','现有Patient必填字段':'Patient预约所需姓名、出生日期、联系电话',
 '或第 20 张业务表':'或未经批准的业务表','不增加业务字段或技术→业务物理FK':'身份技术存储不增加到业务库的物理FK','不增加业务表。':'本轮包括五张预约费用业务表。',
 '实际支付、收款登记、支付渠道、退款、渠道对账、税费及折扣均不纳入本规约。':'本规约包括受控演示缴费和全额退款，不扣真实款；真实微信支付、渠道对账、税费及折扣留在后续范围。',
 '结算仅生成费用凭据，INVOICED 不表示已付款，不增加支付/收退款/渠道/税费/折扣。':'结算生成费用凭据和独立诊疗待缴账单，INVOICED不表示已付款；本轮提供受控演示缴费和全额退款，不扣真实款，不改变R1。',
 '不重新取目录价，不增加税费、折扣、付款、收款、退款或渠道事实。':'不重新取目录价，不增加税费及折扣；支付和退款使用独立记录，不覆盖开票快照。',
 'UC04生成费用凭据，当前到店线下缴费，真实支付为后续范围。':'UC04生成费用凭据及独立待缴账单；测试门店支持演示缴费与退款，不扣真实款，真实微信支付仍待商户接入。',
 '不得擅加支付、实际收款、退款、渠道对账、\n  税费或折扣':'演示支付和全额退款使用独立账单、支付与退款记录，不扣真实款；真实收款、渠道对账、\n  税费或折扣须另行批准',
 '无新增业务列':'已批准的三项可空调整、医生三字段和五张费用表','不更改 19 表结构':'不因身份关联另改业务表结构','不改原件':'按明确授权同步当前原件',
 '姓名、生日、联系电话和过敏声明':'姓名、生日、联系电话和过敏声明'
}
for p in core:
 s=p.read_text(encoding='utf-8')
 for a,b in common.items():s=s.replace(a,b)
 s=s.replace('QuarterlyPerformance、AppointmentEvent。','QuarterlyPerformance、AppointmentEvent、RegistrationFeePolicy、BookingHold、PatientBill、PaymentOrder、RefundOrder。')
 if p.name=='constitution.md':s=s.replace('1.1.0','1.2.0')
 p.write_text(s,encoding='utf-8')
p=feature/'spec.md';s=p.read_text(encoding='utf-8')
s=s.replace('D3—D21 的 19 表','D3—D21及D27—D31的24表').replace('15 单列代理主键及 4 复合关联主键','19 单列代理主键及5复合主键')
row='| FR-026 | 预约体验与费用 | 首次登记仅姓名、生日、电话、过敏声明及本人确认；看牙检查/洗牙映射真实项目，医生展示真实维护的职称、方向和简介；受控测试门店挂号费、短时号源、账单、演示支付、取消及全额退款双端一致，不扣真实款，不改变R1。 | AC-PB-01、AC-PB-02、AC-PB-03 |'
s=re.sub(r'(?m)^(\| FR-025[^\n]*)$',lambda m:m[0]+'\n'+row,s)
s+='''
### 患者预约与费用验收

预约沿用UC01，费用办理衔接UC04，配置沿用UC06，不另增加系统用例编号。首次预约不要求患者提供地址、邮箱或紧急联系人，不自动填入虚假资料；保留联系电话用于门店联系。医生职称不代替资质核验，未维护时显示未提供。

| 验收编号 | Given | When | Then |
| --- | --- | --- | --- |
| AC-PB-01 | 有效微信身份、最少本人资料、真实门店项目和排班 | 从看牙检查/洗牙选择需求、查看医生、首次登记并返回确认 | 不要求地址和紧急联系人；患者编号由系统生成，时段重新核对后恢复，职称/擅长/简介来自后台；信息变化重新确认，无伪造患者、治疗或排班。 |
| AC-PB-02 | 白名单虚构门店、非零挂号费及可用号源 | 保留号源并演示缴费，含重复、并发、过期、停诊、资料变化和审计失败对照 | 保留最多5分钟及最迟至预约开始；成功支付才原子保存唯一预约/BOOK/账单支付/审计回执；失效关闭保留，不产生爽约，失败回滚，不扣真实款；不能直接调用免费预约绕过收费。 |
| AC-PB-03 | 当前本人关联或授权收费/总部岗位及对应诊所范围 | 查看费用、取消已付挂号、办理演示退款、诊疗结算及缴费 | 双端同一真实账单；合法退号与全额演示退款同事务，重复不重复退；诊疗账单来自Invoice，INVOICED不冒充付款。撤销关联/越权被拒，演示金额不计真实收款及R1。 |
''';p.write_text(s,encoding='utf-8')
p=feature/'data-model.md';s=p.read_text(encoding='utf-8')
for t in schema[:19]:
 pattern=r'(### 表 '+t['caption']+r' '+t['name']+r'.*?\n\n.*?\n\n\| 原字段[^\n]*\n\|[^\n]*\n)(.*?)(?=\n\n)'
 def rows(t):return '\n'.join('| '+' | '.join([f['name'],f['type'],'Yes' if f['pk'] else 'No',('FK:'+f['fk']) if f['fk'] else 'No','NULL' if f['nullable'] else 'NOT NULL',f['unique']])+' |' for f in t['fields'])
 s=re.sub(pattern,lambda m:m[1]+rows(t),s,flags=re.S)
extra='\n\n'
for t in schema[-5:]:extra+='### 表 '+t['caption']+' '+t['name']+'（'+t['label']+'）\n\n| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |\n| --- | --- | --- | --- | --- | --- |\n'+rows(t)+'\n\n'
s=s.replace('## D22—D24 原业务完整性约束',extra+'## D22—D24 原业务完整性约束')
s=s.replace('| D7 | Dentist | 11 | 0 | dentist_id |','| D7 | Dentist | 14 | 0 | dentist_id |')
s=re.sub(r'(?m)^\| 合计 \|.*$', '\n'.join('| '+t['caption']+' | '+t['name']+' | '+str(len(t['fields']))+' | '+str(sum(bool(f['fk']) for f in t['fields']))+' | '+', '.join(f['name'] for f in t['fields'] if f['pk'])+' |' for t in schema[-5:])+'\n| 合计 | 24 表 | 209 | 44 | 19 单列主键＋5 复合主键 |',s)
s+='''
## 预约费用事务与数据边界

RegistrationFeePolicy以clinic_id/dentist_id复合主键配置整数分，未配置为零；新账单冻结金额。BookingHold保存预约意向、截止时刻、当前本人资料/过敏确认摘要和最终预约引用，HELD/BOOKED/CLOSED/EXPIRED独立于原就诊五状态。持有号源和正式预约共享医生/排班锁及重叠检查；支付前核对正常排班、有效资质、本人确认快照与当前关联，失效关闭保留。

PatientBill由挂号保留或真实Invoice提供唯一来源，PENDING/PAID/CLOSED/REFUNDED不替代Appointment或Invoice状态。PaymentOrder每账单至多一条成功演示支付，RefundOrder每支付至多一条全额退款。合法取消原预约时，同事务保存取消事件和演示退款；诊所改约退原费，替代预约沿用原改约业务，不另加收。治疗退款须另获billing.refund与诊所范围并记录原因，原Invoice/R1不回写。

金额为受范围约束的BIGINT整数分；模式固定DEMO，不接受客户端金额、模式或任意状态。服务端开关及测试门店白名单控制演示能力。真实微信商户渠道和异步对账不在当前物理实现中。
''';p.write_text(s,encoding='utf-8')
# Approved amendment keeps its before chain and receives hashes of final current prose.
p=feature/'contracts/approved-amendments/20261125-patient-billing.json';a=json.loads(p.read_text(encoding='utf-8'))
for f in a['files']:f['after_sha256']=hashlib.sha256((R/f['path']).read_bytes()).hexdigest()
p.write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Current assertions track the current approved contract, not its former operation count.
p=R/'packages/contracts/tests/contract.test.mjs';p.write_text(p.read_text(encoding='utf-8').replace('contract.table.size,83','contract.table.size,91'),encoding='utf-8')
p=R/'backend/src/test/java/com/adc/infrastructure/ApiAuthorizationMatrixIT.java';s=p.read_text(encoding='utf-8').replace('assertEquals(82,operations)','assertEquals(91,operations)').replace('assertEquals(77,evidence.size())','assertEquals(86,evidence.size())');p.write_text(s,encoding='utf-8')
print('Current rules, 24-table data dictionary and approved contract hashes synchronized')
