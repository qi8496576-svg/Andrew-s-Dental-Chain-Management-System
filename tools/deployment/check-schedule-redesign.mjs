import fs from 'node:fs'
import assert from 'node:assert/strict'
import {chromium} from '../../apps/admin/node_modules/playwright/index.mjs'
import {accounts,origin} from './cloud-api.mjs'
const directory='docs/verification/patient-onboarding-20261124';fs.mkdirSync(directory,{recursive:true})
const browser=await chromium.launch({channel:'msedge',headless:true}),report={at:new Date().toISOString(),origin,api_mocked:false,checks:[]}
try{
 const context=await browser.newContext({viewport:{width:1440,height:1040}}),page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 await page.goto(origin+'/authentication');await page.getByLabel('个人账号').fill(accounts.demo.username);await page.getByLabel('密码',{exact:true}).fill(accounts.demo.password);await page.getByRole('button',{name:'登录管理后台'}).click();await page.waitForURL(origin+'/')
 await page.goto(origin+'/schedules',{waitUntil:'networkidle'});await page.locator('.week-doctor').first().waitFor()
 assert.doesNotMatch(await page.locator('main').innerText(),/课表/);assert.equal(await page.locator('.week-day').count(),7)
 const weeklyIds=await page.locator('[data-schedule]').evaluateAll(elements=>elements.map(element=>element.dataset.schedule))
 assert.equal(weeklyIds.length,new Set(weeklyIds).size);assert.ok(weeklyIds.length>=50)
 const weeklyTimes=await page.locator('.agenda-time').evaluateAll(elements=>elements.map(element=>({text:element.textContent,width:element.clientWidth,scroll:element.scrollWidth})))
 assert.ok(weeklyTimes.every(time=>time.width>=time.scroll));await page.screenshot({path:directory+'/schedule-week.png',fullPage:true})
 await page.locator('.agenda-shift').first().click();await page.getByRole('dialog',{name:'出诊班次详情'}).waitFor();assert.ok(await page.getByRole('button',{name:'办理停诊',exact:true}).count());await page.getByRole('button',{name:'关闭',exact:true}).click()
 await page.getByRole('button',{name:'2026-11-25 查看日视图'}).click();await page.waitForLoadState('networkidle');await page.locator('.shift-card').first().waitFor()
 assert.equal(await page.locator('.day-heading').count(),5)
 const positions=await page.locator('.shift-card').evaluateAll(elements=>elements.map(element=>({width:element.getBoundingClientRect().width,text:element.textContent})))
 assert.ok(positions.every(position=>position.width>=180));await page.screenshot({path:directory+'/schedule-day.png',fullPage:true})
 const doctor=page.getByLabel('排班医生',{exact:true});const options=await doctor.locator('option').allTextContents();const selected=options.find(name=>name==='林医生');assert.ok(selected);await doctor.selectOption({label:selected});await page.locator('.day-heading').first().waitFor();assert.equal(await page.locator('.day-heading').count(),1)
 await page.getByRole('button',{name:'新增出诊班次',exact:true}).click();await page.getByRole('dialog',{name:'新增出诊班次'}).waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'新增出诊班次'}).waitFor({state:'hidden'})
 await doctor.selectOption('');await page.waitForLoadState('networkidle');await page.setViewportSize({width:1024,height:900});await page.locator('.shift-card').first().waitFor()
 assert.ok((await page.locator('.shift-card').first().boundingBox()).width>=180);await page.screenshot({path:directory+'/schedule-narrow.png',fullPage:true})
 assert.deepEqual(errors,[]);assert.equal(await page.locator('main [role=alert]').count(),0)
 report.checks=['Real cloud week contains all schedule IDs once','All week time labels fit one line','Day view has five readable doctor columns','Date view, doctor filter, details, suspend entry and create form work','1024px layout retains readable columns'];report.status='PASS';report.weekly_shifts=weeklyIds.length;report.minimum_day_card_width=Math.min(...positions.map(position=>position.width))
}catch(error){report.status='FAIL';report.error=error.message;process.exitCode=1}finally{await browser.close();fs.writeFileSync(directory+'/schedule-browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))}
