// Owned, synthetic, loopback-only teaching environment. No cloud credentials required.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import https from 'node:https'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
const root=path.resolve(import.meta.dirname,'../..'),home=path.join(root,'.local-demo')
const docker=process.env.ADC_DOCKER||'docker'
const stateFile=path.join(home,'state.json')
const existingState=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):undefined
const project=existingState?.project||'adc-local-'+crypto.createHash('sha256').update(root).digest('hex').slice(0,8)
assert.match(project,/^adc-(?:local|teacher)-[0-9a-f]{8}$/) // Preserve existing volume ownership identifiers.
const port=process.env.ADC_DEMO_PORT||'19444',origin=`https://localhost:${port}`
assert.match(port,/^\d{4,5}$/)
const subnet=process.env.ADC_DEMO_NETWORK||'172.30.219';assert.match(subnet,/^172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}$/)
function run(args,options={}){const r=spawnSync(docker,args,{cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024,...options});if(r.error)throw r.error;if(r.status!==0)throw Error(`Docker ${args[0]} failed: ${r.stderr||r.stdout}`);return r.stdout.trim()}
const compose=['compose','--project-name',project,'--env-file',path.join(home,'compose.env'),'-f',path.join(home,'compose.yaml')]
if(process.argv[2]==='status'){console.log(run([...compose,'ps']));process.exit(0)}
assert.ok(!process.argv[2]||process.argv[2]==='up','Use: node tools/demo/demo.mjs [up|status]')
assert.ok(fs.existsSync(path.join(root,'backend/target/adc-backend-0.1.0-SNAPSHOT.jar')),'Build backend first; see README')
assert.ok(fs.existsSync(path.join(root,'apps/admin/dist/index.html')),'Build admin first; see README')
run(['info','--format','{{.OSType}}'])
let state
if(fs.existsSync(stateFile)){state=JSON.parse(fs.readFileSync(stateFile));assert.equal(state.project,project)}else{
 const exists=spawnSync(docker,['volume','inspect',project+'_mysql_data'],{encoding:'utf8',windowsHide:true})
 assert.notEqual(exists.status,0,'An unowned database volume exists; refusing to initialize it')
 fs.mkdirSync(path.join(home,'backend'),{recursive:true});fs.mkdirSync(path.join(home,'tls'),{recursive:true})
 for(const file of ['mysql-root','migration','backend/spring.datasource.password','backend/adc.auth-secret','backend/adc.wechat.app-secret'])fs.writeFileSync(path.join(home,file),crypto.randomBytes(48).toString('base64'),{mode:0o600})
 state={purpose:'owned-local-application',project,steps:{},requests:{},bootstrap:{username:'demo-bootstrap',password:crypto.randomBytes(24).toString('base64url')},manager:{username:'admin-demo',password:'adl123456'}}
 fs.writeFileSync(stateFile,JSON.stringify(state,null,2),{mode:0o600})
}
assert.equal(state.purpose,'owned-local-application')
const save=()=>fs.writeFileSync(stateFile,JSON.stringify(state,null,2),{mode:0o600})
const slash=p=>p.replaceAll('\\','/')
let yaml=fs.readFileSync(path.join(root,'ops/compose/compose.prod.yaml'),'utf8').replaceAll('172.29.217',subnet)
// Match the single exact reverse-proxy address on this isolated network.
yaml=yaml.replace('SPRING_PROFILES_ACTIVE: prod',`SPRING_PROFILES_ACTIVE: prod\n      SERVER_TOMCAT_REMOTEIP_INTERNAL_PROXIES: '${subnet.replaceAll('.', '[.]')}[.]10'`)
yaml=yaml.replaceAll('./mysql/',slash(path.join(root,'ops/compose/mysql'))+'/').replaceAll('context: ../../backend','context: '+JSON.stringify(slash(path.join(root,'backend')))).replaceAll('context: ../../apps/admin','context: '+JSON.stringify(slash(path.join(root,'apps/admin'))))
fs.writeFileSync(path.join(home,'compose.yaml'),yaml)
const values={ADC_BACKEND_IMAGE:project+'/backend:local',ADC_ADMIN_IMAGE:project+'/admin:local',ADC_BACKEND_SECRETS_DIR:slash(path.join(home,'backend')),ADC_MYSQL_ROOT_PASSWORD_FILE:slash(path.join(home,'mysql-root')),ADC_MIGRATION_PASSWORD_FILE:slash(path.join(home,'migration')),ADC_TLS_CERTIFICATE_FILE:slash(path.join(home,'tls/localhost.crt')),ADC_TLS_PRIVATE_KEY_FILE:slash(path.join(home,'tls/localhost.key')),ADC_DOMAIN:'localhost',ADC_HTTPS_BIND:'127.0.0.1',ADC_HTTPS_PORT:port,ADC_HTTPS_ORIGIN_PORT_SUFFIX:':'+port,ADC_WECHAT_APP_ID:process.env.ADC_WECHAT_APP_ID||'wx0000000000000000',ADC_DEMO_PAYMENTS_ENABLED:'true',ADC_DEMO_PAYMENTS_CLINICS:project.startsWith('adc-teacher-')?'TEACHER-DEMO':'LOCAL-C1'}
fs.writeFileSync(path.join(home,'compose.env'),Object.entries(values).map(([k,v])=>k+'='+JSON.stringify(v)).join('\n')+'\n')
if(!fs.existsSync(values.ADC_TLS_PRIVATE_KEY_FILE))run(['run','--rm','--entrypoint','openssl','--mount',`type=bind,source=${path.join(home,'tls')},target=/fixture`,'eclipse-temurin@sha256:dff6eb46527bd293a3c06bbbe9e64e8c9f91f01905b5abbdad31761c03059d2c','req','-x509','-newkey','rsa:2048','-nodes','-keyout','/fixture/localhost.key','-out','/fixture/localhost.crt','-days','365','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost'])
run(['run','--rm','--entrypoint','chmod','--mount',`type=bind,source=${path.join(home,'tls')},target=/fixture`,'eclipse-temurin@sha256:dff6eb46527bd293a3c06bbbe9e64e8c9f91f01905b5abbdad31761c03059d2c','0444','/fixture/localhost.key'])
console.log('Building local Docker images and starting isolated MySQL, migrations and applications…')
// Build explicit source contexts; Compose Bake otherwise requests access outside .local-demo.
run(['build','--tag',values.ADC_BACKEND_IMAGE,'backend'])
run(['build','--tag',values.ADC_ADMIN_IMAGE,'apps/admin'])
run([...compose,'up','-d','--wait','--wait-timeout','300'])
async function step(key,work){if(Object.hasOwn(state.steps,key))return state.steps[key];const v=await work();state.steps[key]=v;save();return v}
function sql(text){return run([...compose,'exec','-T','mysql','sh','-ec','MYSQL_PWD="$(cat /run/secrets/mysql_root_password)" exec mysql --user=root --batch --skip-column-names'],{input:text})}
const ca=fs.readFileSync(values.ADC_TLS_CERTIFICATE_FILE)
function request(method,url,body,actor){return new Promise((resolve,reject)=>{const bytes=body===undefined?undefined:JSON.stringify(body);const req=https.request(origin+'/api/v1'+url,{method,ca,headers:{...(bytes?{'Content-Type':'application/json'}:{}),...(actor?{Origin:origin,Cookie:actor.cookie,'X-CSRF-Token':actor.csrf}:{}),...(actor?.key?{'Idempotency-Key':actor.key}:{})}},res=>{let text='';res.on('data',b=>text+=b);res.on('end',()=>{try{resolve({status:res.statusCode,headers:res.headers,data:text?JSON.parse(text):null})}catch(e){reject(e)}})});req.setTimeout(20000,()=>req.destroy(Error('API timeout; retain original request key')));req.on('error',reject);req.end(bytes)})}
async function login(account){const pre=await request('GET','/auth/csrf');assert.equal(pre.status,200);const r=await request('POST','/auth/staff-sessions',account,{cookie:pre.headers['set-cookie'].map(x=>x.split(';')[0]).join('; '),csrf:pre.data.csrf_token});assert.equal(r.status,200,JSON.stringify(r.data));return{cookie:r.headers['set-cookie'].find(x=>x.startsWith('adc_session=')).split(';')[0],csrf:r.data.csrf_token,subject:r.data.subject_id}}
async function command(actor,name,url,body,method='POST'){const c=state.requests[name]??={key:crypto.randomUUID(),url,body,method};save();assert.equal(c.url,url);const r=await request(c.method,c.url,c.body,{...actor,key:c.key});assert.equal(r.status,200,`${name}: ${JSON.stringify(r.data)}`);return r.data}
await step('clinic',()=>{assert.equal(sql('SELECT COUNT(*) FROM adc_business.Clinic;'),'0','Demo initialization requires an empty owned database');sql("INSERT INTO adc_business.Clinic VALUES (1,'LOCAL-C1','安德鲁牙科门店',NULL,'000',NULL,NULL,true,UTC_TIMESTAMP());");return true})
await step('bootstrap',()=>{fs.writeFileSync(path.join(home,'bootstrap-password'),state.bootstrap.password,{mode:0o600});fs.writeFileSync(path.join(home,'bootstrap.json'),JSON.stringify({username:state.bootstrap.username,staff_reference:'LOCAL_ADMIN_BOOTSTRAP',operator_reference:'ISOLATED_SYNTHETIC_ENVIRONMENT_ONLY',clinic_ids:['1'],capabilities:['account.manage','authorization.manage','resource.read','resource.write','analysis.read','cost.verify','performance.calculate','performance.publish','sensitive.drilldown','audit.read'],valid_until:null}));run([...compose,'run','--rm','--no-deps','--entrypoint','java','-v',`${home}:/run/demo:ro`,'-e','ADC_BOOTSTRAP_DB_PASSWORD_FILE=/run/secrets/spring.datasource.password','-e','ADC_BOOTSTRAP_PASSWORD_FILE=/run/demo/bootstrap-password','-e','ADC_BOOTSTRAP_INPUT_FILE=/run/demo/bootstrap.json','operator','-Xmx192m','-Dloader.main=com.adc.identity.bootstrap.HeadquartersBootstrap','-cp','/app/app.jar','org.springframework.boot.loader.launch.PropertiesLauncher']);return true})
const admin=await login(state.bootstrap)
const doctor=await step('doctor',()=>command(admin,'doctor','/dentists',{employee_number:'LOCAL-D1',full_name:'演示医生（虚构）',date_of_birth:'1980-01-02',phone:'000',hire_date:'2020-01-01',is_active:true}))
await step('assignment',()=>command(admin,'assignment',`/dentists/${doctor.dentist_id}/clinic-assignments`,{clinic_id:'1',start_date:'2020-01-01',end_date:null,is_active:true}))
const q=await step('qualification',()=>command(admin,'qualification','/qualifications',{qualification_name:'演示基础资质（虚构）',is_active:true}))
await step('certificate',()=>command(admin,'certificate',`/dentists/${doctor.dentist_id}/qualifications`,{qualification_id:q.qualification_id,certificate_number:'LOCAL-SYNTHETIC',granted_date:'2020-01-01',expiry_date:null,verification_status:'VERIFIED',verification_reference:'SYNTHETIC_NOT_REAL_CREDENTIAL'}))
const treatment=await step('treatment',()=>command(admin,'treatment','/treatments',{treatment_code:'DEMO-CHECK',treatment_name:'口腔检查',default_unit_price:'50.00',is_active:true}))
await step('requirements',()=>command(admin,'requirements',`/treatments/${treatment.treatment_id}/qualification-requirements`,{requirements:[{qualification_id:q.qualification_id,is_mandatory:true}]},'PUT'))
const manager=await step('manager',()=>command(admin,'manager','/identity/staff-accounts',{username:state.manager.username,staff_reference:'LOCAL_ADMIN',dentist_id:doctor.dentist_id}))
await step('password',()=>command(admin,'password',`/identity/staff-accounts/${manager.subject_id}/credential-recovery`,{verification_reference:'SYNTHETIC_LOCAL_OWNER_INITIALIZATION',reason:'本地应用管理员初始化',replacement_password:state.manager.password}))
const registry=fs.readFileSync(path.join(root,'apps/admin/src/api/grant-capabilities.ts'),'utf8'),caps=JSON.parse(registry.slice(registry.indexOf('=')+1).trim())
for(const role of ['HEADQUARTERS','RECEPTION','DENTIST','CASHIER'])await step('grant-'+role,()=>command(admin,'grant-'+role,'/identity/grants',{subject_id:manager.subject_id,role,clinic_ids:['1'],capabilities:caps[role],valid_from:new Date().toISOString(),valid_until:null}))
const actor=await login(state.manager)
// New dates are added through the real schedule API on each day, not fabricated by the patient UI.
for(let i=1;i<=7;i++){const day=new Date(Date.now()+8*3600000+i*86400000).toISOString().slice(0,10);await step('schedule-'+day,()=>command(actor,'schedule-'+day,'/schedules',{dentist_id:doctor.dentist_id,clinic_id:'1',schedule_date:day,start_time:'09:00:00',end_time:'12:00:00',slot_minutes:30,note:'出诊排班'}))}
for(const url of ['/me','/clinics','/dentists','/schedules?clinic_id=1','/appointments?clinic_id=1','/identity/grants'])assert.equal((await request('GET',url,undefined,actor)).status,200,url)
assert.equal((await request('GET','/me')).status,401)
fs.writeFileSync(path.join(home,'login.txt'),`安德鲁牙科连锁管理系统\n${origin}\n账号：${state.manager.username}\n密码：${state.manager.password}\n`,{mode:0o600})
console.log(JSON.stringify({ready:true,origin,project,credentials:'.local-demo/login.txt',real_mysql:true,real_wechat_login_verified:false,cloud_modified:false}))
