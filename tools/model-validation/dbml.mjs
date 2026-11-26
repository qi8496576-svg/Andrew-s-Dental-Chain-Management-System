import { readFileSync, writeFileSync } from 'node:fs'
import { Parser } from '@dbml/core'
import assert from 'node:assert/strict'

const source=readFileSync('docs/diagrams/database/D1-database.dbml','utf8')
const schema=new Parser().parse(source,'dbmlv2').schemas[0]
const baseline=JSON.parse(readFileSync('docs/diagrams/database/schema.json','utf8'))
const differences=[]
let fields=0
for(const expected of baseline){
  const table=schema.tables.find(t=>t.name===expected.name)
  if(!table){differences.push(`Missing ${expected.name}`);continue}
  const compositePk=(table.indexes??[]).filter(i=>i.pk).flatMap(i=>i.columns.map(c=>c.value))
  if(table.fields.length!==expected.fields.length) differences.push(`${expected.name}: field count`)
  for(const field of expected.fields){
    fields++
    const actual=table.fields.find(f=>f.name===field.name)
    if(!actual){differences.push(`${expected.name}.${field.name}: missing`);continue}
    const key=`${expected.name}.${field.name}`
    if(actual.type.type_name.toUpperCase().replaceAll(' ','')!==field.type.toUpperCase().replaceAll(' ','')) differences.push(`${key}: type`)
    if(Boolean(actual.not_null)===field.nullable) differences.push(`${key}: nullability`)
    if(Boolean(actual.pk||compositePk.includes(field.name))!==field.pk) differences.push(`${key}: PK`)
    if(field.unique==='UNIQUE' && !actual.pk && !actual.unique) differences.push(`${key}: unique`)
  }
}
const refs=schema.refs.map(r=>{
  const many=r.endpoints.find(e=>e.relation==='*')??r.endpoints[0]
  const one=r.endpoints.find(e=>e!==many)
  return `${many.tableName}.${many.fieldNames.join(',')} -> ${one.tableName}.${one.fieldNames.join(',')}`
}).sort()
const expectedRefs=baseline.flatMap(t=>t.fields.filter(f=>f.fk).map(f=>`${t.name}.${f.name} -> ${f.fk}`)).sort()
if(JSON.stringify(refs)!==JSON.stringify(expectedRefs)) differences.push('Foreign key endpoints differ')
assert.equal(schema.tables.length,24);assert.equal(fields,209);assert.equal(refs.length,44)
writeFileSync('docs/verification/models/dbml-check.json',JSON.stringify({parser:'@dbml/core 12.0.0 dbmlv2',tables:24,fields,foreign_keys:refs.length,differences,refs,conditional_constraints:'Remain in constraints.md; DBML does not implement them'},null,2))
// Derived rendering only: no SQL export, migrations or changes to the original ERD.
let diagram='erDiagram\n'
for(const t of schema.tables){
  diagram+=`    ${t.name} {\n`
  const pk=(t.indexes??[]).filter(i=>i.pk).flatMap(i=>i.columns.map(c=>c.value))
  for(const f of t.fields) diagram+=`        ${f.type.type_name.replace(/[^a-zA-Z0-9]/g,'_')} ${f.name}${f.pk||pk.includes(f.name)?' PK':''}\n`
  diagram+='    }\n'
}
for(const r of schema.refs){
  const a=r.endpoints[0],b=r.endpoints[1]
  const child=schema.tables.find(t=>t.name===a.tableName)
  const nullable=a.fieldNames.some(name=>!child.fields.find(f=>f.name===name).not_null)
  const unique=a.relation==='1'
  diagram+=`    ${b.tableName} ${nullable?'|o':'||'}--${unique?'o|':'o{'} ${a.tableName} : "${a.fieldNames.join(',')}"\n`
}
writeFileSync('docs/verification/models/sources/D1-derived.mmd',diagram)
console.log(JSON.stringify({tables:24,fields,foreign_keys:44,differences}))
if(differences.length) process.exitCode=1
