import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url)
require('../../tmp/mini-http-test/config.js').API_ORIGIN='https://fixture.invalid'
let definition,identity={subject_id:'registration-unit',subject_type:'PATIENT',binding:null},unknown=false,posts=[]
globalThis.Page=value=>definition=value
globalThis.wx={login:({success})=>success({code:'isolated-sdk-fixture'}),getRandomValues:({success})=>success({randomValues:new Uint8Array(16).fill(7).buffer}),request:request=>{
 const path=new URL(request.url).pathname
 const ok=data=>request.success({statusCode:200,data})
 if(path.endsWith('/auth/wechat-sessions'))return ok({access_token:'t'.repeat(43),subject_type:'PATIENT'})
 if(path.endsWith('/me'))return ok(identity)
 if(path.endsWith('/clinics'))return ok({items:[{id:'1',label:'Isolated fixture clinic'}],next_cursor:null})
 if(path.endsWith('/me/binding'))return identity.binding?ok(identity.binding):request.success({statusCode:404,data:{code:'PATIENT_BINDING_REQUIRED'}})
 if(path.endsWith('/me/patient-registration')){posts.push(request);if(unknown)return request.success({statusCode:503,data:{code:'COMMIT_OUTCOME_UNKNOWN'}});identity.binding={patient_id:'2'};return ok({patient_id:'2',patient_number:'P2',registration_method:'SELF_DECLARED',allergy_review_status:'NOT_REVIEWED'})}
 throw Error('Unexpected '+path)
}}
await require('../../tmp/mini-http-test/services/session.js').patientSession().login()
require('../../tmp/mini-http-test/pages/patient-bindings/index.js')
const create=()=>({...definition,data:structuredClone(definition.data),setData(values){for(const [key,value] of Object.entries(values)){const parts=key.split('.');if(parts.length===2)this.data[parts[0]][parts[1]]=value;else this.data[key]=value}}})
function fill(page){page.setData({details:{full_name:'Unit synthetic',date_of_birth:'1990-01-02',phone:'000',billing_address:'',email:'',emergency_contact_name:'',emergency_contact_phone:''},allergyStatement:'UNSURE',allergyNote:'本人不确定',consent:true})}
test('new patient registers without a clinic patient number or staff verification and cannot inject an existing patient ID',async()=>{
 identity={...identity,subject_id:'registration-unit-a',binding:null};posts=[];const page=create();await page.load();assert.equal(page.data.mode,'new');fill(page)
 page.inputDetails({currentTarget:{dataset:{field:'patient_id'}},detail:{value:'existing'}});assert.equal(page.data.details.patient_id,undefined)
 await page.register();assert.equal(posts.length,1);const body=JSON.parse(posts[0].data);assert.equal(body.patient_number,undefined);assert.equal(body.patient_id,undefined);assert.equal(body.verification_basis,undefined);assert.equal(body.allergy_statement,'UNSURE');assert.equal(body.consent,true);for(const field of ['billing_address','email','emergency_contact_name','emergency_contact_phone'])assert.equal(body[field],null);assert.equal(page.data.binding.patient_id,'2');assert.equal(page.data.busy,false)
})
test('unknown self-registration retains one immutable request and prevents changing submitted details',async()=>{
 identity={...identity,subject_id:'registration-unit-b',binding:null};posts=[];unknown=true;const page=create();await page.load();fill(page);await page.register();assert.equal(page.data.unknown,true);assert.equal(page.data.binding,null)
 page.inputDetails({currentTarget:{dataset:{field:'full_name'}},detail:{value:'Changed'}});assert.equal(page.data.details.full_name,'Unit synthetic')
 unknown=false;await page.register();assert.equal(posts.length,2);assert.equal(posts[0].data,posts[1].data);assert.equal(posts[0].header['Idempotency-Key'],posts[1].header['Idempotency-Key']);assert.equal(page.data.binding.patient_id,'2');assert.equal(page.data.unknown,false)
})
