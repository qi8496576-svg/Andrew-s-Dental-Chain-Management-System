import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
const root=path.resolve(import.meta.dirname,'../..'),privateRoot='D:/secrets/AndrewDental/LocalPreview',origin='https://localhost:19443'
const fixture=JSON.parse(fs.readFileSync(path.join(privateRoot,'preview-state.json'),'utf8'))
assert.equal(fixture.purpose,'owned-local-synthetic-preview-only');assert.equal(fixture.project,'adc-local-preview')
const file=path.join(privateRoot,'admin-demo-state.json')
const state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{purpose:'owned-local-synthetic-preview-only',username:'admin-demo',password:crypto.randomBytes(18).toString('base64url'),items:{},requests:{},valid_until:new Date(Date.now()+30*86400000).toISOString()}
assert.equal(state.purpose,fixture.purpose);assert.equal(state.username,'admin-demo')
const save=()=>fs.writeFileSync(file,JSON.stringify(state,null,2)+'\n');save()
const privateAccounts=JSON.parse(fs.readFileSync(path.join(privateRoot,'preview-accounts.json'),'utf8'))
const env={...process.env,DOCKER_HOST:'npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONFIG:path.join(root,'tmp/docker-config')}
function sql(input){const r=spawnSync('D:/ADC-Dev/Docker/app/resources/bin/docker.exe',['exec','-i','adc-local-preview-mysql-1','sh','-ec','MYSQL_PWD="$(cat /run/secrets/mysql_root_password)" exec mysql --user=root --batch --skip-column-names'],{env,input,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,'Owned preview database check failed');return r.stdout.trim()}
const allowedPatients=[fixture.items.patient.patient_id,state.items.patient?.patient_id].filter(Boolean)
assert.ok(allowedPatients.every(id=>/^\d+$/.test(id)))
assert.equal(sql("SELECT COUNT(*) FROM adc_business.Clinic WHERE clinic_id<>1 OR clinic_code<>'LOCAL-PREVIEW-C1';"),'0','Refuse a non-owned clinic environment')
assert.equal(sql(`SELECT COUNT(*) FROM adc_business.Patient WHERE patient_id NOT IN (${allowedPatients.join(',')});`),'0','Unrecognized patients present; synthetic-only boundary cannot be proven')
const ca=fs.readFileSync(path.join(privateRoot,'tls/localhost.crt'))
async function request(method,url,body,headers={}){return new Promise((resolve,reject)=>{const bytes=body===undefined?undefined:JSON.stringify(body),req=https.request(origin+'/api/v1'+url,{method,ca,headers:{...(bytes?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(bytes)}:{}),...headers}},res=>{let text='';res.setEncoding('utf8');res.on('data',b=>text+=b);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,data:text?JSON.parse(text):null}))});req.setTimeout(20000,()=>req.destroy(new Error('Local API timeout; preserve original request key')));req.on('error',reject);req.end(bytes)})}
async function login(account){let r=await request('GET','/auth/csrf');assert.equal(r.status,200);const pre=r.headers['set-cookie'].map(c=>c.split(';')[0]).join('; ');r=await request('POST','/auth/staff-sessions',{username:account.username,password:account.password},{Origin:origin,Cookie:pre,'X-CSRF-Token':r.data.csrf_token});assert.equal(r.status,200,'Real staff login rejected');return{cookie:r.headers['set-cookie'].find(c=>c.startsWith('adc_session=')).split(';')[0],csrf:r.data.csrf_token,identity:r.data}}
const admin=await login(privateAccounts.admin)
const evidence=[]
async function read(actor,url){const r=await request('GET',url,undefined,{Cookie:actor.cookie});assert.equal(r.status,200,`GET ${url}: ${r.status} ${r.data?.code}`);evidence.push({method:'GET',path:url,status:r.status});return r.data}
async function command(actor,name,url,body,method='POST'){
 if(!state.requests[name]){state.requests[name]={key:crypto.randomUUID(),url,body,method};save()}
 const c=state.requests[name];assert.equal(c.url,url);assert.equal(c.method,method)
 const r=await request(c.method,c.url,c.body,{Origin:origin,Cookie:actor.cookie,'X-CSRF-Token':actor.csrf,'Idempotency-Key':c.key})
 assert.equal(r.status,200,`${name}: ${r.status} ${r.data?.code}; original key preserved`);evidence.push({method,path:url,status:r.status,operation:name});return r.data
}
async function step(name,run){if(Object.hasOwn(state.items,name))return state.items[name];state.items[name]=await run();save();return state.items[name]}
async function allGrants(){let cursor=null,items=[];do{const page=await read(admin,'/identity/grants?limit=100'+(cursor?'&cursor='+encodeURIComponent(cursor):''));items.push(...page.items);cursor=page.next_cursor}while(cursor);return items}
const originalGrants=await allGrants()
const account=await step('account',()=>command(admin,'account','/identity/staff-accounts',{username:state.username,staff_reference:'LOCAL_PREVIEW_TEACHER_SYNTHETIC_STAFF',dentist_id:fixture.items.dentist.dentist_id}))
await step('credential',()=>command(admin,'credential',`/identity/staff-accounts/${account.subject_id}/credential-recovery`,{verification_reference:'OWNER_AUTHORIZED_LOCAL_SYNTHETIC_TEACHER_DEMO',reason:'负责人授权的本机虚构演示账号；不是真实员工身份核验',replacement_password:state.password}))
const registryText=fs.readFileSync(path.join(root,'apps/admin/src/api/grant-capabilities.ts'),'utf8')
const registry=JSON.parse(registryText.slice(registryText.indexOf('=')+1).trim())
for(const role of ['HEADQUARTERS','RECEPTION','DENTIST','CASHIER'])await step('grant-'+role,()=>command(admin,'grant-'+role,'/identity/grants',{subject_id:account.subject_id,role,clinic_ids:['1'],capabilities:registry[role],valid_from:new Date().toISOString(),valid_until:state.valid_until}))
const finalOriginal=(await allGrants()).filter(g=>g.subject_id!==account.subject_id)
assert.deepEqual(finalOriginal,originalGrants.filter(g=>g.subject_id!==account.subject_id),'Existing staff grants must remain unchanged')
const teacher=await login(state),identity=await read(teacher,'/me')
assert.deepEqual([...identity.roles].sort(),['CASHIER','DENTIST','HEADQUARTERS','RECEPTION']);assert.deepEqual(identity.clinic_scope,['1'])
for(const capabilities of Object.values(registry))for(const cap of capabilities)assert.ok(identity.capabilities.includes(cap),cap)
const basis={clinic_id:'1',person_confirmed:true,service_basis:'LOCAL_PREVIEW_SYNTHETIC_TEACHER_FIXTURE_ONLY'}
const patient=await step('patient',()=>command(teacher,'patient','/patients',{full_name:'教师演示患者（虚构）',date_of_birth:'1992-03-04',phone:'000',billing_address:'本地虚构演示，不含真实患者',emergency_contact_name:'虚构联系人',emergency_contact_phone:'000',verification_basis:basis}))
const proof=await step('patientVerification',()=>command(teacher,'patientVerification','/patients/lookup',{patient_number:patient.patient_number,date_of_birth:patient.date_of_birth,verification_basis:basis}))
const allergy=await step('allergy',()=>command(teacher,'allergy',`/patients/${patient.patient_id}/allergy-reviews`,{allergy_review_status:'NO_KNOWN',verification_reference:proof.verification_reference,reason:'仅虚构患者的演示资料确认'}))
const schedule=await step('schedule',async()=>{const local=new Date(Date.now()+8*3600000),date=local.toISOString().slice(0,10);let minute=Math.ceil((local.getUTCHours()*60+local.getUTCMinutes()+3)/10)*10,day=date;if(minute+30>=1440){day=new Date(local.valueOf()+86400000).toISOString().slice(0,10);minute=540}const time=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}:00`;return command(teacher,'schedule','/schedules',{clinic_id:'1',dentist_id:fixture.items.dentist.dentist_id,schedule_date:day,start_time:time(minute),end_time:time(minute+30),slot_minutes:10,note:'教师独立虚构业务闭环演示'})})
const appointment=await step('appointment',()=>command(teacher,'appointment','/appointments',{clinic_id:'1',schedule_id:schedule.schedule_id,scheduled_at:`${schedule.schedule_date}T${schedule.start_time}+08:00`,requested_treatment_ids:[fixture.items.treatment.treatment_id],patient_id:patient.patient_id,patient_verification_reference:proof.verification_reference,patient_details:{full_name:patient.full_name,date_of_birth:patient.date_of_birth,phone:patient.phone,billing_address:patient.billing_address,email:patient.email??null,emergency_contact_name:patient.emergency_contact_name,emergency_contact_phone:patient.emergency_contact_phone},allergy_confirmation_reference:allergy.allergy_confirmation_reference,allergy_declaration:{review_status:'NO_KNOWN',records:[],confirmed:true}}))
// Re-verify for the distinct attendance operation; do not reuse another employee's proof.
const attendanceProof=await step('attendanceProof',()=>command(teacher,'attendanceProof','/patients/lookup',{patient_number:patient.patient_number,date_of_birth:patient.date_of_birth,verification_basis:basis}))
await step('attend',()=>command(teacher,'attend',`/appointments/${appointment.appointment_id}/attend`,{verification_reference:attendanceProof.verification_reference}))
await read(teacher,`/appointments/${appointment.appointment_id}/clinical-context`)
const treatment=await step('treatment',()=>command(teacher,'treatment-seconds',`/appointments/${appointment.appointment_id}/applied-treatments`,{treatment_id:fixture.items.treatment.treatment_id,standard_units:'1.00',performed_at:new Date().toISOString().replace(/\.\d{3}Z$/,'Z')}))
await step('complete',()=>command(teacher,'complete',`/appointments/${appointment.appointment_id}/complete`,{}))
const invoice=await step('invoice',()=>command(teacher,'invoice',`/appointments/${appointment.appointment_id}/invoice`,{}))
assert.equal(invoice.total_amount,treatment.subtotal)
for(const url of ['/clinics','/dentists','/qualifications','/treatments','/allergies','/identity/staff-accounts','/identity/grants?subject_id='+account.subject_id,'/binding-requests?clinic_id=1','/schedules?clinic_id=1','/appointments?clinic_id=1','/cost-entries?clinic_id=1','/quarterly-performances',`/invoices/${invoice.invoice_id}`,`/patients/${patient.patient_id}`])await read(teacher,url)
const reception=await login(privateAccounts.frontdesk),denied=await request('GET','/identity/staff-accounts',undefined,{Cookie:reception.cookie});assert.equal(denied.status,403)
const scopeDenied=await request('GET','/appointments?clinic_id=2',undefined,{Cookie:teacher.cookie});assert.equal(scopeDenied.status,403)
await read(teacher,`/applied-treatments/${treatment.applied_treatment_id}`)
const analyticsQuery=new URLSearchParams({start:'2026-11-01T00:00:00+08:00',end:new Date().toISOString(),cutoff:new Date().toISOString(),rule_version:'A1a-B13',clinic_id:'1'})
await read(teacher,'/analytics/cancellations?'+analyticsQuery)
const successfulKeys=Object.entries(state.requests).filter(([name])=>name!=='treatment').map(([,r])=>r.key)
assert.ok(successfulKeys.every(key=>/^[0-9a-f-]{36}$/.test(key)))
const receiptCount=Number(sql(`SELECT COUNT(*) FROM adc_identity.RequestReceipt WHERE request_key IN (${successfulKeys.map(k=>"'"+k+"'").join(',')});`))
assert.equal(receiptCount,successfulKeys.length,'Every successful demo write must have a committed receipt')
const auditedWrites=Number(sql(`SELECT COUNT(DISTINCT r.request_key) FROM adc_identity.RequestReceipt r JOIN adc_audit.AuditEvent a ON a.request_id=r.request_id WHERE r.request_key IN (${successfulKeys.map(k=>"'"+k+"'").join(',')});`))
assert.equal(auditedWrites,receiptCount,'Committed demo writes must have matching audit records')
const result={date:new Date().toISOString(),username:state.username,origin,clinic_scope:['1'],roles:identity.roles,valid_until:state.valid_until,account_created_through_api:true,original_grants_unchanged:true,ordinary_reception_still_denied:denied.status,teacher_out_of_scope_denied:scopeDenied.status,real_mysql:true,api_mocked:false,synthetic_only_guard:true,evidence,fixture:{patient_id:patient.patient_id,patient_number:patient.patient_number,appointment_id:appointment.appointment_id,applied_treatment_id:treatment.applied_treatment_id,invoice_id:invoice.invoice_id},credentials_file:path.join(privateRoot,'教师演示登录.txt')}
result.committed_write_receipts_verified=receiptCount
result.committed_writes_with_audit=auditedWrites
fs.writeFileSync(result.credentials_file,`仅本机虚构数据演示\r\n地址：${origin}\r\n账号：${state.username}\r\n密码：${state.password}\r\n授权截止：${state.valid_until}\r\n不适用于云端或真实患者环境。\r\n`)
fs.writeFileSync(path.join(root,'docs/verification/admin-demo-api.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({ready:true,username:state.username,roles:identity.roles,api_checks:evidence.length,credentials_file:result.credentials_file,password_logged:false}))
