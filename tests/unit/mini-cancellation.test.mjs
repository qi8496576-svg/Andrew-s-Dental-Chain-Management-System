import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url)
require('../../tmp/mini-http-test/config.js').API_ORIGIN='https://fixture.invalid'
let delayed,unknown=false,requests=[]
const identity={subject_id:'native-one',subject_type:'PATIENT',binding:{patient_id:'1'},roles:[],capabilities:[],clinic_scope:[]}
let row={appointment_id:'3',patient_id:'1',clinic_id:'1',dentist_id:'2',schedule_id:'4',scheduled_at:'2026-12-01T01:00:00Z',status:'SCHEDULED'}
globalThis.wx={login:({success})=>success({code:'SDK-boundary-fixture'}),getRandomValues:({success})=>success({randomValues:new Uint8Array(16).fill(9).buffer}),request:request=>{requests.push(request);if(request.url.endsWith('/auth/wechat-sessions'))return request.success({statusCode:200,data:{access_token:'t'.repeat(43),subject_type:'PATIENT'}});if(request.url.endsWith('/me'))return request.success({statusCode:200,data:identity});if(request.url.includes('/appointments?')){if(delayed){delayed(request);return}return request.success({statusCode:200,data:{items:[row],next_cursor:null}})}if(request.url.endsWith('/cancel')){if(unknown)return request.success({statusCode:503,data:{code:'COMMIT_OUTCOME_UNKNOWN'}});row={...row,status:'CANCELLED',cancellation_kind:'PATIENT_CANCEL'};return request.success({statusCode:200,data:row})}throw Error('Unexpected SDK request')}}
const {patientSession}=require('../../tmp/mini-http-test/services/session.js');await patientSession().login()
let definition;globalThis.Page=value=>{definition=value};require('../../tmp/mini-http-test/pages/appointment-cancellation/index.js')
const page=()=>({...definition,data:structuredClone(definition.data),setData(values){Object.assign(this.data,values)}})
test('native cancellation retains the original command after unknown outcome and sends no caller supplied patient identity',async()=>{
  const current=page();await current.load();assert.equal(current.data.appointments[0].appointment_id,'3');current.select({currentTarget:{dataset:{id:'3'}}});current.reason({detail:{value:'本人取消'}});unknown=true;await current.submit();assert.equal(current.data.unknown,true);current.reason({detail:{value:'must-not-change-original-command'}});unknown=false;await current.submit();const submitted=requests.filter(r=>r.url.endsWith('/cancel'));assert.equal(submitted.length,2);assert.equal(submitted[0].data,submitted[1].data);assert.equal(submitted[0].header['Idempotency-Key'],submitted[1].header['Idempotency-Key']);assert.deepEqual(JSON.parse(submitted[1].data),{reason:'本人取消'});assert.equal(current.data.appointments[0].status,'CANCELLED');assert.ok(requests.filter(r=>r.url.includes('/appointments?')).every(r=>!r.url.includes('patient_id')))
})
test('leaving the cancellation page prevents a delayed response from restoring appointment details',async()=>{
  let response;delayed=request=>{response=request};const current=page(),loading=current.load();while(!response)await new Promise(resolve=>setImmediate(resolve));current.onHide();response.success({statusCode:200,data:{items:[row],next_cursor:null}});await loading;assert.deepEqual(current.data.appointments,[]);delayed=undefined
})
test('a binding change during an appointment read discards the previous patient response',async()=>{
  let response;delayed=request=>{response=request};const current=page(),loading=current.load();while(!response)await new Promise(resolve=>setImmediate(resolve));identity.binding={patient_id:'another-patient'};response.success({statusCode:200,data:{items:[row],next_cursor:null}});await loading;assert.deepEqual(current.data.appointments,[]);assert.ok(current.data.error.includes('绑定已变化'));delayed=undefined;identity.binding={patient_id:'1'}
})

