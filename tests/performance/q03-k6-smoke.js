// Tool compatibility only: no HTTP requests, no business/authentication simulation.
import {check,fail} from 'k6'
import crypto from 'k6/crypto'
import exec from 'k6/execution'
import {Trend,Rate,Counter} from 'k6/metrics'
import {workloadKind,takeNext,validSuccess,classify,validatePools} from './q03-workload.mjs'

export const options={vus:1,iterations:1,thresholds:{checks:['rate==1']}}
const timing=new Trend('compatibility_duration',true),errors=new Rate('compatibility_errors'),count=new Counter('compatibility_cases')
export default function(){
 let cases=0
 const require=(condition,name)=>{cases++;if(!check(null,{[name]:()=>condition}))fail(name)}
 require(exec.vu.idInTest===1,'k6 execution context is available')
 require(crypto.randomBytes(16).byteLength===16,'cryptographic bytes are available')
 const mix={candidates:0,treatments:0,invoices:0}
 for(let vu=1;vu<=100;vu++)mix[workloadKind(vu,0)]++
 require(mix.candidates===60&&mix.treatments===20&&mix.invoices===20,'100-worker mix remains 60/20/20')
 require(classify(503).unexpected_error&&!classify(409).unexpected_error,'error classification works')
 require(!validSuccess('invoices',{}),'empty response never masquerades as an invoice')
 const cursor={};require(takeNext(cursor,'invoices',['9007199254740993'])==='9007199254740993','BIGINT is preserved')
 let exhausted=false;try{takeNext(cursor,'invoices',['9007199254740993'])}catch{exhausted=true}
 require(exhausted,'inventory exhaustion fails closed')
 let duplicate=false;try{validatePools([{treatments:[{appointment_id:'1',body:{treatment_id:'1'}}],invoices:['2']},{treatments:[{appointment_id:'3',body:{treatment_id:'1'}}],invoices:['2']}],2)}catch{duplicate=true}
 require(duplicate,'cross-worker invoice reuse is rejected')
 timing.add(0);errors.add(false);count.add(cases)
}
