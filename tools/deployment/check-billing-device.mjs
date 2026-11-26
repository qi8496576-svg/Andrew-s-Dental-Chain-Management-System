import fs from 'node:fs'
import assert from 'node:assert/strict'
import {connect} from './wechat-device.mjs'
import {accounts,login,get,privateRoot,origin} from './cloud-api.mjs'
const directory='docs/verification/patient-billing-20261125',probeFile=privateRoot+'/billing-probe.json'
const approved=JSON.parse(fs.readFileSync(privateRoot+'/self-registration-probe.json','utf8'))
assert.equal(accounts.purpose,'owner-approved-cloud-synthetic-integration-only-20261124')
const report={date:new Date().toISOString(),origin,wechat_login_mocked:false,api_mocked:false,modal_mocked:true,modal_note:'模拟器原生提示框截图已核对；Tool.native确认未响应，自动化只替换showModal的确认返回值，业务方法、登录、请求和数据均真实。',real_charge:false,checks:[],screenshots:[]}
const d=await connect();let probe=fs.existsSync(probeFile)?JSON.parse(fs.readFileSync(probeFile,'utf8')):{}
const save=()=>fs.writeFileSync(probeFile,JSON.stringify(probe,null,2)+'\n')
async function capture(name){try{await d.capture(directory+'/'+name);report.screenshots.push({file:name,status:'PASS'})}catch(e){report.screenshots.push({file:name,status:'BLOCKED',reason:e.message})}}
async function waitPage(path){for(let i=0;i<80;i++){const s=await d.state();if(s.path===path)return d.idle();await new Promise(r=>setTimeout(r,250))}throw Error('Expected page not opened: '+path)}
try{
 if(probe.bill_id){const staff=await login(accounts.admin),old=await get('/patient-bills/'+probe.bill_id,staff);if(old.data.status==='CLOSED'){report.expired_probe_bill=probe.bill_id;probe={};save()}}
 report.stage='login';let s=await d.nav('authentication');if(!s.authenticated)s=await d.call('login');assert.equal(s.authenticated,true,s.error)
 report.stage='patient';s=await d.nav('patients');assert.equal(s.patient?.patient_id,approved.patient_id,'Preserve any other account/profile unchanged');report.patient_id=approved.patient_id
 report.stage='booking';s=await d.nav('appointment-booking');assert.ok(s.commonVisits.some(x=>x.id==='CHECKUP'&&x.available));assert.ok(s.commonVisits.some(x=>x.id==='CLEANING'&&x.available))
 await d.call('date',[{detail:{value:'2026-12-02'}}]);await d.call('chooseIntent',[{currentTarget:{dataset:{intent:'CHECKUP'}}}]);s=await d.call('search');
 while(!s.slots.some(x=>x.registration_fee_fen>0)&&s.next)s=await d.call('more')
 const index=s.slots.findIndex(x=>x.registration_fee_fen>0);assert.ok(index>=0,s.error||'No paid real schedule');const slot=s.slots[index];assert.ok(slot.professional_title);assert.ok(slot.specialty);assert.ok(slot.introduction)
 report.doctor={id:slot.dentist_id,title:slot.professional_title,specialty:slot.specialty,registration_fee_fen:slot.registration_fee_fen};report.schedule_id=slot.schedule_id;report.starts_at=slot.starts_at
 await d.call('select',[{currentTarget:{dataset:{index}}}]);await d.call('confirm',[{detail:{value:['confirmed']}}]);await capture('mini-doctor-and-fee.png')
 if(!probe.bill_id){
  const staff=await login(accounts.admin),prior=await get('/patient-bills?limit=100',staff);const ids=new Set(prior.data.items.map(x=>x.bill_id))
  await d.call('submit');s=await waitPage('pages/patient-bills/index');const bill=s.bills.find(x=>!ids.has(x.bill_id)&&x.status==='PENDING'&&x.patient_id===approved.patient_id);assert.ok(bill,s.error||'New registration bill missing');probe={bill_id:bill.bill_id,patient_id:approved.patient_id};save()
 }else s=await d.nav('patient-bills')
 let bill=s.bills.find(x=>x.bill_id===probe.bill_id);assert.ok(bill,'Owned bill missing');report.bill_id=probe.bill_id;await capture('mini-pending-bill.png')
 report.stage='demo-payment'
 if(bill.status==='PENDING'){
  await d.rpc('App.mockWxMethod',{method:'showModal',result:{confirm:true,cancel:false}})
  try{await d.call('action',[{currentTarget:{dataset:{id:bill.bill_id,action:'pay'}}}])}finally{await d.rpc('App.mockWxMethod',{method:'showModal'})}
  for(let i=0;i<60;i++){s=await d.idle();bill=s.bills.find(x=>x.bill_id===probe.bill_id);if(bill?.status!=='PENDING')break;await new Promise(r=>setTimeout(r,300))}
 }
 assert.equal(bill?.status,'PAID',s.error||'Demo payment incomplete');assert.equal(bill.mode,'DEMO');assert.ok(bill.appointment_id);probe.appointment_id=bill.appointment_id;save();report.appointment_id=probe.appointment_id;await capture('mini-paid-bill.png')
 report.stage='management-readback';const staff=await login(accounts.admin),frontdesk=await login(accounts.frontdesk);const managed=await get('/patient-bills/'+probe.bill_id,staff),appointment=await get('/appointments/'+probe.appointment_id,frontdesk);assert.equal(managed.data.status,'PAID');assert.equal(appointment.data.status,'SCHEDULED');assert.equal(managed.data.appointment_id,appointment.data.appointment_id);report.management_paid='PAID';report.management_booking='SCHEDULED'
 report.stage='cancel-refund';s=await d.nav('appointment-cancellation');while(!s.appointments.some(a=>a.appointment_id===probe.appointment_id)&&s.next)s=await d.call('more');assert.ok(s.appointments.some(a=>a.appointment_id===probe.appointment_id),s.error);await d.call('select',[{currentTarget:{dataset:{id:probe.appointment_id}}}]);await d.call('reason',[{detail:{value:'演示缴费及退款验收结束（虚构资料）'}}]);s=await d.call('submit');assert.match(s.notice,/已取消/,s.error)
 const cancelled=await get('/appointments/'+probe.appointment_id,frontdesk),refund=await get('/patient-bills/'+probe.bill_id,staff);assert.equal(cancelled.data.status,'CANCELLED');assert.equal(refund.data.status,'REFUNDED');assert.equal(refund.data.payment.status,'REFUNDED');assert.ok(refund.data.payment.refund_id)
 s=await d.nav('patient-bills');assert.equal(s.bills.find(x=>x.bill_id===probe.bill_id)?.status,'REFUNDED');await capture('mini-refunded-bill.png');report.management_cancelled='CANCELLED';report.management_refunded='REFUNDED'
 report.checks.push('真实微信身份、正式域名API、同一MySQL','看牙/洗牙入口以及真实医生职称、方向、简介和费用','真实号源保留后演示缴费建立预约；提示框确认采用自动返回值','患者取消后管理端预约取消、支付与退款记录一致','无API或微信登录mock；不扣真实款')
 report.status='PASS';report.stage='COMPLETE'
}catch(e){report.status='FAIL';report.error=e.message;process.exitCode=1}finally{d.close();fs.writeFileSync(directory+'/device-integration.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))}
