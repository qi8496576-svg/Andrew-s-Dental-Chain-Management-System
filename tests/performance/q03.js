// Owner-approved small-deployment acceptance; the full data scale is retained.
import http from 'k6/http'
import crypto from 'k6/crypto'
import exec from 'k6/execution'
import {sleep} from 'k6'
import {Counter,Rate,Trend} from 'k6/metrics'
import {workloadKind,takeNext,classify,validatePools,validSuccess} from './q03-workload.mjs'

if(__ENV.ADC_Q03_RUN!=='isolated-synthetic-only')throw new Error('Explicit isolated workload invocation required; never point this at preview or production')
if(!__ENV.ADC_Q03_FIXTURE_FILE||!__ENV.ADC_Q03_COUNTS_FILE)throw new Error('Controlled session/inventory file and actual MySQL count capture required')
function readControlled(file){try{return JSON.parse(open(file))}catch{throw new Error('Invalid controlled input; contents not logged')}}
const fixture=readControlled(__ENV.ADC_Q03_FIXTURE_FILE),counts=readControlled(__ENV.ADC_Q03_COUNTS_FILE)
if(fixture.kind!=='adc-q03-synthetic-isolated'||fixture.base_url!=='https://127.0.0.1:19843')throw new Error('Owned loopback HTTPS fixture required; no external write target accepted')
if(counts.kind!=='adc-q03-real-mysql-counts'||!counts.server_uuid||counts.server_uuid!==fixture.server_uuid)throw new Error('Fixture and MySQL capture do not identify the same database')
for(const [name,expected] of Object.entries({clinics:30,dentists:100,patients:10000,appointments:100000,applied_treatments:200000}))if(counts[name]!==expected)throw new Error('Full approved baseline missing: '+name)
if(fixture.profile!=='Q03-SMALL-20261125')throw new Error('Approved acceptance profile required')
validatePools(fixture.workers,10)
for(const worker of fixture.workers)for(const role of ['reception','dentist','cashier']){const actor=worker.actors[role];if(!/^adc_session=[A-Za-z0-9_-]{43}$/.test(actor.cookie)||!/^[A-Za-z0-9_-]{43}$/.test(actor.csrf_token))throw new Error('Actual preauthenticated WEB sessions required')}
export const options={insecureSkipTLSVerify:true,scenarios:{q03:{executor:'constant-vus',vus:10,duration:'20m',gracefulStop:'15s'}},thresholds:{q03_candidates_ms:['p(95)<=3000'],q03_treatments_ms:['p(95)<=3000'],q03_invoices_ms:['p(95)<=3000'],q03_unexpected_errors:['rate<0.01'],q03_actual_requests:['count>=5000'],q03_successes:['count>=5000']}}
const timings={candidates:new Trend('q03_candidates_ms',true),treatments:new Trend('q03_treatments_ms',true),invoices:new Trend('q03_invoices_ms',true)},requests=new Counter('q03_actual_requests'),successes=new Counter('q03_successes'),rejections=new Counter('q03_business_rejections'),unexpected=new Rate('q03_unexpected_errors'),cursor={}
const actualCounts={candidates:new Counter('q03_candidates_requests'),treatments:new Counter('q03_treatments_requests'),invoices:new Counter('q03_invoices_requests')}
function uuid(){const bytes=new Uint8Array(crypto.randomBytes(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20)}
export default function(){
  const iterationStarted=Date.now()
  const worker=fixture.workers[__VU-1],kind=workloadKind(__VU,__ITER),actor=worker.actors[{candidates:'reception',treatments:'dentist',invoices:'cashier'}[kind]],key=uuid();let url,body,target,method='GET'
  try{
    if(kind==='candidates'){const query=worker.candidates;url='/api/v1/appointment-candidates?clinic_id='+encodeURIComponent(query.clinic_id)+'&start='+encodeURIComponent(query.start)+'&end='+encodeURIComponent(query.end)+query.treatment_ids.map(id=>'&treatment_ids='+encodeURIComponent(id)).join('')}
    else if(kind==='treatments'){target=takeNext(cursor,kind,worker.treatments);url='/api/v1/appointments/'+target.appointment_id+'/applied-treatments';body=target.body;method='POST'}
    else{target={appointment_id:takeNext(cursor,kind,worker.invoices)};url='/api/v1/appointments/'+target.appointment_id+'/invoice';method='POST'}
  }catch{exec.test.abort('Mutation inventory exhausted or invalid; incomplete Q03, never wrap/replay to fill load');return}
  const headers={Cookie:actor.cookie,Origin:fixture.base_url,'X-CSRF-Token':actor.csrf_token,'Content-Type':'application/json','Idempotency-Key':key},response=http.request(method,fixture.base_url+url,body===undefined?null:JSON.stringify(body),{headers,redirects:0,tags:{name:'q03_'+kind},timeout:'15s'}),result=classify(response.status)
  let valid=true;if(result.success)try{valid=validSuccess(kind,response.json(),target)}catch{valid=false}
  requests.add(1,{kind});actualCounts[kind].add(1);timings[kind].add(response.timings.duration);unexpected.add(result.unexpected_error||!valid,{kind});if(result.success&&valid)successes.add(1,{kind});if(result.business_rejection)rejections.add(1,{kind})
  if(!valid)exec.test.abort('HTTP success does not contain the expected actual business result; incomplete workload')
  if(response.status===0||response.status>=500)console.warn(JSON.stringify({kind:'unknown_command_ledger',operation:kind,path:url,body,key,vu:__VU,status:response.status})) // No credentials/session headers. Resolve with ORIGINAL key after the run.
  if([400,401,403,404,429].includes(response.status))exec.test.abort('Invalid workload input or authentication; no full-window Q03 claim')
  sleep(Math.max(0,2-(Date.now()-iterationStarted)/1000))
}
export function handleSummary(data){return {[__ENV.ADC_Q03_SUMMARY_FILE||'q03-summary.json']:JSON.stringify({kind:'q03-measurements-not-automatic-acceptance',actual_database_capture:counts,source_fixture_kind:fixture.kind,required_mix:'60/20/20 actual calls; inspect raw counters including rejects/errors',environment_and_full_window_require_separate_verification:true,metrics:data},null,2)+'\n'}}
