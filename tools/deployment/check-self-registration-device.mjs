import fs from 'node:fs'
import assert from 'node:assert/strict'
import {connect} from './wechat-device.mjs'
import {login,accounts,get,catalog,request,key,privateRoot,origin} from './cloud-api.mjs'
import {executeScript} from './cloud-ssh.mjs'
const directory='docs/verification/patient-onboarding-20261124',stateFile=privateRoot+'/self-registration-probe.json'
const report={at:new Date().toISOString(),origin,wechat_login_mocked:false,api_mocked:false,checks:[]}
const save=state=>fs.writeFileSync(stateFile,JSON.stringify(state,null,2)+'\n')
let saved=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):{}
const device=await connect()
const capture=async name=>{try{await device.capture(directory+'/'+name);(report.screenshots??=[]).push({file:name,status:'PASS'})}catch(error){(report.screenshots??=[]).push({file:name,status:'BLOCKED',reason:error.message})}}
try{
 const original=JSON.parse(fs.readFileSync(privateRoot+'/fixture.json','utf8'));assert.equal(original.purpose,'owner-approved-cloud-synthetic-integration-only-20261124');const oldPatient=original.items.patient.patient_id
 const originalBinding=JSON.parse(await executeScript('ops/scripts/check-self-registration.sh',['0',oldPatient,'0']));assert.equal(originalBinding.original_current_bindings,1)
 report.stage='login';let current=await device.nav('authentication');if(!current.authenticated)current=await device.call('login');assert.equal(current.authenticated,true,current.error)
 report.stage='resources-before-registration';current=await device.nav('appointment-booking');assert.equal(current.authenticated,true,current.error);assert.ok(current.clinics.length);assert.ok(current.treatments.length)
 const treatment=current.treatments.find(item=>item.label==='口腔检查');assert.ok(treatment)
 await device.call('date',[{detail:{value:'2026-12-01'}}]);await device.call('treatments',[{detail:{value:[treatment.id]}}]);current=await device.call('search');assert.ok(current.slots.length>0,current.error)
 if(!current.patient)report.checks.push('Unregistered WeChat user can browse real schedules without a patient number')
 report.stage='new-registration';current=await device.nav('patient-bindings')
 assert.ok('mode' in current,'New compiled registration page must be loaded')
 if(!current.binding){
  const values={full_name:'新客直约验收（虚构）',phone:'00000000001',billing_address:'虚构资料，仅用于首次预约验收',emergency_contact_name:'验收联系人（虚构）',emergency_contact_phone:'00000000002'}
  for(const [field,value] of Object.entries(values))await device.call('inputDetails',[{currentTarget:{dataset:{field}},detail:{value}}])
  await device.call('inputRegistrationBirth',[{detail:{value:'1991-02-03'}}]);await device.call('changeAllergy',[{detail:{value:'UNSURE'}}]);await device.call('inputAllergy',[{detail:{value:'虚构测试声明：不确定过敏情况，就诊时说明'}}]);await device.call('confirmRegistration',[{detail:{value:['confirmed']}}]);current=await device.call('register')
  assert.ok(current.binding?.patient_id,current.error);saved.patient_id=current.binding.patient_id;save(saved);report.new_registration_created=true
 }else{
  if(!saved.patient_id || current.binding.patient_id!==saved.patient_id)throw Error('Current WeChat already has another binding; preserved without replacing it')
  report.existing_probe_reused=true
 }
 await capture('mini-registration-success.png')
 report.stage='profile';current=await device.nav('patients');assert.equal(current.patient?.patient_id,saved.patient_id,current.error);assert.equal(current.patient.registration_method,'SELF_DECLARED');assert.equal(current.patient.allergy_review_status,'NOT_REVIEWED');assert.match(current.patient.self_reported_allergies,/本人填报/);assert.match(current.patient.allergy_confirmation_reference,/^SD1:/)
 report.patient_id=saved.patient_id;report.patient_number=current.patient.patient_number;saved.patient_number=current.patient.patient_number;save(saved);await capture('mini-self-profile.png')
 report.stage='booking';current=await device.nav('appointment-booking');assert.equal(current.patient?.patient_id,saved.patient_id,current.error)
 const project=current.treatments.find(item=>item.label==='口腔检查');assert.ok(project)
 await device.call('date',[{detail:{value:'2026-12-01'}}]);await device.call('treatments',[{detail:{value:[project.id]}}]);current=await device.call('search');assert.ok(current.slots.length>0,current.error)
 if(!saved.appointment_id){await device.call('select',[{currentTarget:{dataset:{index:0}}}]);await device.call('confirm',[{detail:{value:['confirmed']}}]);current=await device.call('submit');assert.match(current.notice,/预约已保存/,current.error);saved.appointment_id=current.notice.match(/\d+/)[0];save(saved)}
 report.stage='management-readback';const frontdesk=await login(accounts.frontdesk),before=await get('/appointments/'+saved.appointment_id,frontdesk);assert.equal(before.data.patient_id,saved.patient_id);report.appointment_id=saved.appointment_id;report.management_before=before.data.status
 report.stage='cancellation';current=await device.nav('appointment-cancellation');while(!current.appointments.some(item=>item.appointment_id===saved.appointment_id)&&current.next)current=await device.call('more')
 let appointment=current.appointments.find(item=>item.appointment_id===saved.appointment_id);assert.ok(appointment,current.error)
 if(appointment.status==='SCHEDULED'){await device.call('select',[{currentTarget:{dataset:{id:saved.appointment_id}}}]);await device.call('reason',[{detail:{value:'首次免核验预约流程验收结束（虚构资料）'}}]);current=await device.call('submit');assert.match(current.notice,/已取消/,current.error)}
 const after=await get('/appointments/'+saved.appointment_id,frontdesk);assert.equal(after.data.status,'CANCELLED');report.management_after=after.data.status
 current=await device.nav('appointment-cancellation');assert.equal(current.appointments.find(item=>item.appointment_id===saved.appointment_id)?.status,'CANCELLED');await capture('mini-self-records.png')
 report.stage='protected-original-record';assert.notEqual(saved.patient_id,oldPatient)
 const database=JSON.parse(await executeScript('ops/scripts/check-self-registration.sh',[saved.patient_id,oldPatient,saved.appointment_id]));assert.equal(database.business_tables,19);assert.equal(database.business_columns,163);assert.equal(database.new_current_bindings,1);assert.equal(database.original_current_bindings,1);assert.equal(database.original_subject_hash,originalBinding.original_subject_hash);assert.equal(database.self_declarations,1);assert.equal(database.allergy_status,'NOT_REVIEWED');assert.equal(database.appointment_status,'CANCELLED');assert.equal(database.appointment_events,2);report.database=database;report.original_other_account_binding_preserved=true
 report.checks.push('Native WeChat creates new self-declared profile with no patient number or manual approval','NOT_REVIEWED and patient statement remain distinct from clinical verification','Native booking and cancellation are reflected by the real frontdesk API','No binding of the original other-account patient was changed')
 report.stage='personal';current=await device.nav('personal');assert.equal(current.patient?.registration_method,'SELF_DECLARED');await capture('mini-personal.png')
 report.business_status='PASS';report.status='PASS';report.stage='COMPLETE'
}catch(error){report.status='FAIL';report.error=error.message;process.exitCode=1}finally{device.close();fs.writeFileSync(directory+'/device-integration.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))}
