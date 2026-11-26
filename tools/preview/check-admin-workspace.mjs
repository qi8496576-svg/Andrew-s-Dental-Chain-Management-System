import fs from 'node:fs'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {chromium} from '../../apps/admin/node_modules/playwright/index.mjs'
const origin='https://localhost:19443',privateRoot='D:/secrets/AndrewDental/LocalPreview',directory='docs/verification/admin-workspace'
fs.mkdirSync(directory,{recursive:true})
assert.equal(JSON.parse(fs.readFileSync(privateRoot+'/preview-state.json','utf8')).purpose,'owned-local-synthetic-preview-only')
const account=JSON.parse(fs.readFileSync(privateRoot+'/admin-demo-state.json','utf8')),ordinary=JSON.parse(fs.readFileSync(privateRoot+'/preview-accounts.json','utf8')).frontdesk
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1536,height:1050}}),page=await context.newPage(),errors=[],checks=[]
page.on('pageerror',e=>errors.push(e.message))
const result={date:new Date().toISOString(),origin,real_mysql:true,api_mocked:false,checks,fixtures:{},status:'RUNNING'}
const save=()=>fs.writeFileSync(directory+'/results.json',JSON.stringify(result,null,2)+'\n')
async function step(name,work){console.log(name);await work();checks.push(name);save()}
async function login(web,credentials){await web.goto(origin+'/authentication');await web.getByLabel('个人账号').fill(credentials.username);await web.getByLabel('密码',{exact:true}).fill(credentials.password);await web.getByRole('button',{name:'登录管理后台'}).click();await web.getByRole('heading',{name:'管理后台',exact:true}).waitFor();await web.waitForLoadState('networkidle')}
async function goto(path){await page.goto(origin+path,{waitUntil:'networkidle'});assert.equal(new URL(page.url()).pathname,path.split('?')[0]);assert.equal(await page.locator('main [role=alert]').count(),0)}
const dialog=()=>page.getByRole('dialog').filter({has:page.locator('form')})
async function saveResource(){await dialog().getByRole('button',{name:'确认保存资源',exact:true}).click();await dialog().waitFor({state:'hidden'});await page.waitForLoadState('networkidle');assert.equal(await page.locator('main [role=alert]').count(),0)}
let secondary
try{
 await login(page,account)
 await step('Daily navigation and system configuration have no shared destinations',async()=>{
  const links=await page.getByRole('navigation',{name:'主导航',exact:true}).locator('a').evaluateAll(a=>a.map(x=>x.getAttribute('href')))
  assert.ok(!links.some(x=>x.startsWith('/settings')||['/staff-accounts','/clinic-grants','/organization-resources','/management'].includes(x)))
  assert.equal(links.length,12)
 })
 await step('Gear opens, toggles closed, supports Escape and closes on outside click',async()=>{
  const trigger=page.getByRole('button',{name:'打开管理中心',exact:true})
  await trigger.click();await page.getByRole('dialog',{name:'系统管理与基础配置',exact:true}).waitFor();await trigger.click();assert.equal(await page.getByRole('dialog').count(),0)
  await trigger.click();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await trigger.evaluate(e=>e===document.activeElement),true)
  await trigger.click();await page.getByRole('heading',{name:'管理后台',exact:true}).click();assert.equal(await page.getByRole('dialog').count(),0)
  await trigger.click();await page.screenshot({path:directory+'/gear-menu.png'});await page.keyboard.press('Escape')
 })
 const destinations=[['诊所管理','clinics'],['医生与执业资质','dentists'],['治疗项目与价格目录','treatments'],['专业资质目录','qualifications'],['过敏与服务基础资料','allergies']]
 await step('Five independent resource pages support direct navigation, breadcrumbs and refresh',async()=>{
  for(const [label,kind] of destinations){await page.getByRole('button',{name:'打开管理中心',exact:true}).click();await page.getByRole('dialog',{name:'系统管理与基础配置'}).getByRole('link',{name:label,exact:true}).click();await page.waitForURL(origin+'/settings/'+kind);await page.getByRole('heading',{name:label,exact:true}).waitFor();await page.waitForLoadState('networkidle');assert.equal(await page.locator('.resource-tabs').count(),0);assert.ok(await page.getByRole('navigation',{name:'当前位置'}).getByRole('link',{name:'系统管理',exact:true}).count());await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('main [role=alert]').count(),0)}
 })
 const suffix=Date.now().toString(),qualification='本机管理验收资质 '+suffix,treatment='本机管理验收项目 '+suffix,dentist='本机验收牙医 '+suffix
 await step('Qualification creates through the real form and persists after reload',async()=>{
  await goto('/settings/qualifications');await page.getByRole('button',{name:'新建专业资质',exact:true}).click();await dialog().getByLabel('资质名称',{exact:true}).fill(qualification);await saveResource();await page.reload({waitUntil:'networkidle'});await page.getByRole('row').filter({hasText:qualification}).getByRole('button',{name:'查看详情',exact:true}).click();await page.getByRole('heading',{name:qualification,exact:true}).waitFor()
 })
 await step('Treatment creation and mandatory qualification use stored relationships',async()=>{
  await goto('/settings/treatments');await page.getByRole('button',{name:'新建治疗项目',exact:true}).click();await dialog().getByLabel('治疗代码',{exact:true}).fill('UI-'+suffix);await dialog().getByLabel('治疗名称',{exact:true}).fill(treatment);await dialog().getByLabel('默认单位价格',{exact:true}).fill('168.00');await saveResource();await page.getByRole('button',{name:'维护治疗要求',exact:true}).click();await dialog().getByLabel(qualification,{exact:true}).check();await dialog().locator('.requirement-option').filter({hasText:qualification}).getByLabel('作为必需资质',{exact:true}).check();await saveResource();assert.ok((await page.locator('.requirement-list').innerText()).includes(qualification));await page.screenshot({path:directory+'/treatments.png',fullPage:true})
 })
 await step('Doctor creation, certificate verification and clinic assignment persist',async()=>{
  await goto('/settings/dentists');await page.getByRole('button',{name:'新建牙医',exact:true}).click();await dialog().getByLabel('员工编号',{exact:true}).fill('UI-D'+suffix);await dialog().getByLabel('姓名',{exact:true}).fill(dentist);await dialog().getByLabel('出生日期',{exact:true}).fill('1985-01-01');await dialog().getByLabel('联系电话',{exact:true}).fill('000');await dialog().getByLabel('入职日期',{exact:true}).fill('2020-01-01');await saveResource();await page.getByRole('button',{name:'登记专业资质',exact:true}).click();await dialog().getByLabel('专业资质',{exact:true}).selectOption({label:qualification});await dialog().getByLabel('证书编号',{exact:true}).fill('SYNTHETIC-'+suffix);await dialog().getByLabel('证书授予日期',{exact:true}).fill('2020-01-01');await dialog().getByLabel('证书核验状态',{exact:true}).selectOption('VERIFIED');await dialog().getByLabel('专业资质核验依据',{exact:true}).fill('LOCAL_SYNTHETIC_CERTIFICATE_ONLY');await dialog().getByRole('checkbox',{name:/已核对证书/}).check();await saveResource();await page.getByRole('button',{name:'新增执业记录',exact:true}).click();await dialog().getByLabel('执业诊所',{exact:true}).selectOption('1');await dialog().getByLabel('执业开始日期',{exact:true}).fill('2020-01-01');await dialog().getByLabel('出诊可用说明',{exact:true}).fill('本机虚构功能验收');await saveResource();await page.reload({waitUntil:'networkidle'});await page.getByRole('row').filter({hasText:dentist}).getByRole('button',{name:'查看详情'}).click();await page.getByText('SYNTHETIC-'+suffix,{exact:true}).waitFor();await page.screenshot({path:directory+'/doctor.png',fullPage:true})
 })
 await step('A newly created unreferenced catalog item can be disabled and filtered',async()=>{
  await goto('/settings/allergies');await page.getByRole('button',{name:'新建过敏目录项',exact:true}).click();const label='本机验收目录 '+suffix;await dialog().getByLabel('过敏症名称',{exact:true}).fill(label);await saveResource();await page.getByRole('button',{name:'维护基本资料',exact:true}).click();await dialog().getByLabel('启用',{exact:true}).uncheck();await saveResource();await page.getByRole('button',{name:'返回列表'}).click();await page.locator('.resource-list select').selectOption('inactive');await page.getByRole('row').filter({hasText:label}).getByText('停用',{exact:true}).waitFor()
 })
 let subject,password=crypto.randomBytes(24).toString('base64url'),username='ui-check-'+suffix
 await step('Staff account and verified password management perform real writes',async()=>{
  await goto('/staff-accounts');await page.getByRole('button',{name:'建立员工账号',exact:true}).click();await dialog().getByLabel('个人账号',{exact:true}).fill(username);await dialog().getByLabel('工作人员核实依据',{exact:true}).fill('LOCAL_SYNTHETIC_STAFF_ONLY');await dialog().getByRole('checkbox',{name:'已核实该员工身份及本次操作依据',exact:true}).check();await dialog().getByRole('button',{name:'确认办理',exact:true}).click();await dialog().waitFor({state:'hidden'});const row=page.getByRole('row').filter({hasText:username});subject=(await row.locator('td').nth(2).innerText()).trim();result.fixtures.staff_subject=subject;result.fixtures.staff_username=username;await row.getByRole('button',{name:'密码管理',exact:true}).click();await dialog().getByLabel('操作原因',{exact:true}).fill('本机虚构员工验收');await dialog().getByLabel('身份核验记录或工单编号',{exact:true}).fill('LOCAL_SYNTHETIC_STAFF_ONLY');await dialog().getByLabel('新密码',{exact:true}).fill(password);await dialog().getByRole('checkbox',{name:'已核实该员工身份及本次操作依据',exact:true}).check();await dialog().getByRole('button',{name:'确认办理',exact:true}).click();await dialog().waitFor({state:'hidden'})
 })
 await step('Per-user role grant is real and unauthorized account API returns 403',async()=>{
  await goto('/clinic-grants');await page.getByRole('button',{name:'建立授权',exact:true}).click();await dialog().getByLabel('员工主体标识',{exact:true}).fill(subject);await dialog().getByLabel('岗位',{exact:true}).selectOption('RECEPTION');await dialog().getByLabel('诊所 1',{exact:true}).check();await dialog().getByLabel('查看预约列表',{exact:true}).check();await dialog().getByLabel('结束时点（可空，上海）',{exact:true}).fill(new Date(Date.now()+32*3600000).toISOString().slice(0,16));await dialog().getByLabel('已核对本次岗位、诊所及权限变更依据',{exact:true}).check();await dialog().getByRole('button',{name:'确认授权变更',exact:true}).click();await dialog().waitFor({state:'hidden'});await page.waitForLoadState('networkidle')
  secondary=await browser.newContext({ignoreHTTPSErrors:true});const limited=await secondary.newPage();await login(limited,{username,password});assert.equal(await limited.getByRole('button',{name:'打开管理中心'}).count(),0);const forbidden=await limited.request.get(origin+'/api/v1/identity/staff-accounts');assert.equal(forbidden.status(),403);result.restricted_account_api_status=forbidden.status();await limited.goto(origin+'/settings/dentists');await limited.getByRole('heading',{name:'管理后台',exact:true}).waitFor();assert.equal(new URL(limited.url()).pathname,'/')
  await limited.goto(origin+'/appointment-booking',{waitUntil:'networkidle'});await limited.getByRole('heading',{name:'预约管理',exact:true}).waitFor();assert.equal(await limited.locator('main [role=alert]').count(),0);assert.equal(await limited.getByRole('button',{name:'确认创建预约',exact:true}).count(),0);assert.equal(await limited.getByRole('button',{name:'查询可约时段',exact:true}).count(),0);await limited.getByRole('button',{name:'刷新当日预约',exact:true}).click();await limited.waitForLoadState('networkidle');assert.equal(await limited.locator('main [role=alert]').count(),0);result.list_only_reception_page_passed=true
  await page.getByLabel('员工主体标识筛选',{exact:true}).fill(subject);await page.getByRole('button',{name:'筛选 / 刷新',exact:true}).click();await page.waitForLoadState('networkidle');await page.getByRole('row').filter({hasText:subject}).getByRole('button',{name:'撤销',exact:true}).click();await dialog().getByLabel('撤销原因',{exact:true}).fill('本机验收完成，撤销临时权限');await dialog().getByLabel('已核对本次岗位、诊所及权限变更依据',{exact:true}).check();await dialog().getByRole('button',{name:'确认授权变更',exact:true}).click();await dialog().waitFor({state:'hidden'});const revoked=await limited.request.get(origin+'/api/v1/appointments?clinic_id=1');assert.equal(revoked.status(),403);result.revoked_session_next_request_status=revoked.status()
 })
 await step('All existing daily routes remain accessible to the legitimately granted admin',async()=>{
  for(const path of ['/','/patients','/appointment-booking','/schedules','/patient-bindings','/appointment-attendance','/appointment-cancellation','/appointment-no-show','/appointment-rescheduling','/clinical-treatment','/treatment-price-correction','/invoicing','/invoice-sources','/analytics','/cost-entries','/quarterly-performance']){await goto(path);await page.locator('main h1').waitFor()}
  await goto('/');await page.screenshot({path:directory+'/home.png',fullPage:true});assert.deepEqual(errors,[])
 })
 await step('Ordinary reception remains restricted by both routing and server authorization',async()=>{
  const restricted=await browser.newContext({ignoreHTTPSErrors:true}),web=await restricted.newPage();try{await login(web,ordinary);assert.equal(await web.getByRole('button',{name:'打开管理中心'}).count(),0);assert.equal((await web.request.get(origin+'/api/v1/identity/staff-accounts')).status(),403)}finally{await restricted.close()}
 })
 result.status='PASS';result.fixtures={...result.fixtures,qualification,treatment,dentist};save();console.log(JSON.stringify({status:result.status,checks:checks.length,errors:errors.length}))
}catch(error){result.status='FAIL';result.failure=error.message;save();throw error}finally{if(secondary)await secondary.close();await browser.close()}


