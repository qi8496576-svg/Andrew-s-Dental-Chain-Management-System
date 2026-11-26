import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url)
const {createPatientAuthentication}=require('../../tmp/mini-http-test/services/authentication.js')
const {prepareCommand,UnknownOutcomeError}=require('../../tmp/mini-http-test/services/http.js')
test('native binding request carries only hints, keeps original unknown command and uses bearer without identity spoof headers',async()=>{
  const requests=[];let fail=true
  globalThis.wx={login:({success})=>success({code:'SDK-boundary-only'}),getRandomValues:({success})=>success({randomValues:new Uint8Array(16).fill(7).buffer}),request:request=>{requests.push(request);if(request.url.endsWith('/auth/wechat-sessions'))return request.success({statusCode:200,data:{access_token:'t'.repeat(43),subject_type:'PATIENT'}});if(request.url.endsWith('/me'))return request.success({statusCode:200,data:{subject_type:'PATIENT',binding:null}});if(fail)return request.fail({});request.success({statusCode:200,data:{request_id:'fixture-request',status:'PENDING'}})}}
  const client=createPatientAuthentication('https://fixture.invalid');await client.login()
  const body={patient_number:'Original-P001',date_of_birth:'1990-01-02',clinic_id:'9007199254740993'}
  const command=await prepareCommand('requestPatientBinding','POST','/api/v1/me/binding-requests',body)
  body.patient_number='edited-after-preparation'
  await assert.rejects(client.bindingRequest(command),error=>error instanceof UnknownOutcomeError && error.command===command)
  fail=false;assert.equal((await client.bindingRequest(command)).status,'PENDING')
  const sent=requests.slice(-2);assert.equal(sent[0].data,sent[1].data);assert.equal(sent[0].header['Idempotency-Key'],sent[1].header['Idempotency-Key']);assert.deepEqual(JSON.parse(sent[1].data),{patient_number:'Original-P001',date_of_birth:'1990-01-02',clinic_id:'9007199254740993'});assert.equal(sent[1].header.Authorization,`Bearer ${'t'.repeat(43)}`);assert.equal(sent[1].header['X-Subject-Id'],undefined)
})
