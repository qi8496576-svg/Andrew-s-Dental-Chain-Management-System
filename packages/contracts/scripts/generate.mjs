import openapiTS, { astToString } from 'openapi-typescript'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { readFrozenSource, operations } from './source.mjs'

const { api, sha256 } = await readFrozenSource()
const text = `// Generated from frozen ADC OpenAPI. Source SHA-256: ${sha256}\n// Do not edit; use npm run generate after approved source changes.\n` + astToString(await openapiTS(api))
const parsed = ts.createSourceFile('generated.ts', text, ts.ScriptTarget.Latest, true)
const declaration = parsed.statements.find(x => ts.isInterfaceDeclaration(x) && x.name.text === 'operations')
assert.ok(declaration)
const names = declaration.members.map(x => x.name.text).sort()
assert.deepEqual(names, operations(api).map(x => x.operation.operationId).sort())
const output = new URL('../src/generated.ts', import.meta.url)
if (process.argv.includes('--write')) {
  await mkdir(new URL('../src/', import.meta.url), { recursive: true })
  await writeFile(output, text)
  console.log(`Generated shared DTOs for all ${names.length} approved operations.`)
} else {
  assert.equal(await readFile(output, 'utf8'), text, 'Generated DTO drift: do not edit generated.ts manually')
  console.log('Shared DTOs exactly match the frozen source and generator.')
}
