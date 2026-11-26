import http from 'k6/http'
import {sleep} from 'k6'
import exec from 'k6/execution'
import {Counter,Rate,Trend} from 'k6/metrics'
const f=JSON.parse(open(__ENV.ADC_Q03_CLOUD_INPUT));if(f.kind!=='adc-q03-cloud-read-only'||f.origin!=='https://andrewdental.cn'||f.actors.length!==5)throw Error('Controlled cloud read-only fixture required')
export const options={scenarios:{cloud:{executor:'constant-vus',vus:5,duration:'5m',gracefulStop:'15s'}},thresholds:{cloud_read_ms:['p(95)<=3000'],cloud_read_errors:['rate<0.01'],cloud_read_requests:['count>=600']}}
const duration=new Trend('cloud_read_ms',true),errors=new Rate('cloud_read_errors'),count=new Counter('cloud_read_requests')
export default function(){const began=Date.now(),a=f.actors[__VU-1],kind=(__ITER+__VU)%5,path=kind<3?f.candidate_path:kind===3?'/treatments?limit=20':'/me',r=http.get(f.origin+'/api/v1'+path,{headers:{Cookie:a.cookie,Origin:f.origin,'X-CSRF-Token':a.csrf},redirects:0,timeout:'10s',tags:{name:kind<3?'cloud_candidates':kind===3?'cloud_resources':'cloud_identity'}});let valid=false;try{const b=r.json();valid=r.status===200&&(kind===4?typeof b.subject_id==='string':Array.isArray(b.items)&&b.items.length>0)}catch{}duration.add(r.timings.duration);errors.add(!valid);count.add(1);if(!valid)exec.test.abort('Cloud read check failed; no capacity claim');sleep(Math.max(0,2-(Date.now()-began)/1000))}
export function handleSummary(data){return {[__ENV.ADC_Q03_CLOUD_SUMMARY]:JSON.stringify({kind:'q03-actual-cloud-low-load-read-verification',write_business_apis_called:false,metrics:data},null,2)+'\n'}}
