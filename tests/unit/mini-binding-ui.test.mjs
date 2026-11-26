import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url)
require('../../tmp/mini-http-test/config.js').API_ORIGIN='https://fixture.invalid'
const identity={subject_id:'binding-ui-a',subject_type:'PATIENT',binding:null}
let writes=0,uncertain=false
globalThis.wx={login:({success})=>success({code:'SDK-unit-only'}),getRandomValues:({success})=>success({randomValues:new Uint8Array(16).fill(4).buffer}),request:r=>{
 const path=new URL(r.url).pathname
 if(path.endsWith('/auth/wechat-sessions'))return r.success({statusCode:200,data:{access_token:'t'.repeat(43),subject_type:'PATIENT'}})
 if(path.endsWith('/me'))return r.success({statusCode:200,data:identity})
 if(path.endsWith('/clinics'))return r.success({statusCode:200,data:{items:[{id:'1',label:'虚构测试诊所',active:true}],next_cursor:null}})
 if(path.endsWith('/me/binding'))return identity.binding?r.success({statusCode:200,data:identity.binding}):r.success({statusCode:404,data:{code:'PATIENT_BINDING_REQUIRED'}})
 if(path.endsWith('/me/binding-requests')){writes++;return uncertain?r.success({statusCode:503,data:{code:'COMMIT_OUTCOME_UNKNOWN'}}):r.success({statusCode:200,data:{request_id:'test-request',status:'PENDING'}})}
 if(path.includes('/requests/'))return r.success({statusCode:200,data:{status:'SUCCEEDED'}})
 throw Error('Unexpected request '+path)
}}
const {patientSession}=require('../../tmp/mini-http-test/services/session.js');await patientSession().login()
function page(){let definition;globalThis.Page=value=>{definition=value};const file=require.resolve('../../tmp/mini-http-test/pages/patient-bindings/index.js');delete require.cache[file];require(file);return {...definition,data:structuredClone(definition.data),setData(values){Object.assign(this.data,values)}}}
async function fill(current){await current.load();current.inputNumber({detail:{value:'P-TEST'}});current.inputBirth({detail:{value:'1990-01-02'}})}
test('submitted application remains pending verification and repeated clicks do not create more requests',async()=>{
 writes=0;identity.binding=null;const current=page();await fill(current);await current.submit();assert.equal(writes,1);assert.equal(current.data.submitted,true);assert.equal(current.data.binding,null);assert.equal(current.data.busy,false);assert.equal(current.data.submitting,false);assert.match(current.data.notice,/等待.*核验/)
 await current.submit();current.onHide();await current.load();await current.submit();assert.equal(writes,1);assert.equal(current.data.submitted,true)
 identity.binding={patient_id:'1'};await current.load();assert.equal(current.data.submitted,false);assert.equal(current.data.binding.patient_id,'1')
})
test('receipt success confirms application submission without falsely binding or resubmitting it',async()=>{
 writes=0;identity.binding=null;uncertain=true;const current=page();await fill(current);await current.submit();assert.equal(current.data.unknown,true);assert.equal(current.data.submitted,false)
 await current.query();assert.equal(current.data.unknown,false);assert.equal(current.data.submitted,true);assert.equal(current.data.binding,null);assert.equal(current.data.error,'');await current.submit();assert.equal(writes,1);uncertain=false
})
test('another logged-in identity does not inherit the previous identity pending message',async()=>{
 identity.subject_id='binding-ui-a';identity.binding=null;const current=page();await fill(current);await current.submit();assert.equal(current.data.submitted,true)
 identity.subject_id='binding-ui-b';await current.load();assert.equal(current.data.submitted,false);assert.equal(current.data.notice,'');assert.equal(current.data.binding,null)
})
