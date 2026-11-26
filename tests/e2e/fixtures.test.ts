import test from 'node:test'
import assert from 'node:assert/strict'
import { fictionalData } from './fixtures.ts'

test('test mutations cannot contaminate another test', () => {
  const first = fictionalData()
  first.patients[0]!.full_name = 'modified in one test'
  assert.notEqual(first.patients[0]!.full_name, fictionalData().patients[0]!.full_name)
})

test('fixtures cover exactly the five states and four cancellation categories', () => {
  const cases = fictionalData().appointment_cases
  assert.deepEqual([...new Set(cases.map(x => x.appointment.status))].sort(), ['CANCELLED','COMPLETED','IN_PROGRESS','INVOICED','SCHEDULED'].sort())
  assert.deepEqual(cases.filter(x => x.appointment.status === 'CANCELLED').map(x => x.appointment.cancellation_kind).sort(), ['CLINIC_CANCEL','CLINIC_RESCHEDULE','NO_SHOW','PATIENT_CANCEL'])
})

test('staff and patient identities are separate, with explicit clinic scopes', () => {
  const data = fictionalData()
  assert.equal(new Set(data.staff.map(x => x.subject_id)).size, 4)
  for (const staff of data.staff) {
    assert.ok(staff.clinic_ids.length > 0)
    assert.equal(staff.subject_type, 'STAFF')
    if (staff.role_code !== 'DENTIST') assert.equal('dentist_id' in staff, false)
  }
})
