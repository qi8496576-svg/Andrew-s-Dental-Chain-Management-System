import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url),{bookingPayload}=require('../../tmp/mini-http-test/pages/appointment-booking/payload.js')
test('native booking sends all known active allergies and original details but never caller supplied patient identity or staff creation basis',()=>{
  const patient={patient_id:'9007199254740993',patient_number:'P-1',full_name:'Fixture',date_of_birth:'1990-01-02',phone:'000',billing_address:'Fixture',emergency_contact_name:'Fixture',emergency_contact_phone:'000',allergy_review_status:'RECORDED',allergy_confirmation_reference:'AR1:server-reference'}
  const body=bookingPayload(patient,[{allergy_id:'1',severity_note:'severe',is_retracted:false},{allergy_id:'2',is_retracted:true}],{clinic_id:'1',schedule_id:'3',starts_at:'2026-11-14T01:00:00Z'},['4'],true)
  assert.equal(body.patient_id,undefined);assert.equal(body.patient_verification_reference,undefined);assert.equal(body.patient_details.verification_basis,undefined);assert.equal(body.patient_details.emergency_contact_phone,'000');assert.deepEqual(body.allergy_declaration.records,[{allergy_id:'1',severity_note:'severe'}]);assert.equal(body.allergy_confirmation_reference,patient.allergy_confirmation_reference)
})
