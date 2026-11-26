import fs from 'node:fs'
import https from 'node:https'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {chromium} from '../../apps/admin/node_modules/playwright/index.mjs'

// Real simulator + real HTTPS API. Never mocks wx.login or injects a patient session.
const privateRoot='D:/secrets/AndrewDental/CloudIntegration',origin='https://andrewdental.cn'
const fixture=JSON.parse(fs.readFileSync(privateRoot+'/fixture.json','utf8'))
assert.equal(fixture.purpose,'owner-approved-cloud-synthetic-integration-only-20261124')
const accounts=JSON.parse(fs.readFileSync(privateRoot+'/accounts.json','utf8'))
const ca=undefined,checks=[]
async function request(method,path,body,actor){
 const result=await new Promise((resolve,reject)=>{const req=https.request(origin+'/api/v1'+path,{method,ca,headers:{'Content-Type':'application/json',...(actor?{Origin:origin,Cookie:actor.cookie,'X-CSRF-Token':actor.csrf,'Idempotency-Key':crypto.randomUUID()}: {})}},res=>{let data='';res.on('data',b=>data+=b);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,data:data?JSON.parse(data):null}))});req.setTimeout(20000,()=>req.destroy(Error('API timeout; inspect receipts before retry')));req.on('error',reject);req.end(body===undefined?undefined:JSON.stringify(body))})
 assert.ok(result.status>=200&&result.status<300,`${method} ${path}: ${result.status} ${result.data?.code}`)
 checks.push({method,path,status:result.status});return result
}
async function login(account){const c=await request('GET','/auth/csrf');const r=await request('POST','/auth/staff-sessions',account,{cookie:c.headers['set-cookie'].map(c=>c.split(';')[0]).join('; '),csrf:c.data.csrf_token});return {cookie:r.headers['set-cookie'].find(c=>c.startsWith('adc_session=')).split(';')[0],csrf:r.data.csrf_token}}
const admin=await login(accounts.admin),reception=await login(accounts.frontdesk)
const suffix=Date.now().toString(),day=new Date(Date.now()+86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'})
const treatment=(await request('POST','/treatments',{treatment_code:'CLOUD-'+suffix,treatment_name:'云端双端联调检查 '+suffix,default_unit_price:'150.00',is_active:true},admin)).data
await request('PUT',`/treatments/${treatment.treatment_id}/qualification-requirements`,{requirements:[{qualification_id:fixture.items.qualification.qualification_id,is_mandatory:true}]},admin)
// New non-overlapping synthetic shift, selected from a free date through the normal API.
const schedules=(await request('GET','/schedules?clinic_id=1&limit=100',undefined,reception)).data.items
let date=day
while(schedules.some(s=>s.schedule_date===date&&s.dentist_id===fixture.items.dentist.dentist_id)){date=new Date(Date.parse(date+'T12:00:00Z')+86400000).toISOString().slice(0,10)}
const schedule=(await request('POST','/schedules',{dentist_id:fixture.items.dentist.dentist_id,clinic_id:'1',schedule_date:date,start_time:'09:00:00',end_time:'10:00:00',slot_minutes:20,note:'云端虚构双端联调'},reception)).data
const report={date:new Date().toISOString(),origin,real_mysql:true,api_mocked:false,checks,fixture:{treatment_id:treatment.treatment_id,schedule_id:schedule.schedule_id,date},patient_flow:'NOT_RUN'}
const save=()=>fs.writeFileSync('docs/verification/cloud-integration-20261124/patient-admin.json',JSON.stringify(report,null,2)+'\n')
save()
if(process.argv.includes('--resources-only')){console.log(JSON.stringify(report));process.exit(0)}
const ws=new WebSocket('ws://127.0.0.1:9420'),pending=new Map()
await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('微信工具调试端口未就绪；资源联调证据已保存')),8000);ws.onopen=()=>{clearTimeout(t);resolve()};ws.onerror=()=>{clearTimeout(t);reject(Error('微信工具调试端口未就绪；资源联调证据已保存'))}})
ws.onmessage=event=>{const m=JSON.parse(event.data),p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(p.method+": "+m.error.message)):p.resolve(m.result)}}
function rpc(method,params={}){return new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>reject(Error('Simulator timeout: '+method)),30000);pending.set(id,{resolve,reject,timer,method});ws.send(JSON.stringify({id,method,params}))})}
let page
async function navigate(path){const url='/pages/'+path+'/index';await rpc('App.callFunction',{functionDeclaration:'function(url){setTimeout(function(){var tabs=["/pages/index/index","/pages/appointment-booking/index","/pages/appointment-cancellation/index","/pages/personal/index"];if(tabs.indexOf(url)>-1){wx.switchTab({url:url})}else{wx.reLaunch({url:url})}},100);return true}',args:[url]});for(let i=0;i<50;i++){await new Promise(r=>setTimeout(r,300));page=await rpc('App.getCurrentPage');if(page.path===url.slice(1)){await idle();return data()}}throw Error('Navigation did not reach '+url+'; actual '+page.path)}
async function data(){return (await rpc('Page.getData',{pageId:page.pageId})).data}
async function idle(){for(let i=0;i<40;i++){if(!(await data()).busy)return;await new Promise(r=>setTimeout(r,500))}throw Error('Page remains busy')}
async function call(method,...args){report.stage=page.path+":"+method;save();await rpc('App.callFunction',{functionDeclaration:'function(method,args){var pages=getCurrentPages();pages[pages.length-1][method].apply(pages[pages.length-1],args);return true}',args:[method,args]});await new Promise(r=>setTimeout(r,100));await idle();const state=await data();assert.equal(state.error,'',state.error);return state}
let browser
try{
 page=await rpc('App.getCurrentPage');if(page.path!=='pages/authentication/index')await navigate('authentication');await idle()
 if(!(await data()).authenticated)await call('login')
 assert.equal((await data()).authenticated,true);report.real_wechat_login=true;save()
 let profile=await navigate('patients')
 if(!profile.patient){
  await navigate('patient-bindings');await call('inputNumber',{detail:{value:fixture.items.patient.patient_number}});await call('inputBirth',{detail:{value:fixture.items.patient.date_of_birth}});await call('submit')
  const rows=(await request('GET','/binding-requests?limit=100',undefined,reception)).data.items
  const row=rows.find(r=>r.status==='PENDING'&&r.patient_number===fixture.items.patient.patient_number);assert.ok(row)
  await request('POST',`/binding-requests/${row.request_id}/approve`,{patient_id:fixture.items.patient.patient_id,verification_basis:{clinic_id:'1',patient_number_checked:true,date_of_birth_checked:true,person_confirmed:true,service_basis:'CLOUD_SYNTHETIC_TEST_ONLY_NOT_REAL_PERSON'},reason:'云端虚构测试档案联调核验'},reception)
  profile=await navigate('patients')
 }
 assert.ok(profile.patient);const patient=profile.patient;assert.equal(patient.patient_id,fixture.items.patient.patient_id,'Only the owned synthetic preview patient may be used')
 await navigate('appointment-booking');await call('date',{detail:{value:date}});await call('treatments',{detail:{value:[treatment.treatment_id]}});let state=await call('search');assert.ok(state.slots.length>0)
 await call('select',{currentTarget:{dataset:{index:0}}});await call('confirm',{detail:{value:['confirmed']}});state=await call('submit');const id=state.notice.match(/\d+/)?.[0];assert.ok(id)
 assert.equal((await request('GET',`/appointments/${id}`,undefined,reception)).data.status,'SCHEDULED')
 await navigate('appointment-cancellation');state=await data();assert.ok(state.appointments.some(a=>a.appointment_id===id))
 await call('select',{currentTarget:{dataset:{id}}});await call('reason',{detail:{value:'云端联调验证患者取消'}});await call('submit')
 assert.equal((await request('GET',`/appointments/${id}`,undefined,reception)).data.status,'CANCELLED')
 report.patient_flow='PASS';report.fixture.appointment_id=id;report.patient_cancel_visible_to_admin=true
 // Browser reads the same appointment through the deployed admin frontend.
 browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext(),web=await context.newPage()
 await web.goto(origin+'/authentication');await web.getByLabel('个人账号').fill(accounts.frontdesk.username);await web.getByLabel('密码',{exact:true}).fill(accounts.frontdesk.password);await web.getByRole('button',{name:'登录管理后台'}).click();await web.waitForURL(origin+'/')
 await web.goto(origin+'/appointment-attendance?appointmentId='+id);await web.getByRole('button',{name:'重新读取预约'}).click();await web.getByText('预约 '+id+' · 已取消',{exact:false}).waitFor();report.admin_browser_same_appointment=true
 await navigate('appointment-booking');await call('date',{detail:{value:date}});await call('treatments',{detail:{value:[treatment.treatment_id]}});await call('search');await call('select',{currentTarget:{dataset:{index:0}}});await call('confirm',{detail:{value:['confirmed']}});state=await call('submit');const attendedId=state.notice.match(/\d+/)?.[0];assert.ok(attendedId)
 await web.goto(origin+'/appointment-attendance?appointmentId='+attendedId);await web.getByRole('button',{name:'重新读取预约'}).click()
 await web.getByLabel('实际服务诊所 ID',{exact:true}).fill('1');await web.getByLabel('原患者编号',{exact:true}).fill(patient.patient_number);await web.getByLabel('出生日期',{exact:true}).fill(patient.date_of_birth);await web.getByLabel('本次服务依据',{exact:true}).fill('CLOUD_SYNTHETIC_TEST_ONLY_NOT_REAL_ATTENDANCE');await web.getByLabel('已人工核实本人',{exact:true}).check();await web.getByRole('button',{name:'核验本人档案',exact:true}).click();await web.getByRole('button',{name:'确认本人到诊',exact:true}).click();await web.getByText('预约 '+attendedId+' · 诊疗中',{exact:false}).waitFor()
 await navigate('appointment-cancellation');state=await data();assert.equal(state.appointments.find(a=>a.appointment_id===attendedId)?.status,'IN_PROGRESS')
 await call('select',{currentTarget:{dataset:{id:attendedId}}});await call('reason',{detail:{value:'联调验证到诊后不可取消'}})
 await rpc('App.callFunction',{functionDeclaration:'function(){var pages=getCurrentPages();pages[pages.length-1].submit();return true}',args:[]});await new Promise(r=>setTimeout(r,100));await idle();assert.match((await data()).error,/状态已变化|APPOINTMENT_STATE_CONFLICT/)
 assert.equal((await request('GET',`/appointments/${attendedId}`,undefined,reception)).data.status,'IN_PROGRESS')
 report.admin_browser_attendance_visible_to_patient=true;report.patient_cancel_after_attendance_rejected=true;report.fixture.attended_appointment_id=attendedId
 await web.screenshot({path:'docs/verification/cloud-integration-20261124/patient-admin.png',fullPage:true});report.stage='COMPLETE';report.status='PASS';save();console.log(JSON.stringify(report))
}catch(error){report.status='FAIL';report.failure=error.message;save();throw error}finally{ws.close();if(browser)await browser.close()}




