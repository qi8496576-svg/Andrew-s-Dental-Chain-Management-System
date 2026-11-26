import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {accounts,privateRoot,origin,login,catalog,get,request,key} from './cloud-api.mjs'
const directory='docs/verification/resource-availability-20261124',config=JSON.parse(fs.readFileSync(directory+'/configuration.json','utf8'))
const fixture=JSON.parse(fs.readFileSync(path.join(privateRoot,'fixture.json'),'utf8'))
assert.equal(config.purpose,fixture.purpose)
const admin=await login(accounts.admin),reception=await login(accounts.frontdesk)
const shift=(date,offset)=>new Date(Date.parse(date+'T12:00:00Z')+offset*86400000).toISOString().slice(0,10)
const schedules=await catalog('schedules',reception,{clinic_id:'1',start:config.first_day+'T00:00:00+08:00',end:shift(config.last_day,1)+'T00:00:00+08:00'})
const valid=new Map(schedules.map(s=>[s.schedule_id,s])),report={checked_at:new Date().toISOString(),origin,api_mocked:false,days:[],services:config.treatments,doctors:config.doctors,checks:[]}
const minutes=time=>Number(time.slice(0,2))*60+Number(time.slice(3,5))
for(const doctor of config.doctors)for(let offset=0;offset<28;offset++){
 const rows=schedules.filter(s=>s.dentist_id===doctor.id&&s.schedule_date===shift(config.first_day,offset)).sort((a,b)=>a.start_time.localeCompare(b.start_time))
 assert.ok(rows.length>=2)
 for(let i=1;i<rows.length;i++)assert.ok(minutes(rows[i-1].end_time)<=minutes(rows[i].start_time),'Overlapping schedules found')
}
report.checks.push('Every configured doctor has nonoverlapping real schedules across all 28 future days')
let queries=0
for(let offset=0;offset<28;offset++){
 const date=shift(config.first_day,offset),counts=[]
 for(const treatment of config.treatments){
  const q=new URLSearchParams({clinic_id:'1',start:date+'T00:00:00+08:00',end:shift(date,1)+'T00:00:00+08:00',treatment_ids:treatment.id,limit:'100'})
  const result=(await get('/appointment-candidates?'+q,reception)).data
  assert.ok(result.items.length>0,'No real candidates: '+date+' '+treatment.name)
  for(const slot of result.items){const schedule=valid.get(slot.schedule_id);assert.ok(schedule);assert.equal(schedule.schedule_status,'NORMAL');assert.equal(schedule.dentist_id,slot.dentist_id);assert.equal(schedule.schedule_date,date);assert.ok(config.doctors.some(d=>d.id===slot.dentist_id))}
  counts.push({treatment:treatment.name,available_slots:result.items.length});queries++
 }
 report.days.push({date,services:counts})
}
report.candidate_queries=queries;report.checks.push('All 12 actual service resources have valid backend candidates on every one of the 28 dates')
const names=await catalog('treatments',admin);assert.ok(!names.some(t=>/本地|云端|联调/.test(t.label)))
const journalFile=path.join(privateRoot,'availability-probe.json'),journal=fs.existsSync(journalFile)?JSON.parse(fs.readFileSync(journalFile,'utf8')):{purpose:fixture.purpose,commands:{},items:{}}
assert.equal(journal.purpose,fixture.purpose)
const save=()=>fs.writeFileSync(journalFile,JSON.stringify(journal,null,2)+'\n')
async function command(name,url,body){if(!journal.commands[name]){journal.commands[name]={key:key(),body};save()}const c=journal.commands[name],r=await request('POST',url,c.body,reception,c);assert.equal(r.status,200,name+': '+r.data?.code);return r.data}
async function step(name,work){if(journal.items[name])return journal.items[name];const value=await work();journal.items[name]=value;save();return value}
const basis={clinic_id:'1',person_confirmed:true,service_basis:'OWNER_APPROVED_SYNTHETIC_AVAILABILITY_VERIFICATION'}
const verified=await command('lookup-before','/patients/lookup',{patient_number:fixture.items.patient.patient_number,date_of_birth:fixture.items.patient.date_of_birth,verification_basis:basis})
const patient=verified.patient,allergies=await catalog('patients/'+patient.patient_id+'/allergy-records',reception)
const treatment=config.treatments.find(t=>t.name==='树脂补牙')
const q=new URLSearchParams({clinic_id:'1',start:config.last_day+'T00:00:00+08:00',end:shift(config.last_day,1)+'T00:00:00+08:00',treatment_ids:treatment.id,limit:'100'})
const slot=(await get('/appointment-candidates?'+q,reception)).data.items[0]
const details={full_name:patient.full_name,date_of_birth:patient.date_of_birth,phone:patient.phone,billing_address:patient.billing_address,email:patient.email??null,emergency_contact_name:patient.emergency_contact_name,emergency_contact_phone:patient.emergency_contact_phone}
const appointment=await step('book',()=>command('book','/appointments',{clinic_id:'1',schedule_id:slot.schedule_id,scheduled_at:slot.starts_at,requested_treatment_ids:[treatment.id],patient_id:patient.patient_id,patient_verification_reference:verified.verification_reference,patient_details:details,allergy_confirmation_reference:patient.allergy_confirmation_reference,allergy_declaration:{review_status:patient.allergy_review_status,records:allergies.filter(a=>!a.is_retracted).map(a=>({allergy_id:a.allergy_id,severity_note:a.severity_note??null})),confirmed:true}}))
const beforeCancel=await command('lookup-cancel','/patients/lookup',{patient_number:patient.patient_number,date_of_birth:patient.date_of_birth,verification_basis:basis})
await step('cancel',()=>command('cancel','/appointments/'+appointment.appointment_id+'/cancel',{verification_reference:beforeCancel.verification_reference,reason:'虚构资料：未来排班可用性验收完成，释放测试时段'}))
assert.equal((await get('/appointments/'+appointment.appointment_id,reception)).data.status,'CANCELLED')
report.probe={date:config.last_day,treatment:treatment.name,appointment_id:appointment.appointment_id,created_via_real_api:true,final_status:'CANCELLED'}
report.checks.push('A future appointment creates through the existing API and cancels through normal verified reception handling')
const historical=JSON.parse(fs.readFileSync('docs/verification/cloud-integration-20261124/patient-admin.json','utf8'))
report.existing_appointments=[]
for(const [id,status] of [[historical.fixture.appointment_id,'CANCELLED'],[historical.fixture.attended_appointment_id,'IN_PROGRESS']]){const a=(await get('/appointments/'+id,reception)).data;assert.equal(a.status,status);report.existing_appointments.push({id,status:a.status})}
report.status='PASS';fs.writeFileSync(directory+'/availability.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,days:report.days.length,services:config.treatments.length,doctors:config.doctors.length,real_candidate_queries:queries,probe:report.probe}))
