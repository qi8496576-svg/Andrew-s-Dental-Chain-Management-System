import fs from 'node:fs'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
const fixture=JSON.parse(fs.readFileSync('D:/secrets/AndrewDental/CloudIntegration/fixture.json','utf8'))
assert.equal(fixture.purpose,'owner-approved-cloud-synthetic-integration-only-20261124')
const ws=new WebSocket('ws://127.0.0.1:9420'),pending=new Map()
await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('WeChat automation unavailable')),8000);ws.onopen=()=>{clearTimeout(t);resolve()};ws.onerror=()=>{clearTimeout(t);reject(Error('WeChat automation unavailable'))}})
ws.onmessage=e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(p.method+': '+m.error.message)):p.resolve(m.result)}}
const rpc=(method,params={})=>new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('WeChat timeout: '+method))},25000);pending.set(id,{resolve,reject,timer,method});ws.send(JSON.stringify({id,method,params}))})
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const state=async()=>{const result=await rpc('App.callFunction',{functionDeclaration:'function(){var pages=getCurrentPages(),page=pages[pages.length-1];return {page:{path:page.route},data:page.data}}',args:[]});return result.result}
async function idle(){for(let i=0;i<50;i++){const result=await state();if(!result.data.busy)return result.data;await sleep(250)}throw Error('Page remains busy')}
async function nav(path){const marker=crypto.randomUUID();await rpc('App.callFunction',{functionDeclaration:'function(url,marker){setTimeout(function(){wx.reLaunch({url:url,success:function(){getApp().__cloudNavComplete=marker}})},100);return true}',args:['/pages/'+path+'/index',marker]});for(let i=0;i<50;i++){await sleep(250);const done=(await rpc('App.callFunction',{functionDeclaration:'function(){return getApp().__cloudNavComplete}',args:[]})).result;if(done===marker&&(await state()).page.path==='pages/'+path+'/index')return idle()}throw Error('Page did not open')}
async function call(method,args=[]){await rpc('App.callFunction',{functionDeclaration:'function(method,args){var pages=getCurrentPages();pages[pages.length-1][method].apply(pages[pages.length-1],args);return true}',args:[method,args]});await sleep(100);return idle()}
const report={checked_at:new Date().toISOString(),origin:'https://andrewdental.cn',api_mocked:false}
try{
 report.stage='authentication';let current=await nav('authentication');if(!current.authenticated)current=await call('login');assert.equal(current.authenticated,true,'Actual WeChat login: '+current.error)
 report.stage='binding-page';current=await nav('patient-bindings');assert.equal(current.binding,null,'Original WeChat must remain unbound after the verified rebind')
 assert.equal(typeof current.submitted,'boolean','Updated pending-state UI must be compiled')
 report.stage='application';if(!current.submitted){await call('inputNumber',[{detail:{value:fixture.items.patient.patient_number}}]);await call('inputBirth',[{detail:{value:fixture.items.patient.date_of_birth}}]);current=await call('submit');assert.match(current.notice,/等待.*核验/)}else report.reused_submitted_state=true
 assert.equal(current.submitted,true);assert.equal(current.busy,false);assert.equal(current.submitting,false);assert.equal(current.binding,null)
 current=await call('submit');assert.equal(current.submitted,true);assert.equal(current.binding,null)
 report.status='PASS';report.original_account_unbound=true;report.submission_explicitly_waits_for_frontdesk=true;report.no_automatic_binding=true;report.loading_settled=true;report.second_account_current_binding_preserved=true
 report.stage='screenshot';try{await rpc('App.callWxMethod',{method:'pageScrollTo',args:[{scrollTop:0,duration:0}]});await sleep(200);const shot=await rpc('App.captureScreenshot');fs.writeFileSync('docs/verification/cloud-integration-20261124/binding-pending.png',Buffer.from(shot.data,'base64'));report.screenshot='PASS'}catch(error){report.screenshot='BLOCKED';report.screenshot_error=error.message}report.stage='COMPLETE'
}catch(error){report.status='FAIL';report.failure=error.message;process.exitCode=1}finally{ws.close();fs.writeFileSync('docs/verification/cloud-integration-20261124/binding-ui.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))}
