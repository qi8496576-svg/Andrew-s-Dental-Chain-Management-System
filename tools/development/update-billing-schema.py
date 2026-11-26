from pathlib import Path
import json,re
R=Path(__file__).resolve().parents[2];path=R/'docs/diagrams/database/schema.json';tables=json.loads(path.read_text(encoding='utf-8'))
for t in tables:
 if t['name']=='Patient':
  for f in t['fields']:
   if f['name'] in ['billing_address','emergency_contact_name','emergency_contact_phone']:f['nullable']=True
 if t['name']=='Dentist':
  for n,m in [('professional_title',40),('specialty',255),('introduction',1000)]:t['fields'].append(dict(name=n,type=f'VARCHAR({m})',pk=False,fk=None,nullable=True,unique='-'))
sql=(R/'backend/src/main/resources/db/migration/V201__patient_booking_and_demo_billing.sql').read_text(encoding='utf-8')
labels=['挂号费策略','预约号源保留','患者账单','支付订单','退款订单']
for i,(name,body) in enumerate(re.findall(r'CREATE TABLE adc_business\.(\w+) \((.*?)\) ENGINE=InnoDB;',sql,re.S)):
 fields=[];pks=[]
 for line in body.splitlines():
  match=re.match(r'\s*(\w+)\s+((?:BIGINT|SMALLINT|JSON|BINARY|VARCHAR|DATETIME)(?:\(\d+\))?)\s+(NOT NULL|NULL)(.*)',line)
  if match:
   n,typ,nullable,tail=match.groups();fields.append(dict(name=n,type=typ,pk='PRIMARY KEY' in tail,fk=None,nullable=nullable=='NULL',unique='UNIQUE' if 'UNIQUE' in tail else '-'))
  match=re.search(r'^\s*PRIMARY KEY \((.*?)\)',line)
  if match:pks=match.group(1).split(',')
 for f in fields:
  if f['name'] in pks:f['pk']=True
 for source,target,column in re.findall(r'FOREIGN KEY \((\w+)\) REFERENCES adc_business\.(\w+)\((\w+)\)',body):
  next(f for f in fields if f['name']==source)['fk']=target+'.'+column
 tables.append(dict(caption='D'+str(22+i),name=name,label=labels[i],word_block=None,fields=fields))
path.write_text(json.dumps(tables,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
count=dict(business_tables=len(tables),business_fields=sum(len(t['fields']) for t in tables),business_foreign_keys=sum(bool(f['fk']) for t in tables for f in t['fields']))
(R/'specs/001-system-specification/amendments/20261125-schema.json').write_text(json.dumps(dict(authorization='owner-approved',erd_publication='awaiting-separate-preview-approval',**count),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# New records use the existing explicit read mapping style. Do not regenerate old migrations.
def jt(t):return {'BIGINT':'Long','SMALLINT':'Short','DATETIME':'java.time.LocalDateTime','BINARY':'byte[]'}.get(t.split('(')[0],'String')
for t in tables[-5:]:
 name=t['name'];fields=t['fields'];pk=[f['name'] for f in fields if f['pk']]
 (R/f'backend/src/main/java/com/adc/domain/model/{name}.java').write_text('package com.adc.domain.model;\n\n/** Immutable row projection; mutations use transactional billing services. */\npublic record '+name+'(\n    '+',\n    '.join(jt(f['type'])+' '+f['name'] for f in fields)+'\n) { }\n',encoding='utf-8')
 (R/f'backend/src/main/java/com/adc/infrastructure/persistence/{name}Mapper.java').write_text('package com.adc.infrastructure.persistence;\nimport org.apache.ibatis.annotations.Mapper;\nimport org.apache.ibatis.annotations.Param;\nimport com.adc.domain.model.'+name+';\n@Mapper\npublic interface '+name+'Mapper {\n    '+name+' findById('+', '.join('@Param("'+k+'") '+jt(next(f['type'] for f in fields if f['name']==k))+' '+k for k in pk)+');\n}\n',encoding='utf-8')
 mappings=[]
 for f in fields:
  typ=jt(f['type']);typ='[B' if typ=='byte[]' else typ if '.' in typ else 'java.lang.'+typ
  mappings.append('      <'+('idArg' if f['pk'] else 'arg')+' column="'+f['name']+'" javaType="'+typ+'"/>')
 (R/f'backend/src/main/resources/mappers/{name}Mapper.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">\n<mapper namespace="com.adc.infrastructure.persistence.'+name+'Mapper">\n  <resultMap id="row" type="com.adc.domain.model.'+name+'">\n    <constructor>\n'+'\n'.join(mappings)+'\n    </constructor>\n  </resultMap>\n  <select id="findById" resultMap="row">SELECT '+','.join('`'+f['name']+'`' for f in fields)+' FROM adc_business.`'+name+'` WHERE '+' AND '.join('`'+k+'` = #{'+k+'}' for k in pk)+'</select>\n</mapper>\n',encoding='utf-8')
p=R/'backend/src/test/java/com/adc/infrastructure/SchemaBaselineIT.java';s=p.read_text(encoding='utf-8').replace('assertEquals(19,business.size())','assertEquals(24,business.size())').replace('assertEquals(163,businessFields)','assertEquals(209,businessFields)').replace('assertEquals(49,refs.size())','assertEquals(63,refs.size())').replace('"business_tables",19,"business_fields",163,"business_foreign_keys",30','"business_tables",24,"business_fields",209,"business_foreign_keys",44');p.write_text(s,encoding='utf-8')
p=R/'backend/src/test/java/com/adc/infrastructure/MappingDefinitionTest.java';p.write_text(p.read_text(encoding='utf-8').replace('assertEquals(32,count)','assertEquals(37,count)'),encoding='utf-8')
p=R/'backend/src/test/java/com/adc/infrastructure/FlywayHistoryIT.java';p.write_text(p.read_text(encoding='utf-8').replace('assertEquals(33,result.migrationsExecuted)','assertEquals(34,result.migrationsExecuted)'),encoding='utf-8')
p=R/'backend/src/test/resources/schema/unique-keys.json';u=json.loads(p.read_text(encoding='utf-8'));u.update({'adc_business.RegistrationFeePolicy':[],'adc_business.BookingHold':['appointment_id'],'adc_business.PatientBill':['hold_id','invoice_id'],'adc_business.PaymentOrder':['bill_id'],'adc_business.RefundOrder':['payment_id']});p.write_text(json.dumps(u,indent=2)+'\n',encoding='utf-8')
p=R/'backend/src/test/resources/schema/check-coverage.json';u=json.loads(p.read_text(encoding='utf-8'));u.update({'adc_business.RegistrationFeePolicy':['amount_fen'],'adc_business.BookingHold':['status','expires_at','slot_minutes'],'adc_business.PatientBill':['status','amount_fen','kind'],'adc_business.PaymentOrder':['mode','amount_fen','status'],'adc_business.RefundOrder':['status','amount_fen']});p.write_text(json.dumps(u,indent=2)+'\n',encoding='utf-8')
print(count)
