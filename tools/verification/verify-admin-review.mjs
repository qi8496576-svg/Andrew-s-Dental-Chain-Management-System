import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'

const root=path.resolve(import.meta.dirname,'../..'),origin='https://localhost:19443',output=path.join(root,'docs/verification/admin-review-20261123')
const require=createRequire(path.join(root,'apps/admin/package.json')),{chromium}=require('@playwright/test')
const accounts=JSON.parse(fs.readFileSync('D:/secrets/AndrewDental/LocalPreview/preview-accounts.json','utf8'))
const browser=await chromium.launch({channel:'msedge',headless:true})
const evidence={at:new Date().toISOString(),url:origin,read_only_business_checks:true,roles:[],browser_errors:[],production_deployed:false}
const roleCodes={admin:'HEADQUARTERS',frontdesk:'RECEPTION',dentist:'DENTIST',cashier:'CASHIER'}
try{
 for(const key of Object.keys(roleCodes)){
  const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1440,height:900}}),page=await context.newPage()
  page.on('pageerror',error=>evidence.browser_errors.push(key+': '+error.message))
  await page.goto(origin+'/authentication');await page.getByLabel('个人账号').fill(accounts[key].username);await page.getByLabel('密码',{exact:true}).fill(accounts[key].password);await page.getByRole('button',{name:'登录管理后台'}).click();await page.waitForURL(origin+'/')
  const role=roleCodes[key],from='2026-11-23T00:00:00+08:00',until='2026-11-24T00:00:00+08:00'
  const summary=await context.request.get(origin+'/api/v1/workspace/summary?'+new URLSearchParams({role,start:from,end:until}));assert.equal(summary.status(),200,key+' full summary');const sum=await summary.json();assert.ok(Array.isArray(sum.states))
  const record={role,summary_status:summary.status(),theme_primary:await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()),routes:[]}
  assert.equal(record.theme_primary,'#17778b')
  if(key!=='admin'){
   const list=await context.request.get(origin+'/api/v1/workspace/appointments?'+new URLSearchParams({role,limit:'100'}));assert.equal(list.status(),200,key+' authorized identity projection');const data=await list.json();for(const item of data.items){assert.ok(item.patient_number);assert.ok(item.patient_name);assert.equal(item.phone,undefined);assert.equal(item.problems_or_special_needs,undefined)}
   record.list_status=list.status();record.visible_rows=data.items.length
   if(key==='cashier'){
    const spoof=await context.request.get(origin+'/api/v1/workspace/appointments?role=DENTIST');assert.equal(spoof.status(),403);record.role_spoof_rejected=true
    const completed=data.items.find(r=>r.status==='COMPLETED');if(completed){const preview=await context.request.get(origin+`/api/v1/appointments/${completed.appointment_id}/fee-preview`);assert.equal(preview.status(),200);record.fee_preview='verified'}else record.fee_preview='No completed visit in persistent preview; covered by isolated integration test'
   }
  }else{
   const source=await context.request.get(origin+'/api/v1/workspace/applied-treatments?limit=50');assert.equal(source.status(),200);record.cost_association_status=source.status()
   const resource=await context.request.get(origin+'/api/v1/treatments?q='+encodeURIComponent('检查'));assert.equal(resource.status(),200);record.resource_search_status=resource.status()
   const grants=await context.request.get(origin+'/api/v1/identity/grants?limit=100');assert.equal(grants.status(),200);const grantPage=await grants.json();assert.ok(grantPage.items.length>0);assert.ok(grantPage.items.every(r=>Array.isArray(r.capabilities)));assert.ok(grantPage.items.some(r=>r.capabilities.length>0));record.grant_capabilities_verified=true
  }
  const routes=key==='admin'?['/','/quarterly-performance','/cost-entries','/analytics','/settings/treatments','/clinic-grants']:key==='frontdesk'?['/','/appointment-booking','/schedules','/patients']:key==='dentist'?['/','/clinical-treatment']:['/','/invoicing']
  for(const route of routes){await page.goto(origin+route);await page.waitForLoadState('networkidle');const main=page.locator('main');assert.ok((await main.innerText()).length>20);assert.equal(await page.getByRole('heading',{name:'页面不存在'}).count(),0);assert.equal(new URL(page.url()).pathname,route);await page.screenshot({path:path.join(output,`live-${key}-${route==='/'?'home':route.slice(1).replaceAll('/','-')}.png`),fullPage:true});record.routes.push(route)}
  evidence.roles.push(record);await context.close()
 }
 assert.deepEqual(evidence.browser_errors,[])
 fs.writeFileSync(path.join(output,'live-verification.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence))
}finally{await browser.close()}
