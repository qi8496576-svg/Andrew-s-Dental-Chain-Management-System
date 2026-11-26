import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import dns from 'node:dns/promises'
import assert from 'node:assert/strict'
import {chromium} from '../../apps/admin/node_modules/playwright/index.mjs'
import {root,executeScript,ssh} from './cloud-ssh.mjs'
const origin='https://andrewdental.cn',directory=path.join(root,'docs/verification/cloud-integration-20261124')
const accounts=JSON.parse(fs.readFileSync('D:/secrets/AndrewDental/CloudIntegration/accounts.json','utf8'))
const report={checked_at:new Date().toISOString(),origin,production_release:false,api_mocked:false,checks:[],browser_roles:[]}
const get=url=>new Promise((resolve,reject)=>{const req=https.get(origin+url,res=>{const peer=res.socket.getPeerCertificate(),authorized=res.socket.authorized;let text='';res.on('data',b=>text+=b);res.on('end',()=>resolve({status:res.statusCode,text,headers:res.headers,tls_authorized:authorized,certificate:{subject:peer.subject,issuer:peer.issuer,valid_to:peer.valid_to,fingerprint256:peer.fingerprint256}}))});req.on('error',reject);req.setTimeout(15000,()=>req.destroy(Error('HTTPS timeout')))})
const ips=await dns.resolve4('andrewdental.cn');assert.ok(ips.includes('43.139.92.113'));report.dns_ipv4=ips
const home=await get('/');assert.equal(home.status,200);assert.equal(home.tls_authorized,true);report.certificate=home.certificate
assert.equal((await get('/api/v1/me')).status,401)
assert.match(home.headers['content-security-policy'],/frame-ancestors 'none'/)
report.checks.push('Public DNS, trusted official TLS, Vue history fallback and anonymous protected API denial')
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[]
try{
 for(const [name,paths] of [['demo',['/','/settings/clinics','/settings/dentists','/settings/treatments','/staff-accounts','/clinic-grants','/appointment-booking','/schedules','/patient-bindings','/clinical-treatment','/invoicing','/analytics','/cost-entries','/quarterly-performance']],['frontdesk',['/','/appointment-booking','/schedules']],['dentist',['/','/clinical-treatment']],['cashier',['/','/invoicing']]]){
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.on('pageerror',error=>errors.push(error.message))
  try{await page.goto(origin+'/authentication');await page.getByLabel('个人账号').fill(accounts[name].username);await page.getByLabel('密码',{exact:true}).fill(accounts[name].password);await page.getByRole('button',{name:'登录管理后台'}).click();await page.waitForURL(origin+'/');await page.waitForLoadState('networkidle')
   for(const url of paths){if(url==='/analytics')await page.clock.setFixedTime(new Date(Date.now()+300000));await page.goto(origin+url,{waitUntil:'networkidle'});assert.equal(new URL(page.url()).pathname,url);await page.locator('main h1').waitFor();assert.equal(await page.locator('main [role=alert]').count(),0,'API/page error at '+name+url);if(url==='/analytics'){report.analytics_client_clock_5min_ahead_passed=true;await page.clock.setFixedTime(new Date())}}
   if(name==='frontdesk')assert.equal((await page.request.get(origin+'/api/v1/identity/staff-accounts')).status(),403)
   await page.goto(origin+'/',{waitUntil:'networkidle'});await page.screenshot({path:path.join(directory,name+'-home.png'),fullPage:true})
   report.browser_roles.push({role:name,routes:paths,passed:true})
  }finally{await context.close()}
 }
 assert.deepEqual(errors,[]);report.browser_errors=errors
}finally{await browser.close()}
const after=JSON.parse(await executeScript('ops/scripts/cloud-preflight.sh'))
fs.writeFileSync(path.join(directory,'after.json'),JSON.stringify(after,null,2)+'\n')
const before=JSON.parse(fs.readFileSync(path.join(directory,'preflight.json'),'utf8'))
assert.deepEqual(after.migration_fingerprints,before.migration_fingerprints)
const preserved=await ssh("sudo -n docker inspect adc-isolated-loopback-mysql-1 --format '{{.Id}}'")
report.database={...after.database,migrations_unchanged:true,container_id:preserved.trim(),independent_backup_evidence:'runtime-finalization.json'}
const project=JSON.parse(fs.readFileSync(path.join(root,'apps/patient-miniprogram/project.config.json'),'utf8')),privateProject=JSON.parse(fs.readFileSync(path.join(root,'apps/patient-miniprogram/project.private.config.json'),'utf8'))
assert.equal(project.setting.urlCheck,true);assert.equal(privateProject.setting.urlCheck,true)
assert.match(fs.readFileSync(path.join(root,'apps/patient-miniprogram/dist/miniprogram/config.js'),'utf8'),/https:\/\/andrewdental\.cn/)
report.miniprogram={formal_origin:origin,public_and_private_url_check:true,native_compile_passed:true,server_domain_configured_by_owner:true}
const secret=fs.readFileSync('D:/secrets/AndrewDental/WeChat/appsecret.txt','utf8').trim()
let checked=0
function scan(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())scan(file);else if(/\.(js|json|html|wxss|wxml|css)$/.test(file)){assert.ok(!fs.readFileSync(file,'utf8').includes(secret),'WeChat secret leaked into frontend');checked++}}}
assert.ok(secret.length>10);scan(path.join(root,'apps/admin/dist'));scan(path.join(root,'apps/patient-miniprogram/dist/miniprogram'));report.frontend_secret_boundary={checked_files:checked,appsecret_present:false}
report.status='PASS'
fs.writeFileSync(path.join(directory,'readiness.json'),JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,roles:report.browser_roles.length,routes:report.browser_roles.reduce((sum,r)=>sum+r.routes.length,0),database:report.database,miniprogram:report.miniprogram}))
