import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url)
require('../../tmp/mini-http-test/config.js').API_ORIGIN='https://fixture.invalid'
let delayed,requests=[],unknown=false
const identity={subject_id:'native-interactions',subject_type:'PATIENT',binding:{patient_id:'1'},roles:[],capabilities:[],clinic_scope:[]}
const candidate=(key,date)=>({clinic_id:'1',schedule_id:key,dentist_id:'21',dentist_name:'虚构医生',starts_at:date+'T01:00:00Z',ends_at:date+'T01:20:00Z'})
globalThis.wx={login:({success})=>success({code:'SDK-fixture'}),pageScrollTo:()=>{},getRandomValues:({success})=>success({randomValues:new Uint8Array(16).fill(9).buffer}),request:request=>{
 requests.push(request);const url=new URL(request.url),path=url.pathname;let data
 if(path.endsWith('/auth/wechat-sessions'))data={access_token:'t'.repeat(43),subject_type:'PATIENT'}
 else if(path.endsWith('/me'))data=identity
 else if(path.endsWith('/patients/1'))data={patient_id:'1',patient_number:'P-TEST',full_name:'虚构患者',date_of_birth:'1990-01-02',phone:'000',billing_address:'虚构地址',emergency_contact_name:'虚构联系人',emergency_contact_phone:'000',allergy_review_status:'NO_KNOWN',allergy_confirmation_reference:'AR1:fixture'}
 else if(path.endsWith('/allergy-records'))data={items:[],next_cursor:null}
 else if(path.endsWith('/clinics'))data={items:[{id:'1',label:'虚构诊所',active:true}],next_cursor:null}
 else if(path.endsWith('/treatments'))data={items:[{id:'51',label:'检查',active:true}],next_cursor:null}
 else if(path.endsWith('/appointment-candidates')){if(delayed){const defer=delayed;delayed=undefined;defer(request);return}const date=url.searchParams.get('start').slice(0,10);data={items:[candidate(date,date)],next_cursor:null}}
 else if(path.endsWith('/appointments')&&request.method==='POST'){if(unknown)return request.success({statusCode:503,data:{code:'COMMIT_OUTCOME_UNKNOWN'}});data={appointment_id:'3',status:'SCHEDULED'}}
 else throw Error('Unexpected SDK request '+path)
 request.success({statusCode:200,data})
}}
const {patientSession}=require('../../tmp/mini-http-test/services/session.js');await patientSession().login()
let definition;globalThis.Page=value=>{definition=value};require('../../tmp/mini-http-test/pages/appointment-booking/index.js')
const page=()=>({...definition,data:structuredClone(definition.data),setData(values,callback){Object.assign(this.data,values);callback?.()}})
async function ready(){identity.binding={patient_id:'1'};const current=page();await current.load();current.date({detail:{value:'2026-11-26'}});current.treatments({detail:{value:['51']}});return current}
test('patient booking keeps daily slot selection and requires confirmation after each choice',async()=>{
 const current=await ready();requests=[];await current.find();const query=new URL(requests.find(r=>r.url.includes('/appointment-candidates?')).url)
 assert.equal(query.searchParams.get('start'),'2026-11-26T00:00:00+08:00');assert.equal(query.searchParams.get('end'),'2026-11-27T00:00:00+08:00');assert.equal(current.data.calendar,undefined)
 assert.equal(current.data.resultDate,'2026-11-26');assert.equal(current.data.resultClinic,'虚构诊所');assert.match(current.data.slots[0].time,/09:00–09:20 北京时间/)
 current.select({currentTarget:{dataset:{index:0}}});assert.equal(current.data.selected,0);assert.equal(current.data.confirmed,false);current.confirm({detail:{value:['confirmed']}});current.chooseDoctor({currentTarget:{dataset:{id:'21'}}});assert.equal(current.data.confirmed,false);assert.equal(current.data.selected,-1)
})
test('old daily candidates disappear immediately and cannot overwrite a later date',async()=>{
 const current=await ready();let response;delayed=r=>{response=r};const old=current.find();while(!response)await new Promise(r=>setImmediate(r))
 current.date({detail:{value:'2026-11-27'}});assert.equal(current.data.slots.length,0);assert.equal(current.data.resultDate,'');await current.find();response.success({statusCode:200,data:{items:[candidate('stale','2026-11-26')],next_cursor:null}});await old
 assert.equal(current.data.resultDate,'2026-11-27');assert.equal(current.data.slots[0].schedule_id,'2026-11-27')
})
test('binding changes and leaving the page discard protected results',async()=>{
 const current=await ready();let response;delayed=r=>{response=r};const pending=current.find();while(!response)await new Promise(r=>setImmediate(r));identity.binding={patient_id:'other'};response.success({statusCode:200,data:{items:[candidate('stale','2026-11-26')],next_cursor:null}});await pending
 assert.equal(current.data.patient,null);assert.equal(current.data.slots.length,0);assert.match(current.data.error,/绑定已变化/)
 identity.binding={patient_id:'1'};await current.load();await current.find();current.onHide();assert.equal(current.data.patient,null);assert.equal(current.data.slots.length,0)
})
test('unknown booking result retains the original command and locks criteria until confirmation',async()=>{
 const current=await ready();await current.find();current.select({currentTarget:{dataset:{index:0}}});current.confirm({detail:{value:['confirmed']}});unknown=true;await current.submit();assert.equal(current.data.unknown,true);assert.match(current.data.error,/结果确认中/)
 current.date({detail:{value:'2026-12-01'}});assert.equal(current.data.date,'2026-11-26');unknown=false;await current.submit();const writes=requests.filter(r=>new URL(r.url).pathname.endsWith('/appointments')&&r.method==='POST');assert.equal(writes.length,2);assert.equal(writes[0].data,writes[1].data);assert.equal(writes[0].header['Idempotency-Key'],writes[1].header['Idempotency-Key']);assert.equal(current.data.unknown,false)
})
test('appointment state wording agrees with the website',()=>{
 const {appointmentStatusLabel}=require('../../tmp/mini-http-test/services/business-messages.js');assert.equal(appointmentStatusLabel('INVOICED'),'已生成费用凭据');assert.equal(appointmentStatusLabel('COMPLETED'),'已完成治疗')
})
