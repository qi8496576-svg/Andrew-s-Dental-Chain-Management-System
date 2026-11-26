import fs from 'node:fs'
import https from 'node:https'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
const origin='https://andrewdental.cn',privateRoot='D:/secrets/AndrewDental/CloudIntegration'
const accounts=JSON.parse(fs.readFileSync(privateRoot+'/accounts.json','utf8')),fixture=JSON.parse(fs.readFileSync(privateRoot+'/fixture.json','utf8'))
assert.equal(fixture.purpose,'owner-approved-cloud-synthetic-integration-only-20261124')
const report={checked_at:new Date().toISOString(),origin,api_mocked:false,strict_https:true,checks:[],second_wechat_account_rebind:'NOT_RUN',real_device:'NOT_RUN'}
function request(method,path,body,actor){return new Promise((resolve,reject)=>{const req=https.request(origin+'/api/v1'+path,{method,headers:{'Content-Type':'application/json',...(actor?.cookie?{Origin:origin,Cookie:actor.cookie,'X-CSRF-Token':actor.csrf}:{}),...(actor?.token?{Authorization:'Bearer '+actor.token}:{}),...(['POST','PUT','DELETE'].includes(method)?{'Idempotency-Key':crypto.randomUUID()}:{})}},res=>{let bytes='';res.on('data',b=>bytes+=b);res.on('end',()=>resolve({status:res.statusCode,data:bytes?JSON.parse(bytes):null,headers:res.headers}))});req.on('error',reject);req.setTimeout(20000,()=>req.destroy(Error('API timeout')));req.end(body===undefined?undefined:JSON.stringify(body))})}
async function login(account){const c=await request('GET','/auth/csrf');const r=await request('POST','/auth/staff-sessions',account,{cookie:c.headers['set-cookie'].map(v=>v.split(';')[0]).join('; '),csrf:c.data.csrf_token});assert.equal(r.status,200);return {cookie:r.headers['set-cookie'].find(v=>v.startsWith('adc_session=')).split(';')[0],csrf:r.data.csrf_token}}
const ws=new WebSocket('ws://127.0.0.1:9420'),pending=new Map()
await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('WeChat automation unavailable')),8000);ws.onopen=()=>{clearTimeout(t);resolve()};ws.onerror=()=>{clearTimeout(t);reject(Error('WeChat automation unavailable'))}})
ws.onmessage=event=>{const m=JSON.parse(event.data),p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(p.method+': '+m.error.message)):p.resolve(m.result)}}
const rpc=(method,params={})=>new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('WeChat timed out'))},25000);pending.set(id,{resolve,reject,timer,method});ws.send(JSON.stringify({id,method,params}))})
let token
try{
 await rpc('App.callFunction',{functionDeclaration:'function(origin){getApp().__cloudRebindProbe=null;wx.login({success:function(login){wx.request({url:origin+"/api/v1/auth/wechat-sessions",method:"POST",data:{code:login.code},success:function(r){getApp().__cloudRebindProbe={status:r.statusCode,data:r.data}},fail:function(){getApp().__cloudRebindProbe={error:"network"}}})},fail:function(){getApp().__cloudRebindProbe={error:"wx.login"}}});return true}',args:[origin]})
 let probe
 for(let i=0;i<50;i++){await new Promise(r=>setTimeout(r,250));probe=(await rpc('App.callFunction',{functionDeclaration:'function(){return getApp().__cloudRebindProbe}',args:[]})).result;if(probe)break}
 assert.equal(probe?.status,200);token=probe.data.access_token;assert.match(token,/^[A-Za-z0-9_-]{43}$/)
 await rpc('App.callFunction',{functionDeclaration:'function(){delete getApp().__cloudRebindProbe;return true}',args:[]})
 const actor={token},patient=fixture.items.patient,reception=await login(accounts.frontdesk)
 const me=await request('GET','/me',undefined,actor);assert.equal(me.status,200);assert.equal(me.data.binding?.patient_id,patient.patient_id)
 assert.equal((await request('GET','/patients/'+patient.patient_id,undefined,actor)).status,200)
 report.checks.push('Original real WeChat session could access the synthetic profile before rebind')
 console.log('Original real session retained in memory; waiting for the second real account binding request')
 let target
 for(let i=0;i<120;i++){
  const rows=await request('GET','/binding-requests?limit=100',undefined,reception);assert.equal(rows.status,200)
  const matches=rows.data.items.filter(row=>row.status==='PENDING'&&row.patient_number===patient.patient_number&&row.subject_id!==me.data.subject_id)
  const subjects=new Set(matches.map(row=>row.subject_id))
  assert.ok(subjects.size<=1,'Requests from multiple different new accounts require operator identification')
  if(matches.length){target=matches[0];report.same_account_pending_requests=matches.length;break}
  await new Promise(r=>setTimeout(r,5000))
 }
 assert.ok(target,'Second real WeChat request was not received within 10 minutes')
 const changed=await request('POST','/patient-bindings/'+me.data.subject_id+'/rebind',{new_subject_id:target.subject_id,binding_request_id:target.request_id,verification_basis:{clinic_id:'1',patient_number_checked:true,date_of_birth_checked:true,person_confirmed:true,service_basis:'OWNER_APPROVED_TWO_REAL_WECHAT_ACCOUNTS_SYNTHETIC_REBIND_TEST_20261124'},reason:'负责人配合两个真实微信账号的虚构档案换号验收'},reception)
 assert.equal(changed.status,200)
 const old=await request('GET','/me',undefined,actor);assert.equal(old.status,200);assert.ok(!old.data.binding)
 assert.equal((await request('GET','/patients/'+patient.patient_id,undefined,actor)).status,403)
 assert.equal((await request('GET','/appointments?limit=100',undefined,actor)).status,403)
 report.second_wechat_account_rebind='PASS'
 report.real_device='OWNER_CONFIRMED_BASIC_ACCESS_BEFORE_REBIND'
 report.new_account_device_readback='PENDING_OWNER_CONFIRMATION'
 report.current_fixture_binding='second real WeChat account; old account remains logged in but unbound'
 report.binding_request_id=target.request_id
 report.checks.push('Different genuinely authenticated WeChat subject submitted the same synthetic patient request')
 report.checks.push('Authorized rebind approved the new request and atomically removed the old mapping')
 report.checks.push('The original still-authenticated session now receives 403 for both profile and appointments')
 report.status='PASS'
}catch(error){report.status='FAIL';report.failure=error.message;process.exitCode=1}finally{if(token)await request('DELETE','/auth/session',{}, {token}).catch(()=>{});ws.close();fs.writeFileSync('docs/verification/cloud-integration-20261124/rebind.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))}
