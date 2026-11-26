import fs from 'node:fs'
import path from 'node:path'
import {once} from 'node:events'
import {pathToFileURL} from 'node:url'
import assert from 'node:assert/strict'

export const approvedScale=Object.freeze({clinics:30,dentists:100,patients:10000,appointments:100000})
function validate(scale,asOf){
  for(const name of Object.keys(approvedScale))assert.ok(Number.isSafeInteger(scale[name])&&scale[name]>0,'Invalid scale: '+name)
  assert.ok(scale.dentists>=scale.clinics&&scale.appointments%(scale.dentists*2)===0,'Nondivisible clinic/worker inventory')
  assert.match(asOf,/^\d{4}-\d{2}-\d{2}$/)
  assert.equal(new Date(asOf+'T00:00:00Z').toISOString().slice(0,10),asOf,'Invalid date')
}
const stamp=ms=>new Date(ms).toISOString().slice(0,19).replace('T',' ')
const day=ms=>new Date(ms).toISOString().slice(0,10)
export function layout(index,scale,asOf){
  validate(scale,asOf)
  assert.ok(Number.isInteger(index)&&index>=0&&index<scale.appointments)
  const dentist=index%scale.dentists+1,slot=Math.floor(index/scale.dentists)%20,
    ordinal=Math.floor(index/(scale.dentists*20)),days=Math.ceil(scale.appointments/(scale.dentists*20)),
    base=Date.parse(asOf+'T00:00:00Z')-days*86400000,time=base+ordinal*86400000+3600000+slot*1200000
  return {id:index+1,patient:index%scale.patients+1,dentist,clinic:(dentist-1)%scale.clinics+1,
    schedule:ordinal*scale.dentists+dentist,date:day(time),scheduled:stamp(time),time,
    status:index<scale.appointments/2?'IN_PROGRESS':'COMPLETED'}
}
export const columns={
 Clinic:['clinic_id','clinic_code','postal_address','manager_name','phone','email','office_area_sqm','is_active','created_at'],
 Dentist:['dentist_id','employee_number','full_name','date_of_birth','home_address','phone','email','hire_date','is_active','created_at','termination_date'],
 Qualification:['qualification_id','qualification_name','description','is_active'],
 DentistQualification:['dentist_id','qualification_id','certificate_number','granted_date','expiry_date','verification_status'],
 DentistClinicAssignment:['assignment_id','dentist_id','clinic_id','start_date','end_date','availability_note','is_active'],
 Treatment:['treatment_id','treatment_code','treatment_name','description','default_unit_price','is_active'],
 TreatmentQualification:['treatment_id','qualification_id','is_mandatory'],
 Patient:['patient_id','patient_number','full_name','date_of_birth','billing_address','phone','email','emergency_contact_name','emergency_contact_phone','created_at','updated_at','allergy_review_status'],
 DentistSchedule:['schedule_id','dentist_id','clinic_id','schedule_date','start_time','end_time','slot_minutes','schedule_status','note','created_at'],
 Appointment:['appointment_id','patient_id','clinic_id','dentist_id','schedule_id','scheduled_at','status','problems_or_special_needs','completed_at','created_at','updated_at','attended_at','cancelled_at','cancellation_reason','cancellation_kind','rescheduled_from_id'],
 AppointmentRequestedTreatment:['appointment_id','treatment_id','request_note'],
 AppliedTreatment:['applied_treatment_id','appointment_id','treatment_id','dentist_id','standard_units','unit_price','subtotal','performed_at'],
 AppointmentEvent:['appointment_event_id','appointment_id','event_type','from_status','to_status','occurred_at','actor_role','actor_reference','reason','request_key','details'],
}
export function* seedRows(table,scale=approvedScale,asOf){
 validate(scale,asOf)
 const created='2000-01-01 00:00:00',fictional='Q03 SYNTHETIC ONLY',days=Math.ceil(scale.appointments/(scale.dentists*20))
 if(table==='Clinic')for(let n=1;n<=scale.clinics;n++)yield [n,'Q03-C'+n,fictional,null,'000',null,'100.00',1,created]
 else if(table==='Dentist')for(let n=1;n<=scale.dentists;n++)yield [n,'Q03-D'+n,fictional+' '+n,'1980-01-01',fictional,'000',null,'2000-01-01',1,created,null]
 else if(table==='Qualification')yield [1,'Q03 synthetic qualification',fictional,1]
 else if(table==='DentistQualification')for(let n=1;n<=scale.dentists;n++)yield [n,1,'Q03-CERT'+n,'2000-01-01',null,'VERIFIED']
 else if(table==='DentistClinicAssignment')for(let n=1;n<=scale.dentists;n++)yield [n,n,(n-1)%scale.clinics+1,'2000-01-01',null,fictional,1]
 else if(table==='Treatment')yield [1,'Q03-T1','Q03 synthetic treatment',fictional,'10.00',1]
 else if(table==='TreatmentQualification')yield [1,1,1]
 else if(table==='Patient')for(let n=1;n<=scale.patients;n++)yield [n,'Q03-P'+n,fictional+' '+n,'1990-01-01',fictional,'000',null,fictional,'000',created,created,'NO_KNOWN']
 else if(table==='DentistSchedule'){
   for(let d=0;d<days;d++)for(let n=1;n<=scale.dentists;n++)yield [d*scale.dentists+n,n,(n-1)%scale.clinics+1,day(Date.parse(asOf+'T00:00:00Z')+(d-days)*86400000),'09:00:00','15:40:00',20,'NORMAL',fictional,created]
   for(let n=1;n<=scale.dentists;n++)yield [days*scale.dentists+n,n,(n-1)%scale.clinics+1,day(Date.parse(asOf+'T00:00:00Z')+86400000),'09:00:00','15:40:00',20,'NORMAL',fictional,created]
 }else if(['Appointment','AppointmentRequestedTreatment','AppliedTreatment','AppointmentEvent'].includes(table))for(let i=0;i<scale.appointments;i++){
   const r=layout(i,scale,asOf),complete=r.status==='COMPLETED'
   if(table==='Appointment')yield [r.id,r.patient,r.clinic,r.dentist,r.schedule,r.scheduled,r.status,fictional,complete?stamp(r.time+900000):null,stamp(r.time-86400000),complete?stamp(r.time+900000):r.scheduled,r.scheduled,null,null,null,null]
   if(table==='AppointmentRequestedTreatment')yield [r.id,1,fictional]
   if(table==='AppliedTreatment')for(let k=0;k<2;k++)yield [i*2+k+1,r.id,1,r.dentist,'1.00','10.00','10.00',stamp(r.time+300000+k*60000)]
   if(table==='AppointmentEvent'){
     yield [i*3+1,r.id,'BOOK',null,'SCHEDULED',stamp(r.time-86400000),'RECEPTION','Q03-SYNTHETIC',fictional,'q03-book-'+r.id,null]
     yield [i*3+2,r.id,'ATTEND','SCHEDULED','IN_PROGRESS',r.scheduled,'RECEPTION','Q03-SYNTHETIC',fictional,'q03-attend-'+r.id,null]
     if(complete)yield [i*3+3,r.id,'COMPLETE','IN_PROGRESS','COMPLETED',stamp(r.time+900000),'DENTIST','Q03-SYNTHETIC',fictional,'q03-complete-'+r.id,null]
   }
 }else throw Error('Unsupported seed table: '+table)
}
const literal=value=>value===null?'NULL':typeof value==='number'?String(value):"'"+String(value).replaceAll("'","''")+"'"
export async function writeSeed(directory,asOf,scale=approvedScale){
 validate(scale,asOf);fs.mkdirSync(directory,{recursive:false,mode:0o700})
 const output=fs.createWriteStream(path.join(directory,'seed-q03.sql'),{flags:'wx',mode:0o600}),counts={}
 const write=async text=>{if(!output.write(text))await once(output,'drain')}
 await write('-- SYNTHETIC LOAD FIXTURE ONLY. Use owned q03 isolation runner; never preview/production.\nSET time_zone = "+00:00";\nSTART TRANSACTION;\n')
 for(const [table,fields]of Object.entries(columns)){
   counts[table]=0;let batch=[]
   const flush=async()=>{if(batch.length){await write('INSERT INTO adc_business.`'+table+'` ('+fields.map(f=>'`'+f+'`').join(',')+') VALUES\n'+batch.join(',\n')+';\nCOMMIT;\nSTART TRANSACTION;\n');batch=[]}}
   for(const row of seedRows(table,scale,asOf)){assert.equal(row.length,fields.length,table);batch.push('('+row.map(literal).join(',')+')');counts[table]++;if(batch.length===500)await flush()}
   await flush()
 }
 await write('COMMIT;\n');output.end();await once(output,'finish')
 const future=day(Date.parse(asOf+'T00:00:00Z')+86400000)
 const workers=Array.from({length:scale.dentists},(_,i)=>({dentist_id:String(i+1),clinic_id:String(i%scale.clinics+1),
   candidates:{clinic_id:String(i%scale.clinics+1),start:future+'T09:00:00+08:00',end:future+'T15:40:00+08:00',treatment_ids:['1']},treatments:[],invoices:[]}))
 for(let i=0;i<scale.appointments;i++){const row=layout(i,scale,asOf),worker=workers[row.dentist-1];if(row.status==='COMPLETED')worker.invoices.push(String(row.id));else worker.treatments.push({appointment_id:String(row.id),body:{treatment_id:'1',standard_units:'1.00',performed_at:new Date(row.time+420000).toISOString()}})}
 const plan={kind:'adc-q03-inventory-plan-not-authenticated-fixture',as_of:asOf,source:'explicit SQL synthetic baseline, not proof of API workflow execution',counts,workers}
 fs.writeFileSync(path.join(directory,'inventory-plan.json'),JSON.stringify(plan),{flag:'wx',mode:0o600})
 return {counts,workers:workers.length}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 assert.equal(process.argv[2],'--synthetic-isolated-only','Explicit synthetic generation required')
 assert.equal(process.argv.length,5,'usage: node q03-seed.mjs --synthetic-isolated-only NEW_DIRECTORY YYYY-MM-DD')
 console.log(JSON.stringify(await writeSeed(path.resolve(process.argv[3]),process.argv[4])))
}
