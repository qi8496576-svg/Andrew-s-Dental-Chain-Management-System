import fs from 'node:fs'
import assert from 'node:assert/strict'
import {chromium} from '../../apps/admin/node_modules/playwright/index.mjs'
const origin='https://andrewdental.cn',report={checked_at:new Date().toISOString(),origin,api_mocked:false,checks:[],pages:[],errors:[],service_errors:[]}
const browser=await chromium.launch({channel:'msedge',headless:true})
try{
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],viewport:{width:1440,height:1040}})
 const page=await context.newPage()
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.url().includes('/api/v1/')&&r.status()>=500)report.service_errors.push({path:new URL(r.url()).pathname,status:r.status()})})
 await page.goto(origin+'/authentication')
 assert.equal(await page.getByText('体验演示系统',{exact:true}).count(),0)
 assert.equal(await page.getByText('虚构业务数据',{exact:true}).count(),0)
 await page.getByRole('button',{name:'复制账号',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'admin-demo')
 await page.getByRole('button',{name:'复制密码',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'adl123456')
 report.checks.push('公开账号和密码可复制，登录页无额外体验宣传文字')
 await page.screenshot({path:'tmp/public-admin-login.png',fullPage:true})
 await page.getByRole('button',{name:'填入账号和密码',exact:true}).click()
 assert.equal(await page.getByLabel('个人账号').inputValue(),'admin-demo');assert.equal(await page.getByLabel('密码',{exact:true}).inputValue(),'adl123456')
 await page.getByRole('button',{name:'登录管理后台',exact:true}).click();await page.waitForURL(origin+'/')
 report.checks.push('一键填入及真实HTTPS登录通过')
 for(const route of ['/appointment-booking','/schedules','/patients','/clinical-treatment','/invoicing','/patient-bills','/quarterly-performance','/analytics','/management']){
  await page.goto(origin+route,{waitUntil:'networkidle'});assert.equal(new URL(page.url()).pathname,route);assert.ok((await page.locator('main').innerText()).trim().length>20);report.pages.push({route,title:await page.title()})
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.service_errors,[]);report.status='PASS'
}catch(e){report.status='FAIL';report.error=e.message;process.exitCode=1}finally{
 await browser.close();fs.writeFileSync('docs/verification/unified-admin-browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
}
