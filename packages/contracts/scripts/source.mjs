import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

export const sourceUrl = new URL('../../../specs/001-system-specification/contracts/openapi.json', import.meta.url)
export const authorizationUrl = new URL('../../../specs/001-system-specification/implementation-authorization.json', import.meta.url)
export const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']

export function effectiveOpenApiHash(original, amendment) {
  if (!amendment) return original
  assert.equal(amendment.id, 'ADC-CONTRACT-20261111-01')
  assert.equal(amendment.status, 'owner-approved')
  assert.equal(amendment.before_sha256, original, 'Amendment must chain from the original approved fingerprint')
  assert.equal(amendment.path, 'specs/001-system-specification/contracts/openapi.json')
  assert.equal(amendment.json_pointer, '/paths/~1identity~1grants/get/parameters/2/schema')
  assert.deepEqual(amendment.before_schema, { $ref: '#/components/schemas/Id' })
  assert.deepEqual(amendment.after_schema, { type: 'string' })
  assert.match(amendment.after_sha256, /^[a-f0-9]{64}$/)
  return amendment.after_sha256
}

export async function readFrozenSource() {
  const bytes = await readFile(sourceUrl)
  const approved = JSON.parse(await readFile(authorizationUrl, 'utf8'))
  const expectedHashes = new Map(approved.input_fingerprints.map(item => [item.path, item.sha256]))
  const original = expectedHashes.get('specs/001-system-specification/contracts/openapi.json')
  const amendment = JSON.parse(await readFile(new URL('../../../specs/001-system-specification/contracts/approved-amendments/20261111-grant-subject-id.json', import.meta.url), 'utf8'))
  expectedHashes.set('specs/001-system-specification/contracts/openapi.json', effectiveOpenApiHash(original, amendment))
  const patientAmendment = JSON.parse(await readFile(new URL('../../../specs/001-system-specification/contracts/approved-amendments/20261112-patient-lookup.json', import.meta.url), 'utf8'))
  advancePatientAmendment(expectedHashes, patientAmendment)
  const resourceAmendment = JSON.parse(await readFile(new URL('../../../specs/001-system-specification/contracts/approved-amendments/20261112-resource-projections.json', import.meta.url), 'utf8'))
  advanceResourceAmendment(expectedHashes, resourceAmendment)
  const appointmentAmendment=JSON.parse(await readFile(new URL('../../../specs/001-system-specification/contracts/approved-amendments/20261112-appointment-patient-details.json',import.meta.url),'utf8'))
  advanceAppointmentAmendment(expectedHashes,appointmentAmendment)
  const selfRegistration=JSON.parse(await readFile(new URL('../../../specs/001-system-specification/contracts/approved-amendments/20261124-self-registration.json',import.meta.url),'utf8'))
  advanceSelfRegistrationAmendment(expectedHashes,selfRegistration)
  const billing=JSON.parse(await readFile(new URL('../../../specs/001-system-specification/contracts/approved-amendments/20261125-patient-billing.json',import.meta.url),'utf8'))
  assert.equal(billing.id,'ADC-CONTRACT-20261125-06');assert.equal(billing.status,'owner-approved');assert.equal(billing.previous_amendment,'ADC-CONTRACT-20261124-05');assert.equal(billing.operation_count,91);assert.equal(billing.business_schema_changed,true)
  for(const file of billing.files){assert.equal(file.before_sha256,expectedHashes.get(file.path));assert.match(file.after_sha256,/^[a-f0-9]{64}$/);expectedHashes.set(file.path,file.after_sha256)}
  for (const name of ['api.md', 'identity.md', 'operations.md']) {
    const path = `specs/001-system-specification/contracts/${name}`
    const fingerprint = approved.input_fingerprints.find(x => x.path === path)
    assert.ok(fingerprint, `Missing approved fingerprint: ${path}`)
    const content = await readFile(new URL(name, sourceUrl))
    assert.equal(createHash('sha256').update(content).digest('hex'), expectedHashes.get(path), `Frozen contract drift: ${path}`)
  }
  const expected = expectedHashes.get('specs/001-system-specification/contracts/openapi.json')
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  assert.equal(sha256, expected, 'Frozen OpenAPI drift: seek approved change, do not silently regenerate')
  const api = JSON.parse(bytes.toString('utf8'))
  if (amendment) assert.deepEqual(api.paths['/identity/grants'].get.parameters.find(p => p.name === 'subject_id').schema, amendment.after_schema)
  assert.equal(api.openapi, '3.1.1')
  return { api, sha256 }
}

export function advancePatientAmendment(expected, amendment) {
  assert.equal(amendment.id, 'ADC-CONTRACT-20261112-02')
  assert.equal(amendment.status, 'owner-approved')
  assert.equal(amendment.previous_amendment, 'ADC-CONTRACT-20261111-01')
  assert.equal(amendment.operation_count, 82)
  assert.equal(amendment.preserved_original_operation_count, 81)
  assert.deepEqual(amendment.files.map(file => file.path).sort(), ['api.md','openapi.json','operations.md'].map(name => `specs/001-system-specification/contracts/${name}`).sort())
  for (const file of amendment.files) {
    assert.equal(file.before_sha256, expected.get(file.path), 'Patient amendment must chain from the preceding approved fingerprint')
    assert.match(file.after_sha256, /^[a-f0-9]{64}$/)
  }
  for (const file of amendment.files) expected.set(file.path, file.after_sha256)
}

export function advanceResourceAmendment(expected, amendment) {
  assert.equal(amendment.id, 'ADC-CONTRACT-20261112-03')
  assert.equal(amendment.status, 'owner-approved')
  assert.equal(amendment.previous_amendment, 'ADC-CONTRACT-20261112-02')
  assert.equal(amendment.operation_count, 82)
  assert.deepEqual(amendment.files.map(file=>file.path).sort(), ['api.md','openapi.json','operations.md'].map(name=>`specs/001-system-specification/contracts/${name}`).sort())
  for(const file of amendment.files){assert.equal(file.before_sha256,expected.get(file.path));assert.match(file.after_sha256,/^[a-f0-9]{64}$/)}
  for(const file of amendment.files)expected.set(file.path,file.after_sha256)
}

export function operations(api) {
  return Object.entries(api.paths).flatMap(([path, item]) => methods.filter(method => item[method]).map(method => ({ path, method, operation: item[method] })))
}

export function advanceSelfRegistrationAmendment(expected,amendment){
  assert.equal(amendment.id,'ADC-CONTRACT-20261124-05')
  assert.equal(amendment.status,'owner-approved')
  assert.equal(amendment.previous_amendment,'ADC-CONTRACT-20261112-04')
  assert.equal(amendment.operation_count,83)
  assert.equal(amendment.business_schema_changed,false)
  assert.deepEqual(amendment.files.map(file=>file.path).sort(),['api.md','identity.md','operations.md','openapi.json'].map(name=>`specs/001-system-specification/contracts/${name}`).sort())
  for(const file of amendment.files){assert.equal(file.before_sha256,expected.get(file.path));assert.match(file.after_sha256,/^[a-f0-9]{64}$/)}
  for(const file of amendment.files)expected.set(file.path,file.after_sha256)
}

export function advanceAppointmentAmendment(expected,amendment){
  assert.equal(amendment.id,'ADC-CONTRACT-20261112-04')
  assert.equal(amendment.status,'owner-approved')
  assert.equal(amendment.previous_amendment,'ADC-CONTRACT-20261112-03')
  assert.equal(amendment.operation_count,82)
  assert.deepEqual(amendment.files.map(file=>file.path).sort(),['api.md','openapi.json','operations.md'].map(name=>`specs/001-system-specification/contracts/${name}`).sort())
  for(const file of amendment.files){assert.equal(file.before_sha256,expected.get(file.path));assert.match(file.after_sha256,/^[a-f0-9]{64}$/)}
  for(const file of amendment.files)expected.set(file.path,file.after_sha256)
}
