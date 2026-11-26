import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url)
require('../../tmp/mini-http-test/config.js').API_ORIGIN='https://fixture.invalid'
const identity={subject_id:'ui-fixture',subject_type:'PATIENT',binding:null}
let paths=[],deferred,profileUnavailable=false
globalThis.wx={login:({success})=>success({code:'isolated-sdk-fixture'}),request:r=>{
 paths.push(r.url)
 if(r.url.endsWith('/auth/wechat-sessions'))return r.success({statusCode:200,data:{access_token:'t'.repeat(43),subject_type:'PATIENT'}})
 if(r.url.endsWith('/me'))return r.success({statusCode:200,data:identity})
 if(r.url.endsWith('/allergy-records'))return r.success({statusCode:200,data:{items:[],next_cursor:null}})
 if(r.url.endsWith('/patients/1')){if(profileUnavailable)return r.success({statusCode:503,data:{code:'UNAVAILABLE'}});if(deferred){deferred(r);return}return r.success({statusCode:200,data:{patient_id:'1',full_name:'Synthetic',allergy_review_status:'NO_KNOWN'}})}
 throw Error('Unexpected request '+r.url)
}}
const {patientSession}=require('../../tmp/mini-http-test/services/session.js');await patientSession().login()
let definition
globalThis.Page=value=>{definition=value}
require('../../tmp/mini-http-test/pages/personal/index.js')
const createPage=()=>({...definition,data:structuredClone(definition.data),setData(value){Object.assign(this.data,value)}})
test('personal center distinguishes logged-in unbound identity and never requests a patient profile',async()=>{
 const page=createPage();paths=[];await page.load()
 assert.equal(page.data.authenticated,true);assert.equal(page.data.bound,false);assert.equal(page.data.patient,null)
 assert.deepEqual(paths,['https://fixture.invalid/api/v1/me'])
})
test('leaving the personal center discards a late protected patient profile',async()=>{
 identity.binding={patient_id:'1'};let response;deferred=r=>{response=r};const page=createPage(),load=page.load()
 while(!response)await new Promise(r=>setImmediate(r))
 page.onHide();response.success({statusCode:200,data:{patient_id:'1',full_name:'Synthetic'}});await load
 assert.equal(page.data.patient,null);assert.equal(page.data.authenticated,false);assert.equal(page.data.bound,false);deferred=undefined
})
test('primary navigation uses switchTab while private detail routes use navigateTo',()=>{
 const {routes}=require('../../tmp/mini-http-test/services/presentation.js'),called=[]
 globalThis.wx.switchTab=({url})=>called.push(['tab',url]);globalThis.wx.navigateTo=({url})=>called.push(['detail',url])
 routes.home();routes.booking();routes.records();routes.mine();routes.login();routes.binding();routes.profile()
 assert.equal(called.filter(([kind])=>kind==='tab').length,4)
 assert.equal(called.filter(([kind])=>kind==='detail').length,3)
 assert.equal(new Set(called.map(([,url])=>url)).size,7)
})
test('a profile service failure does not falsely label a verified binding as unbound',async()=>{
 profileUnavailable=true;const page=createPage();await page.load()
 assert.equal(page.data.authenticated,true);assert.equal(page.data.bound,true);assert.equal(page.data.patient,null);assert.ok(page.data.error)
 profileUnavailable=false
})
test('changing doctor, date or treatment invalidates a previous candidate and confirmation',()=>{
 globalThis.Page=value=>{definition=value};require('../../tmp/mini-http-test/pages/appointment-booking/index.js')
 const page=createPage();page.setData({slots:[{dentist_id:'1'}],selected:0,confirmed:true})
 page.chooseDoctor({currentTarget:{dataset:{id:'2'}}});assert.equal(page.data.selected,-1);assert.equal(page.data.confirmed,false)
 page.setData({slots:[{}],selected:0,confirmed:true});page.date({detail:{value:'2026-12-01'}});assert.equal(page.data.slots.length,0);assert.equal(page.data.selected,-1);assert.equal(page.data.confirmed,false)
 page.setData({slots:[{}],selected:0,confirmed:true});page.treatments({detail:{value:['3']}});assert.equal(page.data.slots.length,0);assert.equal(page.data.selected,-1);assert.equal(page.data.confirmed,false)
})
