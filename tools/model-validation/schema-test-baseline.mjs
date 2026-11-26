import { Parser } from '@dbml/core'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
const schema=new Parser().parse(readFileSync('docs/diagrams/database/D1-database.dbml','utf8'),'dbmlv2').schemas[0]
const technical=JSON.parse(readFileSync('specs/001-system-specification/technical-schema.json','utf8')).technical_tables
const unique={}
for(const t of schema.tables) {
 const keys=t.fields.filter(f=>f.unique&&!f.pk).map(f=>[f.name])
 keys.push(...(t.indexes??[]).filter(i=>i.unique&&!i.pk).map(i=>i.columns.map(c=>c.value)))
 unique['adc_business.'+t.name]=keys.map(k=>k.join(',')).sort()
}
for(const t of technical) unique[t.schema+'.'+t.name]=t.unique_keys.map(k=>k.join(',')).sort()
mkdirSync('backend/src/test/resources/schema',{recursive:true})
writeFileSync('backend/src/test/resources/schema/unique-keys.json',JSON.stringify(unique,null,2))
console.log('Wrote ordinary unique-key expectations from frozen DBML/technical baseline; excludes conditional domain uniqueness')
