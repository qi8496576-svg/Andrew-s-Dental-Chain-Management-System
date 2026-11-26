// Owner-requested realistic catalog labels and actual future shifts, via existing APIs only.
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {accounts,privateRoot,login,catalog,get,request,key,origin} from './cloud-api.mjs'
const purpose='owner-approved-cloud-synthetic-integration-only-20261124'
assert.equal(accounts.purpose,purpose)
const journalFile=path.join(privateRoot,'resource-expansion.json'),state=fs.existsSync(journalFile)?JSON.parse(fs.readFileSync(journalFile,'utf8')):{purpose,items:{},commands:{}}
assert.equal(state.purpose,purpose)
const save=()=>fs.writeFileSync(journalFile,JSON.stringify(state,null,2)+'\n')
async function write(actor,name,method,url,body,etag){if(!state.commands[name]){state.commands[name]={key:key(),method,url,body,etag};save()}const c=state.commands[name];assert.equal(c.method,method);assert.equal(c.url,url);const r=await request(c.method,c.url,c.body,actor,c);if(r.status<200||r.status>=300)throw Error(method+' '+url+': '+r.status+' '+r.data?.code);return r.data}
async function step(name,work){if(Object.hasOwn(state.items,name))return state.items[name];const result=await work();state.items[name]=result??true;save();return result}
const admin=await login(accounts.admin),reception=await login(accounts.frontdesk)
const before={treatments:await catalog('treatments',admin),dentists:await catalog('dentists',admin),qualifications:await catalog('qualifications',admin)}
async function update(kind,id,fields,name){const detail=await get('/'+kind+'/'+id,admin);return write(admin,name+'-patch-v1','PATCH','/'+kind+'/'+id,fields(detail.data),detail.headers.etag)}
const base=before.qualifications.find(row=>row.label==='云端联调资质（虚构）'||row.label==='口腔全科诊疗')
assert.ok(base,'Owned base qualification must exist')
await step('rename-base',()=>update('qualifications',base.id,d=>({qualification_name:'口腔全科诊疗',description:'演示资质目录，不代表真实医师资格。',is_active:d.is_active}),'rename-base'))
const quals={general:base.id}
for(const [code,name] of [['endo','牙体牙髓诊疗'],['child','儿童口腔诊疗'],['ortho','口腔正畸咨询'],['implant','口腔种植咨询']]){
 const existing=before.qualifications.find(q=>q.label===name)
 const q=await step('qual-'+code,()=>existing?Promise.resolve({qualification_id:existing.id}):write(admin,'qual-'+code,'POST','/qualifications',{qualification_name:name,description:'演示资质目录；正式使用须核实真实证书。',is_active:true}))
 quals[code]=q.qualification_id
}
const services=[
 ['CHECK','口腔检查','150.00','general','检查口腔及牙齿基本情况'],
 ['CLEAN','超声波洁牙','180.00','general','洁治服务预约'],
 ['FILL','树脂补牙','300.00','general','龋齿检查后的修复服务预约'],
 ['PANORAMA','口腔全景影像检查','120.00','general','影像检查预约，实际项目由接诊医生确认'],
 ['AIRPOLISH','喷砂洁牙','280.00','general','口腔清洁服务预约'],
 ['ROOT','根管治疗','800.00','endo','牙体牙髓专科就诊预约'],
 ['EXTRACT','普通拔牙','200.00','general','拔牙就诊评估及治疗预约'],
 ['PERIO','牙周基础治疗','400.00','general','牙周检查及基础治疗预约'],
 ['FLUORIDE','儿童涂氟','80.00','child','儿童口腔预防服务预约'],
 ['SEALANT','儿童窝沟封闭','100.00','child','儿童口腔预防服务预约'],
 ['ORTHO','正畸初诊咨询','100.00','ortho','牙齿矫正初诊咨询'],
 ['IMPLANT','种植牙咨询','100.00','implant','缺牙修复与种植初诊咨询'],
]
const ownedLegacy=before.treatments.filter(t=>/联调|本地|云端/.test(t.label)).sort((a,b)=>(a.code==='CLOUD-TEST-CHECK'?-1:b.code==='CLOUD-TEST-CHECK'?1:a.id.localeCompare(b.id)))
const treatments=[]
for(const [index,[code,name,price,specialty,description]] of services.entries()){
 const item=await step('service-'+code,async()=>{
  const existing=before.treatments.find(t=>t.label===name)??ownedLegacy[index]
  if(existing)return update('treatments',existing.id,d=>({treatment_code:d.treatment_code,treatment_name:name,description:description+'。演示目录，单价仅用于功能测试，非真实门店报价。',default_unit_price:d.default_unit_price,is_active:d.is_active}),'service-'+code)
  return write(admin,'service-'+code,'POST','/treatments',{treatment_code:'ADC-'+code,treatment_name:name,description:description+'。演示目录，单价仅用于功能测试，非真实门店报价。',default_unit_price:price,is_active:true})
 })
 const id=item.treatment_id
 await step('requirements-'+code,()=>write(admin,'requirements-'+code,'PUT','/treatments/'+id+'/qualification-requirements',{requirements:[...new Set([quals.general,quals[specialty]])].map(qualification_id=>({qualification_id,is_mandatory:true}))}))
 treatments.push({id,name,specialty})
}
const original=before.dentists.find(d=>d.code==='CLOUD-TEST-D1')
assert.ok(original,'Owned demonstration dentist must exist')
const doctors=[]
for(const [index,[name,specialties]] of [['林医生',['general','endo']],['陈医生',['general','child']],['周医生',['general','endo']],['李医生',['general','ortho']],['王医生',['general','implant']]].entries()){
 const doctor=await step('doctor-'+index,async()=>{
  if(index===0)return update('dentists',original.id,d=>({employee_number:d.employee_number,full_name:name,date_of_birth:d.date_of_birth,home_address:'演示医生档案，非真实执业人员。',phone:d.phone,email:d.email??null,hire_date:d.hire_date,is_active:d.is_active,termination_date:d.termination_date??null}),'doctor-'+index)
  const existing=before.dentists.find(d=>d.code==='DEMO-DENT-'+(index+1))
  if(existing)return {dentist_id:existing.id}
  return write(admin,'doctor-'+index,'POST','/dentists',{employee_number:'DEMO-DENT-'+(index+1),full_name:name,date_of_birth:'1985-01-01',home_address:'演示医生档案，非真实执业人员。',phone:'000',hire_date:'2020-01-01',is_active:true})
 })
 const id=doctor.dentist_id
 for(const specialty of specialties)await step('certificate-'+index+'-'+specialty,()=>write(admin,'certificate-'+index+'-'+specialty,'POST','/dentists/'+id+'/qualifications',{qualification_id:quals[specialty],certificate_number:'DEMO-D'+index+'-'+specialty.toUpperCase(),granted_date:'2020-01-01',expiry_date:'2030-12-31',verification_status:'VERIFIED',verification_reference:'OWNER_APPROVED_SYNTHETIC_DEMO_CERTIFICATE_NOT_REAL_LICENSE'}))
 if(index>0)await step('assignment-'+index,()=>write(admin,'assignment-'+index,'POST','/dentists/'+id+'/clinic-assignments',{clinic_id:'1',start_date:'2020-01-01',end_date:null,is_active:true,availability_note:'演示门店出诊安排，非真实机构劳动排班。'}))
 doctors.push({id,name,specialties})
}
const today=new Date(Date.now()+8*3600000).toISOString().slice(0,10)
const shift=(date,offset)=>new Date(Date.parse(date+'T12:00:00Z')+offset*86400000).toISOString().slice(0,10)
if(!state.first_day){state.first_day=shift(today,1);save()}
const first=state.first_day,last=shift(first,27)
const schedules=await catalog('schedules',reception,{clinic_id:'1',start:first+'T00:00:00+08:00',end:shift(last,1)+'T00:00:00+08:00'})
const minutes=time=>Number(time.slice(0,2))*60+Number(time.slice(3,5)),clock=minute=>String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0')+':00'
let created=0
for(let offset=0;offset<28;offset++)for(const doctor of doctors){const date=shift(first,offset);for(const [start,end] of [[540,720],[840,1020]]){
 let gaps=[[start,end]]
 for(const booked of schedules.filter(s=>s.dentist_id===doctor.id&&s.schedule_date===date))gaps=gaps.flatMap(([a,b])=>{const x=minutes(booked.start_time),y=minutes(booked.end_time);return y<=a||x>=b?[[a,b]]:[[a,Math.min(x,b)],[Math.max(y,a),b]].filter(([l,r])=>r-l>=20)})
 for(const [a,b] of gaps){const key='shift-'+doctor.id+'-'+date+'-'+a+'-'+b;const saved=await step(key,()=>write(reception,key,'POST','/schedules',{dentist_id:doctor.id,clinic_id:'1',schedule_date:date,start_time:clock(a),end_time:clock(b),slot_minutes:20,note:'演示门店预约排班；非真实机构出诊承诺。'}));schedules.push(saved);created++}
}}
const report={checked_at:new Date().toISOString(),origin,purpose,treatments,doctors,first_day:first,last_day:last,created_shifts:created,total_shifts_in_window:schedules.length,slot_minutes:20,existing_appointments_untouched:true,existing_prices_preserved:true,api_mocked:false}
fs.mkdirSync('docs/verification/resource-availability-20261124',{recursive:true});fs.writeFileSync('docs/verification/resource-availability-20261124/configuration.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({treatments:treatments.length,doctors:doctors.length,created_shifts:created,total_shifts:schedules.length,first_day:first,last_day:last}))
