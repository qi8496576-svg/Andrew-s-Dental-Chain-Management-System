import fs from 'node:fs'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
const out='docs/verification/patient-ui';fs.mkdirSync(out,{recursive:true})
const ws=new WebSocket('ws://127.0.0.1:9420'),pending=new Map(),checks=[]
await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('WeChat automation unavailable')),8000);ws.onopen=()=>{clearTimeout(timer);resolve()};ws.onerror=()=>{clearTimeout(timer);reject(Error('WeChat automation unavailable'))}})
ws.onmessage=event=>{const m=JSON.parse(event.data),p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(p.method+': '+m.error.message)):p.resolve(m.result)}}
const rpc=(method,params={})=>new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('Timeout '+method))},25000);pending.set(id,{resolve,reject,timer,method});ws.send(JSON.stringify({id,method,params}))})
const delay=ms=>new Promise(r=>setTimeout(r,ms))
async function current(){return (await rpc('App.callFunction',{functionDeclaration:'function(){var pages=getCurrentPages(),page=pages[pages.length-1];return {path:page.route,data:page.data}}',args:[]})).result}
async function idle(){for(let i=0;i<40;i++){const p=await current();if(!p.data.busy)return p;await delay(250)}throw Error('Page remains busy')}
async function nav(name){const url='/pages/'+name+'/index';await rpc('App.callFunction',{functionDeclaration:'function(url){setTimeout(function(){var tabs=["/pages/index/index","/pages/appointment-booking/index","/pages/appointment-cancellation/index","/pages/personal/index"];if(tabs.indexOf(url)>-1)wx.switchTab({url:url});else wx.navigateTo({url:url,fail:function(e){getApp().uiNavigationError=e.errMsg}})},100);return true}',args:[url]});await delay(1200);let p;for(let i=0;i<60;i++){p=await current();if(p.path===url.slice(1))break;await delay(250)}p=await idle();const navError=(await rpc('App.callFunction',{functionDeclaration:'function(){return getApp().uiNavigationError||""}',args:[]})).result;assert.equal(p.path,url.slice(1),navError);return p}
async function call(method,args=[]){await rpc('App.callFunction',{functionDeclaration:'function(method,args){var pages=getCurrentPages();pages[pages.length-1][method].apply(pages[pages.length-1],args);return true}',args:[method,args]});await delay(200);return idle()}
async function shot(name){await rpc('App.callWxMethod',{method:'pageScrollTo',args:[{scrollTop:0,duration:0}]});await delay(300);const result=await rpc('App.captureScreenshot');fs.writeFileSync(out+'/'+name+'.png',Buffer.from(result.data,'base64'))}
try{
 await nav('authentication');let p=await idle();if(p.data.authenticated)await call('logout')
 p=await nav('index');assert.equal(p.data.authenticated,false);assert.equal(p.data.bound,false);assert.equal(p.data.clinics.length,0);await shot('home-guest');checks.push('Guest home contains no invented clinic or patient data')
 p=await nav('personal');assert.equal(p.data.patient,null);assert.equal(p.data.authenticated,false);await shot('mine-guest')
 p=await nav('appointment-booking');assert.equal(p.data.patient,null);checks.push('Guest booking is gated by identity and binding')
 await nav('authentication');p=await call('login');assert.equal(p.data.authenticated,true);assert.equal(p.data.error,'');await shot('login')
 p=await nav('index');assert.equal(p.data.authenticated,true);assert.ok(p.data.clinics.length);await shot('home');checks.push('Actual wx.login and real backend catalog loaded')
 p=await nav('personal');assert.ok(p.data.bound);assert.ok(p.data.patient);await shot('mine')
 p=await nav('patients');assert.ok(p.data.patient);await shot('profile')
 p=await nav('patient-bindings');assert.ok(p.data.binding);await shot('binding')
 p=await nav('appointment-booking');assert.ok(p.data.patient);assert.ok(p.data.treatments.length);await shot('booking');checks.push('Existing patient profile, service catalog and clinic selection retained')
 const proof=JSON.parse(fs.readFileSync('docs/verification/local-patient-admin.json','utf8'))
 await call('date',[{detail:{value:proof.fixture.date}}]);await call('treatments',[{detail:{value:[proof.fixture.treatment_id]}}]);p=await call('search');assert.ok(p.data.slots.length);assert.ok(p.data.doctors.length)
 const doctor=p.data.doctors[0];p=await call('chooseDoctor',[{currentTarget:{dataset:{id:doctor.id}}}]);assert.equal(p.data.doctorId,doctor.id)
 p=await call('select',[{currentTarget:{dataset:{index:0}}}]);assert.equal(p.data.confirmed,false);await shot('booking-slots');checks.push('Real candidate doctors and slots can be selected; confirmation remains explicit')
 p=await call('date',[{detail:{value:proof.fixture.date}}]);assert.equal(p.data.selected,-1);assert.equal(p.data.slots.length,0);assert.equal(p.data.confirmed,false);checks.push('Changing booking criteria invalidates the selected slot')
 p=await nav('appointment-cancellation');assert.ok(p.data.appointments.length);await shot('records')
 for(const filter of ['SCHEDULED','IN_PROGRESS','DONE','CANCELLED','ALL']){p=await call('filter',[{currentTarget:{dataset:{filter}}}]);assert.equal(p.data.filter,filter);assert.equal(p.data.visibleCount,p.data.appointments.filter(a=>filter==='ALL'||a.status===filter||(filter==='DONE'&&['COMPLETED','INVOICED'].includes(a.status))).length)}
 checks.push('All appointment status filters reflect real records')
 // Exercise actual click routing on the new home instead of only calling methods.
 await nav('index');p=await rpc('App.getCurrentPage');const element=await rpc('Page.getElement',{pageId:p.pageId,selector:'.hero-button'});await rpc('Element.tap',{pageId:p.pageId,elementId:element.elementId,nodeId:element.nodeId});await delay(1600);assert.equal((await current()).path,'pages/appointment-booking/index');checks.push('Home primary button navigates to booking tab')
 await nav('index')
 const report={date:new Date().toISOString(),status:'PASS',environment:'real WeChat developer tools / local HTTPS / real MySQL',api_mocked:false,checks,screenshots:fs.readdirSync(out).filter(f=>f.endsWith('.png')),unbound_state:'Covered by isolated UI tests; existing verified binding was preserved',real_device_verified:false}
 fs.writeFileSync(out+'/runtime.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
}finally{ws.close()}


