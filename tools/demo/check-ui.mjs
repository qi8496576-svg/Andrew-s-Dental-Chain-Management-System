import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {chromium} from '../../apps/admin/node_modules/playwright/index.mjs'
const root=path.resolve(import.meta.dirname,'../..'),state=JSON.parse(fs.readFileSync(path.join(root,'.local-demo/state.json'),'utf8'))
assert.equal(state.purpose,'owned-local-application')
const origin='https://localhost:'+(process.env.ADC_DEMO_PORT||'19444')
const report={checked_at:new Date().toISOString(),origin,api_mocked:false,pages:[],errors:[],service_errors:[]}
const browser=await chromium.launch({headless:true,...(process.env.ADC_BROWSER_CHANNEL?{channel:process.env.ADC_BROWSER_CHANNEL}:{})})
try{
 const page=await browser.newPage({ignoreHTTPSErrors:true}) // Only this owned localhost context uses the generated self-signed certificate.
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.url().includes('/api/v1/')&&r.status()>=500)report.service_errors.push({path:new URL(r.url()).pathname,status:r.status()})})
 await page.goto(origin+'/authentication');await page.getByLabel('个人账号').fill(state.manager.username);await page.getByLabel('密码',{exact:true}).fill(state.manager.password);await page.getByRole('button',{name:'登录管理后台'}).click();await page.waitForURL(origin+'/')
 for(const route of ['/appointment-booking','/schedules','/patients','/clinical-treatment','/invoicing','/patient-bills','/quarterly-performance','/analytics','/management']){await page.goto(origin+route,{waitUntil:'networkidle'});assert.equal(new URL(page.url()).pathname,route);assert.ok((await page.locator('main').innerText()).trim().length>20);report.pages.push({route,title:await page.title()})}
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.service_errors,[]);report.status='PASS'
}catch(e){report.status='FAIL';report.error=e.message;process.exitCode=1}finally{await browser.close();fs.mkdirSync(path.join(root,'tmp/reproduction'),{recursive:true});fs.writeFileSync(path.join(root,'tmp/reproduction/browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))}
