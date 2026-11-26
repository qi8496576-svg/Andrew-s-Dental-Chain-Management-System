import test from 'node:test'
import assert from 'node:assert/strict'
import { loadContract } from '../scripts/contract.mjs'
import { effectiveOpenApiHash, advancePatientAmendment } from '../scripts/source.mjs'

const contract = await loadContract()
test('owner-approved first registration needs no patient number or staff proof and keeps self-report distinct',()=>{
  const input={clinic_id:'1',full_name:'Synthetic',date_of_birth:'1990-01-02',phone:'000',billing_address:'Synthetic',emergency_contact_name:'Synthetic',emergency_contact_phone:'000',allergy_statement:'UNSURE',consent:true}
  assert.equal(contract.schemas.SelfPatientRegistration(input),true)
  assert.equal(contract.schemas.SelfPatientRegistration({...input,patient_id:'2'}),false)
  assert.equal(contract.schemas.SelfPatientRegistration({...input,patient_number:'P2'}),false)
  assert.equal(contract.schemas.SelfPatientRegistration({...input,verification_basis:{person_confirmed:true}}),false)
  assert.equal(contract.schemas.SelfPatientRegistration({...input,consent:false}),false)
  assert.equal(contract.schemas.PatientView({patient_id:'2',patient_number:'P2',full_name:'Synthetic',allergy_review_status:'NOT_REVIEWED',registration_method:'SELF_DECLARED',self_reported_allergies:'本人填报：不确定',allergy_confirmation_reference:'SD1:2:snapshot'}),true)
})
test('appointment details require only booking identity and contact fields without accepting staff verification',()=>{
  const patient={full_name:'Fixture',date_of_birth:'1990-01-02',phone:'000',billing_address:'Fixture',emergency_contact_name:'Fixture',emergency_contact_phone:'000'}
  assert.equal(contract.schemas.AppointmentPatientDetails(patient),true)
  assert.equal(contract.schemas.PatientCreate(patient),false)
  assert.equal(contract.schemas.AppointmentPatientDetails({...patient,verification_basis:{clinic_id:'1',person_confirmed:true,service_basis:'fixture'}}),false)
  const minimal={full_name:'Fixture',date_of_birth:'1990-01-02',phone:'000'}
  assert.equal(contract.schemas.AppointmentPatientDetails(minimal),true)
  assert.equal(contract.schemas.AppointmentPatientDetails({...minimal,billing_address:null,emergency_contact_name:null,emergency_contact_phone:null}),true)
  const incomplete={...minimal};delete incomplete.phone
  assert.equal(contract.schemas.AppointmentPatientDetails(incomplete),false)
})
test('organization resource projections preserve the patient allergy model and identify original assignment rows',()=>{
  assert.equal(contract.schemas.AssignmentEntry({assignment_id:'9007199254740993',clinic_id:'1',start_date:'2026-01-01',is_active:true}),true)
  assert.equal(contract.validateResponse('getAllergy',200,{allergy_id:'1',allergy_name:'Fixture',description:null,is_active:true}),true)
  assert.equal(contract.validateResponse('listPatientAllergies',200,{items:[{allergy_id:'1',allergy_name:'Fixture',is_retracted:false}],next_cursor:null}),true)
  assert.equal(contract.schemas.AllergyView({allergy_id:'1',allergy_name:'Fixture',is_active:true}),false)
  assert.equal(contract.schemas.DentistView({dentist_id:'1',clinic_assignments:[{assignment_id:'1',clinic_id:'1',start_date:'2026-01-01',end_date:null,availability_note:null,is_active:true}],qualifications:[],future_impact:[{object_kind:'DentistSchedule',object_id:'2',clinic_id:'1',affected_date:'2026-12-01',reason:'ASSIGNMENT_END'}]}),true)
})
test('patient amendment must chain from the prior approval and cannot alter an unrelated file', async()=>{
  const {readFile}=await import('node:fs/promises')
  const amendment=JSON.parse(await readFile(new URL('../../../specs/001-system-specification/contracts/approved-amendments/20261112-patient-lookup.json',import.meta.url),'utf8'))
  const before=()=>new Map(amendment.files.map(file=>[file.path,file.before_sha256]))
  const approved=before();advancePatientAmendment(approved,amendment)
  for(const file of amendment.files)assert.equal(approved.get(file.path),file.after_sha256)
  assert.throws(()=>advancePatientAmendment(before(),{...amendment,status:'draft'}))
  assert.throws(()=>advancePatientAmendment(new Map(),amendment))
  assert.throws(()=>advancePatientAmendment(before(),{...amendment,files:[...amendment.files,{path:'.specify/memory/constitution.md',before_sha256:'0'.repeat(64),after_sha256:'1'.repeat(64)}]}))
  assert.equal(contract.table.size,91)
})
test('approved patient lookup carries an actual clinic and manual verification context', () => {
  const basis={clinic_id:'1',person_confirmed:true,service_basis:'fictional in-person visit'}
  const body={patient_number:'F-001',date_of_birth:'1990-01-02',verification_basis:basis}
  assert.equal(contract.validateRequest('lookupPatient',body),true)
  assert.equal(contract.validateRequest('lookupPatient',{...body,verification_basis:{...basis,clinic_id:1}}),false)
  assert.equal(contract.validateRequest('lookupPatient',{patient_number:'F-001',date_of_birth:'1990-01-02'}),false)
  assert.equal(contract.validateRequest('lookupPatient',{...body,phone:'unapproved lookup key'}),false)
  assert.equal(contract.validateHeaders('lookupPatient',{}),false)
  const patient={full_name:'Fictional Patient',date_of_birth:'1990-01-02',phone:'000',billing_address:'Fixture',emergency_contact_name:'Fixture',emergency_contact_phone:'001'}
  assert.equal(contract.validateRequest('createPatient',patient),false)
  assert.equal(contract.validateRequest('createPatient',{...patient,verification_basis:basis}),true)
})
test('only the explicitly approved UUID parameter correction can advance the frozen hash', async () => {
  const { readFile } = await import('node:fs/promises')
  const amendment = JSON.parse(await readFile(new URL('../../../specs/001-system-specification/contracts/approved-amendments/20261111-grant-subject-id.json', import.meta.url), 'utf8'))
  assert.equal(effectiveOpenApiHash(amendment.before_sha256, amendment), amendment.after_sha256)
  assert.throws(() => effectiveOpenApiHash('0'.repeat(64), amendment))
  assert.throws(() => effectiveOpenApiHash(amendment.before_sha256, { ...amendment, status: 'draft' }))
  assert.throws(() => effectiveOpenApiHash(amendment.before_sha256, { ...amendment, json_pointer: '/components/schemas/Id' }))
  assert.deepEqual(contract.api.paths['/identity/grants'].get.parameters.find(p => p.name === 'subject_id').schema, { type: 'string' })
  assert.equal(contract.schemas.Id('9223372036854775807'), true)
  assert.equal(contract.schemas.Id('not-a-business-id'), false)
})

test('IDs stay decimal strings, including values beyond Number safe integer', () => {
  assert.equal(contract.schemas.Id('9007199254740993'), true)
  for (const input of [9007199254740992, '0', '-1', '1.0', '']) assert.equal(contract.schemas.Id(input), false)
})

test('DECIMAL schema boundaries preserve precision without coercion', () => {
  assert.equal(contract.schemas.Money('-123.45'), true)
  assert.equal(contract.schemas.UnitPrice('0.00'), true)
  assert.equal(contract.schemas.Units('0.01'), true)
  assert.equal(contract.schemas.Money(123.45), false)
  assert.equal(contract.schemas.Money('1.234'), false)
  assert.equal(contract.schemas.Money('1234567890123.00'), false)
  assert.equal(contract.schemas.UnitPrice('-1.00'), false)
  assert.equal(contract.schemas.Units('0.00'), false)
})

test('write headers enforce the declared key and version requirements', () => {
  assert.equal(contract.validateHeaders('createAppointment', { 'Idempotency-Key': 'fictional-request-1' }), true)
  assert.equal(contract.validateHeaders('createAppointment', {}), false)
  assert.equal(contract.validateHeaders('createAppointment', { 'Idempotency-Key': 'x'.repeat(65) }), false)
  assert.equal(contract.validateHeaders('updatePatient', { 'Idempotency-Key': 'fictional-request-2' }), false)
  assert.equal(contract.validateHeaders('updatePatient', { 'idempotency-key': 'fictional-request-2', 'if-match': '"fictional-version"' }), true)
})

test('declared error envelopes cover all operations and reject leaked fields', () => {
  const error = { code: 'STATE_CONFLICT', message: 'fictional conflict', request_id: 'fictional-request' }
  for (const [id, entry] of contract.table) {
    for (const status of Object.keys(entry.response).filter(s => /^[45]\d\d$/.test(s))) {
      // This checks the envelope, not whether STATE_CONFLICT belongs to each HTTP status.
      assert.equal(contract.validateResponse(id, status, error), true)
      assert.equal(contract.validateResponse(id, status, { ...error, sql: 'must not be exposed' }), false)
    }
  }
  assert.equal(contract.schemas.Error({ code: 'STATE_CONFLICT', message: 'missing request_id' }), false)
})

test('unknown request fields and malformed dates are rejected', () => {
  const input = { dentist_id:'1', clinic_id:'1', schedule_date:'2026-11-11', start_time:'09:00:00', end_time:'10:00:00', slot_minutes:30 }
  assert.equal(contract.validateRequest('createSchedule', input), true)
  assert.equal(contract.validateRequest('createSchedule', { ...input, schedule_date: '2026-02-30' }), false)
  assert.equal(contract.validateRequest('createSchedule', { ...input, status:'NORMAL' }), false)
})

test('documented error meaning distinguishes conflict, precondition and unknown outcome', () => {
  const error = code => ({ code, message: 'fictional failure', request_id: 'fictional-request' })
  assert.equal(contract.inspectError(409, error('STATE_CONFLICT')).status_compatible, true)
  assert.equal(contract.inspectError(412, error('STATE_CONFLICT')).status_compatible, false)
  assert.equal(contract.inspectError(412, error('PRECONDITION_FAILED')).status_compatible, true)
  assert.equal(contract.inspectError(503, { ...error('COMMIT_OUTCOME_UNKNOWN'), retry_with_same_key:true }).status_compatible, true)
  // The source schema intentionally leaves code as a string. Do not invent a status mapping.
  assert.equal(contract.inspectError(500, error('UNSPECIFIED_BY_STATUS_TABLE')).status_compatible, null)
})
