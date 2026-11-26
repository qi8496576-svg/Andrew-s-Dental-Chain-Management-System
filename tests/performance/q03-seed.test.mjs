import test from 'node:test'
import assert from 'node:assert/strict'
import {layout,seedRows,approvedScale} from './q03-seed.mjs'

test('approved baseline has exact scale and disjoint owned mutation pools',()=>{
  assert.deepEqual(approvedScale,{clinics:30,dentists:100,patients:10000,appointments:100000})
  const care=new Set(),invoices=new Set(),slots=new Set()
  for(let i=0;i<100000;i++){
    const row=layout(i,approvedScale,'2026-11-18')
    const key=row.dentist+':'+row.scheduled
    assert.ok(!slots.has(key));slots.add(key)
    assert.ok(row.patient>=1&&row.patient<=10000)
    assert.ok(row.clinic>=1&&row.clinic<=30)
    assert.equal(row.status,i<50000?'IN_PROGRESS':'COMPLETED')
    assert.ok(row.scheduled<'2026-11-18')
    ;(row.status==='IN_PROGRESS'?care:invoices).add(String(row.id))
  }
  assert.equal(care.size,50000);assert.equal(invoices.size,50000)
  for(const id of care)assert.ok(!invoices.has(id))
})
test('seed preserves two exact-price treatments, real timestamps and explicit state events',()=>{
  const scale={clinics:2,dentists:2,patients:4,appointments:8}
  const rows=Object.fromEntries(['Appointment','AppliedTreatment','AppointmentEvent','DentistSchedule'].map(table=>[table,[...seedRows(table,scale,'2026-11-18')]]))
  assert.equal(rows.Appointment.length,8);assert.equal(rows.AppliedTreatment.length,16)
  assert.equal(rows.AppointmentEvent.length,20)
  for(const row of rows.AppliedTreatment){assert.equal(row[4],'1.00');assert.equal(row[5],'10.00');assert.equal(row[6],'10.00')}
  for(const row of rows.Appointment){assert.equal(row[11],row[5]);assert.equal(row[8]===null,row[6]==='IN_PROGRESS');assert.ok(row[7].includes('SYNTHETIC'))}
  assert.equal(rows.DentistSchedule.filter(r=>r[3]==='2026-11-19').length,2)
})
test('invalid or nondivisible scale and malformed dates are rejected before generation',()=>{
  for(const scale of [{...approvedScale,dentists:0},{...approvedScale,appointments:99},{...approvedScale,patients:1.2}])assert.throws(()=>layout(0,scale,'2026-11-18'))
  assert.throws(()=>layout(0,approvedScale,'2026-02-30'))
  assert.throws(()=>layout(-1,approvedScale,'2026-11-18'))
})
