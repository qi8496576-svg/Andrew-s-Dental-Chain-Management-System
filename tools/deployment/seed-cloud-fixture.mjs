import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
const origin='https://andrewdental.cn',directory='D:/secrets/AndrewDental/CloudIntegration',purpose='owner-approved-cloud-synthetic-integration-only-20261124'
const accountsFile=path.join(directory,'accounts.json'),accounts=JSON.parse(fs.readFileSync(accountsFile,'utf8'))
assert.equal(accounts.purpose,purpose)
const file=path.join(directory,'fixture.json'),state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{purpose,items:{},requests:{}}
assert.equal(state.purpose,purpose)
const save=()=>fs.writeFileSync(file,JSON.stringify(state,null,2)+'\n')
async function request(method,url,body,actor,key){return new Promise((resolve,reject)=>{
 const req=https.request(origin+'/api/v1'+url,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(actor?{Origin:origin,Cookie:actor.cookie,'X-CSRF-Token':actor.csrf}:{}),...(key?{'Idempotency-Key':key}:{})}},res=>{let text='';res.on('data',b=>text+=b);res.on('end',()=>{const data=text?JSON.parse(text):null;res.statusCode>=200&&res.statusCode<300?resolve({data,headers:res.headers}):reject(Error(method+' '+url+': '+res.statusCode+' '+data?.code))})});req.setTimeout(20000,()=>req.destroy(Error('API timeout; keep original request key')));req.on('error',reject);req.end(body?JSON.stringify(body):undefined)
})}
async function login(account){const c=await request('GET','/auth/csrf');const r=await request('POST','/auth/staff-sessions',account,{cookie:c.headers['set-cookie'].map(s=>s.split(';')[0]).join('; '),csrf:c.data.csrf_token});return {cookie:r.headers['set-cookie'].find(s=>s.startsWith('adc_session=')).split(';')[0],csrf:r.data.csrf_token,subject:r.data.subject_id}}
async function api(actor,name,url,data,method='POST'){if(!state.requests[name]){state.requests[name]={key:crypto.randomUUID(),data,method,url};save()}const c=state.requests[name];assert.equal(c.url,url);assert.equal(c.method,method);return (await request(c.method,c.url,c.data,actor,c.key)).data}
async function step(name,work){if(Object.hasOwn(state.items,name))return state.items[name];const result=await work();state.items[name]=result;save();return result}
const admin=await login(accounts.admin)
await step('headquartersExtra',()=>api(admin,'hqExtra','/identity/grants',{subject_id:admin.subject,role:'HEADQUARTERS',clinic_ids:['1'],capabilities:['correctTreatmentPrice','getInvoice'],valid_from:new Date().toISOString(),valid_until:null}))
const dentist=await step('dentist',()=>api(admin,'dentist','/dentists',{employee_number:'CLOUD-TEST-D1',full_name:'云端联调牙医（虚构）',date_of_birth:'1980-01-02',phone:'000',hire_date:'2020-01-01',is_active:true}))
await step('assignment',()=>api(admin,'assignment',`/dentists/${dentist.dentist_id}/clinic-assignments`,{clinic_id:'1',start_date:'2020-01-01',end_date:null,is_active:true}))
const qualification=await step('qualification',()=>api(admin,'qualification','/qualifications',{qualification_name:'云端联调资质（虚构）',is_active:true}))
await step('certificate',()=>api(admin,'certificate',`/dentists/${dentist.dentist_id}/qualifications`,{qualification_id:qualification.qualification_id,certificate_number:'CLOUD-SYNTHETIC-TEST',granted_date:'2020-01-01',expiry_date:null,verification_status:'VERIFIED',verification_reference:'SYNTHETIC_CLOUD_CERTIFICATE_NOT_REAL_QUALIFICATION'}))
const treatment=await step('treatment',()=>api(admin,'treatment','/treatments',{treatment_code:'CLOUD-TEST-CHECK',treatment_name:'云端联调检查（虚构）',default_unit_price:'150.00',is_active:true}))
await step('requirements',()=>api(admin,'requirements',`/treatments/${treatment.treatment_id}/qualification-requirements`,{requirements:[{qualification_id:qualification.qualification_id,is_mandatory:true}]},'PUT'))
const capabilities={RECEPTION:['searchAppointmentCandidates','listAppointments','createAppointment','getAppointment','attendAppointment','cancelAppointment','markNoShow','rescheduleAppointment','listSchedules','createSchedule','suspendSchedule','createPatient','getPatient','updatePatient','reviewPatientAllergies','addPatientAllergy','listPatientAllergies','correctPatientAllergy','retractPatientAllergy','listBindingRequests','approvePatientBinding','rebindPatient','revokePatientBinding'],DENTIST:['listAppointments','getAppointment','completeAppointment','updateClinicalNotes','recordAppliedTreatment','getClinicalContext','getAppliedTreatment'],CASHIER:['listAppointments','getAppointment','invoiceAppointment','getInvoice'],HEADQUARTERS:['account.manage','authorization.manage','resource.read','resource.write','analysis.read','cost.verify','performance.calculate','performance.publish','sensitive.drilldown','audit.read','correctTreatmentPrice','getInvoice']}
for(const [name,roles] of [['frontdesk',['RECEPTION']],['dentist',['DENTIST']],['cashier',['CASHIER']],['demo',['HEADQUARTERS','RECEPTION','DENTIST','CASHIER']]]){
 if(!accounts[name]){accounts[name]={username:'cloud-'+name,password:crypto.randomBytes(24).toString('base64url')};fs.writeFileSync(accountsFile,JSON.stringify(accounts,null,2)+'\n')}
 const account=await step(name+'Account',()=>api(admin,name+'Account','/identity/staff-accounts',{username:accounts[name].username,staff_reference:'OWNER_APPROVED_SYNTHETIC_CLOUD_'+name,dentist_id:roles.includes('DENTIST')?dentist.dentist_id:null}))
 await step(name+'Credential',()=>api(admin,name+'Credential',`/identity/staff-accounts/${account.subject_id}/credential-recovery`,{verification_reference:'OWNER_APPROVED_SYNTHETIC_INTEGRATION_ONLY',reason:'云端联调虚构员工，不是真实人员核验',replacement_password:accounts[name].password}))
 for(const role of roles)await step(name+role+'Grant',()=>api(admin,name+role+'Grant','/identity/grants',{subject_id:account.subject_id,role,clinic_ids:['1'],capabilities:capabilities[role],valid_from:new Date().toISOString(),valid_until:null}))
 await login(accounts[name])
}
const reception=await login(accounts.frontdesk),basis={clinic_id:'1',person_confirmed:true,service_basis:'OWNER_APPROVED_CLOUD_SYNTHETIC_PATIENT_NOT_REAL_PERSON'}
const patient=await step('patient',()=>api(reception,'patient','/patients',{full_name:'云端联调患者（虚构）',date_of_birth:'1990-01-02',phone:'000',billing_address:'云端虚构联调资料，请勿录入真实隐私',emergency_contact_name:'虚构联系人',emergency_contact_phone:'000',verification_basis:basis}))
const proof=await step('patientVerification',()=>api(reception,'patientVerification','/patients/lookup',{patient_number:patient.patient_number,date_of_birth:patient.date_of_birth,verification_basis:basis}))
await step('allergyReview',()=>api(reception,'allergyReview',`/patients/${patient.patient_id}/allergy-reviews`,{allergy_review_status:'NO_KNOWN',verification_reference:proof.verification_reference,reason:'仅虚构联调患者的测试核验'}))
const date=new Date(Date.now()+86400000+8*3600000).toISOString().slice(0,10)
const schedule=await step('schedule',()=>api(reception,'schedule','/schedules',{dentist_id:dentist.dentist_id,clinic_id:'1',schedule_date:date,start_time:'09:00:00',end_time:'10:00:00',slot_minutes:20,note:'云端虚构联调医生排班，不是真实出诊'}))
const lines=['仅云端隔离联调：所有员工/患者/诊所/资质均为明确标记的虚构资料。',origin,'全模块演示使用 cloud-demo；cloud-admin 为总部配置账号。','',...Object.entries(accounts).filter(([name])=>name!=='purpose').flatMap(([name,account])=>[name+': '+account.username,'口令: '+account.password,''])]
fs.writeFileSync(path.join(directory,'云端联调登录资料.txt'),lines.join('\r\n'))
const report={checked_at:new Date().toISOString(),purpose,origin,real_mysql:true,api_mocked:false,clinical_data_written_directly:false,initial_synthetic_clinic_precondition:true,accounts_created:Object.keys(accounts).filter(k=>k!=='purpose'),patient_number:patient.patient_number,schedule_id:schedule.schedule_id,date:schedule.schedule_date,real_wechat_verified:false}
fs.writeFileSync('docs/verification/cloud-integration-20261124/fixture.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report))
