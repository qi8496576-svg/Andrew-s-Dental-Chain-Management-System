import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

const read = p => JSON.parse(readFileSync(p, 'utf8'))
const hash = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const identity = read('docs/verification/models/source-identity.json')
for (const item of identity.frozen_inputs) assert.equal(hash(item.path), item.sha256, item.path)
for (const item of identity.figures) assert.equal(hash(item.official_image), item.sha256, item.official_image)
const rendered = read('docs/verification/models/tool-results.json')
for (const item of rendered.results) {
  assert.equal(hash(item.source), item.sha256, item.source)
  assert.equal(item.exit_code, 0, item.source)
  assert.ok(readFileSync(item.output, 'utf8').includes('<svg'), item.output)
}

const baseline = read('specs/001-system-specification/technical-schema.json')
const diagram = readFileSync('specs/001-system-specification/diagrams/technical-erd.mmd', 'utf8')
const blocks = [...diagram.matchAll(/^    (\w+) \{\r?\n([\s\S]*?)^    \}/gm)]
const differences = []
let fields = 0
for (const table of baseline.technical_tables) {
  const block = blocks.find(b => b[1] === table.name)
  if (!block) { differences.push(`Missing ${table.name}`); continue }
  const columns = [...block[2].matchAll(/^\s+(\w+) (\w+)(.*?) "(NOT NULL|NULL)"/gm)]
  if (columns.length !== table.fields.length) differences.push(`${table.name}: field count`)
  for (const field of table.fields) {
    fields++
    const column = columns.find(c => c[2] === field.name)
    const type = field.type.replace(/[^a-zA-Z0-9]+/g, '_').replace(/_$/, '')
    if (!column || column[1] !== type || (column[4] === 'NULL') !== field.nullable)
      differences.push(`${table.name}.${field.name}: name/type/nullability`)
  }
}
const actualRefs = [...diagram.matchAll(/^    (\w+) [|o}{]+--[|o}{]+ (\w+) : "(\w+)"/gm)]
  .map(m => `${m[2]}.${m[3]} -> ${m[1]}`).sort()
const expectedRefs = baseline.technical_tables.flatMap(t => t.fields.filter(f => f.foreign_key)
  .map(f => `${t.name}.${f.name} -> ${f.foreign_key.split('.')[1]}`)).sort()
if (JSON.stringify(actualRefs) !== JSON.stringify(expectedRefs)) differences.push('FK child columns / parent tables differ')
const applicationReferences = baseline.technical_tables.flatMap(t => t.fields.filter(f => f.application_reference)).length
assert.equal(blocks.length, 14); assert.equal(fields, 110); assert.equal(actualRefs.length, 19)
writeFileSync('docs/verification/models/technical-check.json', JSON.stringify({
  tables: blocks.length, fields, diagram_fk_edges: actualRefs.length, application_references: applicationReferences,
  differences, scope: 'Field names/types/nullability and FK child columns/parent tables; diagram does not encode every physical constraint',
  refs: actualRefs
}, null, 2))
console.log(JSON.stringify({ frozen_inputs_unchanged: identity.frozen_inputs.length,
  official_images_unchanged: identity.figures.length, rendered_sources_unchanged: rendered.results.length,
  technical_differences: differences }))
assert.deepEqual(differences, [])
