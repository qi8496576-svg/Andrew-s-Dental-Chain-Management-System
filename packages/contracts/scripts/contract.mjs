import assert from 'node:assert/strict'
import SwaggerParser from '@apidevtools/swagger-parser'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { readFile } from 'node:fs/promises'
import { readFrozenSource, operations } from './source.mjs'

const pointer = value => value.replaceAll('~', '~0').replaceAll('/', '~1')

export async function loadContract() {
  const { api, sha256 } = await readFrozenSource()
  // The approved document uses local references. Never resolve an unapproved remote source.
  await SwaggerParser.validate(structuredClone(api), { resolve: { external: false } })
  const ajv = new Ajv2020({ strict: false, allErrors: true, coerceTypes: false, useDefaults: false, removeAdditional: false })
  addFormats(ajv)
  ajv.addSchema({ ...api, $id: 'urn:adc:contract' })
  const compile = path => ajv.compile({ $ref: `urn:adc:contract#${path}` })
  const schemas = Object.fromEntries(Object.keys(api.components.schemas).map(name => [name, compile(`/components/schemas/${pointer(name)}`)]))
  const list = operations(api)
  assert.equal(list.length, 91)
  assert.equal(new Set(list.map(x => x.operation.operationId)).size, 91)
  const table = new Map()
  const markdown = await readFile(new URL('../../../specs/001-system-specification/contracts/operations.md', import.meta.url), 'utf8')
  const behavior = await readFile(new URL('../../../specs/001-system-specification/contracts/api.md', import.meta.url), 'utf8')
  const errorStatuses = new Map()
  for (const line of behavior.split(/\r?\n/)) {
    const row = line.match(/^\| (\d{3}(?:\/\d{3})*) \| ([A-Z_]+(?: \/ [A-Z_]+)*) \|/)
    if (row) for (const code of row[2].split(' / ')) errorStatuses.set(code, row[1].split('/'))
  }
  assert.ok(errorStatuses.size > 0, 'Documented error status table was not parsed')
  for (const { path, method, operation: op } of list) {
    assert.ok(markdown.includes(`| ${method.toUpperCase()} ${path} | ${op.operationId} |`), `${op.operationId}: missing operation trace`)
    assert.ok(op['x-requirements']?.length && op['x-acceptance']?.length, `${op.operationId}: missing requirement/acceptance mapping`)
    const prefix = `/paths/${pointer(path)}/${method}`
    const requestSchema = op.requestBody?.content?.['application/json']?.schema
    const request = requestSchema ? compile(`${prefix}/requestBody/content/application~1json/schema`) : null
    const response = {}
    for (const [status, value] of Object.entries(op.responses)) {
      const schema = value.content?.['application/json']?.schema
      response[status] = schema ? compile(`${prefix}/responses/${pointer(status)}/content/application~1json/schema`) : null
      if (/^[45]\d\d$/.test(status)) assert.equal(schema?.$ref, '#/components/schemas/Error', `${op.operationId}/${status}: error envelope drift`)
    }
    const headerProperties = {}, requiredHeaders = []
    for (const parameter of op.parameters ?? []) {
      if (parameter.in !== 'header') continue
      headerProperties[parameter.name.toLowerCase()] = parameter.schema
      if (parameter.required) requiredHeaders.push(parameter.name.toLowerCase())
    }
    const headers = ajv.compile({ type: 'object', properties: headerProperties, required: requiredHeaders })
    table.set(op.operationId, { request, response, headers, op, path, method })
  }
  return {
    api, sha256, schemas, table, errorStatuses,
    inspectError(status, body) {
      const shapeValid = schemas.Error(body)
      const statuses = body && errorStatuses.get(body.code)
      return { shape_valid: shapeValid, documented_status: Boolean(statuses), status_compatible: statuses ? statuses.includes(String(status)) : null }
    },
    validateRequest(id, body) {
      const item = table.get(id); assert.ok(item, `Unknown operation: ${id}`)
      return item.request ? item.request(body) : body === undefined
    },
    validateResponse(id, status, body) {
      const item = table.get(id); assert.ok(item && Object.hasOwn(item.response, status), `Undeclared operation/status: ${id}/${status}`)
      return item.response[status] ? item.response[status](body) : body === undefined
    },
    validateHeaders(id, headers) {
      const item = table.get(id); assert.ok(item, `Unknown operation: ${id}`)
      return item.headers(Object.fromEntries(Object.entries(headers).map(([k,v]) => [k.toLowerCase(),v])))
    },
  }
}
