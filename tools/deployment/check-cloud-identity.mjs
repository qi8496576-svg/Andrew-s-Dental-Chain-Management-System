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
 // A real second session from the same actual wx.login provider. No fabricated subject or token.
 await rpc('App.callFunction',{functionDeclaration:'function(origin){getApp().__cloudSessionProbe=null;wx.login({success:function(login){wx.request({url:origin+"/api/v1/auth/wechat-sessions",method:"POST",data:{code:login.code},success:function(r){getApp().__cloudSessionProbe={status:r.statusCode,data:r.data}},fail:function(){getApp().__cloudSessionProbe={error:"network"}}})},fail:function(){getApp().__cloudSessionProbe={error:"wx.login"}}});return true}',args:[origin]})
 let probe
 for(let i=0;i<50;i++){await new Promise(r=>setTimeout(r,250));probe=(await rpc('App.callFunction',{functionDeclaration:'function(){return getApp().__cloudSessionProbe}',args:[]})).result;if(probe)break}
 assert.equal(probe?.status,200,'Real WeChat provider session must succeed')
 token=probe.data.access_token;assert.match(token,/^[A-Za-z0-9_-]{43}$/)
 await rpc('App.callFunction',{functionDeclaration:'function(){delete getApp().__cloudSessionProbe;return true}',args:[]})
 const patientActor={token},patient=fixture.items.patient,reception=await login(accounts.frontdesk)
 const basis={clinic_id:'1',patient_number_checked:true,date_of_birth_checked:true,person_confirmed:true,service_basis:'OWNER_APPROVED_CLOUD_SYNTHETIC_IDENTITY_EDGE_TEST'}
 let me=await request('GET','/me',undefined,patientActor);assert.equal(me.status,200)
 // A previous assertion can stop after a successful 204 revoke. Recover only through normal approval.
 if(!me.data.binding){const submitted=await request('POST','/me/binding-requests',{patient_number:patient.patient_number,date_of_birth:patient.date_of_birth,clinic_id:'1'},patientActor);assert.equal(submitted.status,200);assert.equal((await request('POST','/binding-requests/'+submitted.data.request_id+'/approve',{patient_id:patient.patient_id,verification_basis:basis,reason:'恢复上轮已成功解绑的虚构测试资料'},reception)).status,200);me=await request('GET','/me',undefined,patientActor)}
 assert.equal(me.data.binding.patient_id,patient.patient_id)
 assert.equal((await request('GET','/patients/'+patient.patient_id,undefined,patientActor)).status,200)
 report.checks.push('Real wx.login and code2Session produce a genuine cloud patient session')
 assert.equal((await request('GET','/identity/staff-accounts',undefined,patientActor)).status,403)
 const revoked=await request('POST','/patient-bindings/'+me.data.subject_id+'/revoke',{verification_basis:basis,reason:'云端虚构资料测试：核验解绑后旧会话拒绝'},reception);assert.equal(revoked.status,204)
 const after=await request('GET','/me',undefined,patientActor);assert.equal(after.status,200);assert.ok(!after.data.binding)
 assert.equal((await request('GET','/patients/'+patient.patient_id,undefined,patientActor)).status,403)
 report.checks.push('Revoked binding blocks the next direct patient request using the still-authenticated old session')
 const requested=await request('POST','/me/binding-requests',{patient_number:patient.patient_number,date_of_birth:patient.date_of_birth,clinic_id:'1'},patientActor);assert.equal(requested.status,200)
 const approved=await request('POST','/binding-requests/'+requested.data.request_id+'/approve',{patient_id:patient.patient_id,verification_basis:basis,reason:'云端虚构资料测试完成：前台核实恢复本人绑定'},reception);assert.equal(approved.status,200)
 assert.equal((await request('GET','/patients/'+patient.patient_id,undefined,patientActor)).status,200)
 report.checks.push('Identity remains distinct from binding; a new request and authorized approval restore the same synthetic profile')
 assert.equal((await request('DELETE','/auth/session',{},patientActor)).status,204)
 assert.equal((await request('GET','/me',undefined,patientActor)).status,401)
 token=undefined;report.checks.push('Logout invalidates the actual server session; old bearer receives 401')
 const csrf=await request('GET','/auth/csrf')
 assert.equal((await request('POST','/auth/staff-sessions',{username:'not-a-real-staff',password:'not-a-real-password'},{cookie:csrf.headers['set-cookie'].map(v=>v.split(';')[0]).join('; '),csrf:'invalid'})).status,403)
 assert.equal((await request('POST','/auth/wechat-sessions',{})).status,400)
 report.checks.push('Missing WeChat code and invalid staff CSRF are refused')
 report.status='PASS'
}catch(error){report.status='FAIL';report.failure=error.message;process.exitCode=1}finally{if(token)await request('DELETE','/auth/session',{}, {token}).catch(()=>{});ws.close();fs.writeFileSync('docs/verification/cloud-integration-20261124/identity-edges.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))}
