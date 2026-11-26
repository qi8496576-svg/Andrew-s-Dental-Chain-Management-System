"""Materialize approved dictionaries without adding columns; no database execution.
Foreign keys, ordinary unique keys and CHECKs are deliberately deferred to T043.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
if (ROOT / 'backend/src/main/resources/db/migration/V201__patient_booking_and_demo_billing.sql').exists():
    raise RuntimeError('Initial bootstrap generator is retired after V201. Existing migrations are immutable; use an explicit forward migration and update current row mappings.')
business = json.loads((ROOT / 'docs/diagrams/database/schema.json').read_text('utf-8-sig'))
technical = json.loads((ROOT / 'specs/001-system-specification/technical-schema.json').read_text('utf-8-sig'))['technical_tables']

def save(path, content):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.read_text('utf-8') != content:
        raise RuntimeError(f'Refusing to overwrite an edited artifact: {path}')
    target.write_text(content, encoding='utf-8', newline='\n')

def java_type(sql):
    head = sql.split('(')[0]
    return {'BIGINT':'Long','INT':'Integer','SMALLINT':'Short','BOOLEAN':'Boolean',
            'DECIMAL':'java.math.BigDecimal','DATE':'java.time.LocalDate','TIME':'java.time.LocalTime',
            'TIMESTAMP':'java.time.Instant','BINARY':'byte[]','VARBINARY':'byte[]'}.get(head,'String')

for index,t in enumerate(business+technical):
    if t['name'] == 'flyway_schema_history':
        continue  # Tool-owned; T041 must inspect actual Flyway output.
    is_business=index<len(business)
    schema='adc_business' if is_business else t['schema']
    name=t['name']; fields=t['fields']
    pk=[f['name'] for f in fields if f.get('pk')] if is_business else t['primary_key']
    version=f'{index+1:03d}' if is_business else f'{101+index-len(business):03d}'
    columns=[f"  `{f['name']}` {f['type']} {'NULL' if f['nullable'] else 'NOT NULL'}" for f in fields]
    columns.append('  PRIMARY KEY ('+', '.join('`'+p+'`' for p in pk)+')')
    save(f'backend/src/main/resources/db/migration/V{version}__create_{name}.sql',
         '-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.\n'
         +f'CREATE TABLE {schema}.`{name}` (\n'+',\n'.join(columns)+'\n) ENGINE=InnoDB;\n')
    package='com.adc.domain.model' if is_business else 'com.adc.infrastructure.technical'
    cls=name if is_business else name+'Record'
    save('backend/src/main/java/'+package.replace('.','/')+'/'+cls+'.java',
         f'package {package};\n\n/** Immutable row projection; business mutations belong to application services. */\n'
         +f'public record {cls}(\n    '+',\n    '.join(java_type(f['type'])+' '+f['name'] for f in fields)+'\n) { }\n')
    args=', '.join(f'@Param("{p}") {java_type(next(f["type"] for f in fields if f["name"]==p))} {p}' for p in pk)
    save(f'backend/src/main/java/com/adc/infrastructure/persistence/{name}Mapper.java',
         'package com.adc.infrastructure.persistence;\n\nimport org.apache.ibatis.annotations.Mapper;\nimport org.apache.ibatis.annotations.Param;\n'
         +f'import {package}.{cls};\n\n/** Read-only row repository. No generic write endpoint. */\n@Mapper\npublic interface {name}Mapper {{\n    {cls} findById({args});\n}}\n')
    mappings=[]
    for f in fields:
        jt=java_type(f['type']); jt='java.lang.'+jt if '.' not in jt and jt!='byte[]' else jt
        if jt=='byte[]': jt='[B'
        tag='idArg' if f['name'] in pk else 'arg'
        mappings.append(f'      <{tag} column="{f["name"]}" javaType="{jt}"/>')
    save(f'backend/src/main/resources/mappers/{name}Mapper.xml',
         '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">\n'
         +f'<mapper namespace="com.adc.infrastructure.persistence.{name}Mapper">\n  <resultMap id="row" type="{package}.{cls}">\n    <constructor>\n'
         +'\n'.join(mappings)+'\n    </constructor>\n  </resultMap>\n  <select id="findById" resultMap="row">\n    SELECT '
         +', '.join('`'+f['name']+'`' for f in fields)+f' FROM {schema}.`{name}` WHERE '
         +' AND '.join('`'+p+'` = #{'+p+'}' for p in pk)+'\n  </select>\n</mapper>\n')
print('Prepared 19 business and 13 technical row mappings/migrations; Flyway history remains tool-owned.')
