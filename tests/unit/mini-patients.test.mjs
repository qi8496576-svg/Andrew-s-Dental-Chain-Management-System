import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require=createRequire(import.meta.url)
const {createPatientAuthentication}=require('../../tmp/mini-http-test/services/authentication.js')
function sdk(){
  const requests=[]
  const identity={subject_id:'fixture-owner',subject_type:'PATIENT',roles:[],capabilities:[],clinic_scope:[],binding:{subject_id:'fixture-owner',patient_id:'9007199254740993',verified_at:'2026-11-12T00:00:00Z'}}
  const patient={patient_id:'9007199254740993',patient_number:'F-001',full_name:'Fictional Patient',allergy_review_status:'NOT_REVIEWED'}
  globalThis.wx={
    login:({success})=>success({code:'isolated-sdk-fixture'}),
    request:request=>{requests.push(request);if(request.url.endsWith('/auth/wechat-sessions'))request.success({statusCode:200,data:{access_token:'t'.repeat(43),subject_type:'PATIENT'}});else if(request.url.endsWith('/me'))request.success({statusCode:200,data:identity});else if(request.url.endsWith('/allergy-records'))request.success({statusCode:200,data:{items:[],next_cursor:null}});else request.success({statusCode:200,data:patient})},
  }
  return {requests,identity,patient}
}
test('native profile reads only the current server binding and never sends a caller supplied patient ID',async()=>{
  const fixture=sdk(),client=createPatientAuthentication('https://fixture.invalid');await client.login();fixture.requests.length=0
  assert.equal((await client.patientProfile()).patient.patient_id,'9007199254740993')
  assert.deepEqual(fixture.requests.map(request=>request.url.replace('https://fixture.invalid','')),['/api/v1/me','/api/v1/patients/9007199254740993','/api/v1/patients/9007199254740993/allergy-records'])
  assert.ok(fixture.requests.every(request=>request.method==='GET' && request.data===undefined))
  fixture.identity.binding=null;fixture.requests.length=0
  await assert.rejects(client.patientProfile(),error=>error.code==='PATIENT_BINDING_REQUIRED')
  assert.deepEqual(fixture.requests.map(request=>request.url),['https://fixture.invalid/api/v1/me'])
})
test('leaving the native profile prevents an old in-flight response from restoring private data',async()=>{
  const fixture=sdk();require('../../tmp/mini-http-test/config.js').API_ORIGIN='https://fixture.invalid'
  const {patientSession}=require('../../tmp/mini-http-test/services/session.js');await patientSession().login()
  let definition;globalThis.Page=value=>{definition=value}
  require('../../tmp/mini-http-test/pages/patients/index.js')
  const page={...definition,data:structuredClone(definition.data),setData(values){Object.assign(this.data,values)}}
  const immediate=globalThis.wx.request;let reply;let started
  const waiting=new Promise(resolve=>{started=resolve})
  globalThis.wx.request=request=>{if(request.url.endsWith('/patients/9007199254740993')){reply=request;started()}else immediate(request)}
  const loading=page.load();await waiting;page.onHide();reply.success({statusCode:200,data:fixture.patient});await loading
  assert.equal(page.data.patient,null);assert.deepEqual(page.data.allergies,[]);assert.equal(page.data.busy,false)
  delete globalThis.Page
})
