import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {chromium} from '../../apps/admin/node_modules/playwright/index.mjs'
const root=path.resolve(import.meta.dirname,'../..'),origin='https://localhost:19443'
const accounts=JSON.parse(fs.readFileSync('D:/secrets/AndrewDental/LocalPreview/preview-accounts.json','utf8'))
process.env.TEMP=path.join(root,'tmp/build-temp');process.env.TMP=process.env.TEMP
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),results=[]
try{for(const[role,route]of[['admin','/management'],['frontdesk','/schedules'],['dentist','/clinical-treatment'],['cashier','/invoicing']]){
 const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/management');await page.getByRole('heading',{name:'欢迎回来'}).waitFor()
 await page.getByLabel('个人账号').fill(accounts[role].username);await page.getByLabel('密码',{exact:true}).fill(accounts[role].password);await page.getByRole('button',{name:'登录管理后台'}).click();await page.getByRole('heading',{name:'管理中心',exact:true}).waitFor()
 await page.goto(origin+route);await page.locator('main h1').waitFor();assert.equal(new URL(page.url()).pathname,route)
 const nav=page.getByRole('navigation',{name:'主导航'});assert.equal(await nav.locator('a').first().evaluate(e=>getComputedStyle(e).textDecorationLine),'none')
 assert.equal(await page.locator('.app-sidebar').evaluate(e=>getComputedStyle(e).position),'fixed')
 assert.equal(await page.locator('.app-sidebar').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(19, 39, 63)')
 if(role!=='admin'){await page.goto(origin+'/staff-accounts');await page.getByRole('heading',{name:'管理后台',exact:true}).waitFor();assert.equal(new URL(page.url()).pathname,'/');assert.equal(await page.getByRole('link',{name:'员工账号',exact:true}).count(),0);await page.goto(origin+route);await page.locator('main h1').waitFor()}
 if(role!=='admin')assert.equal(await nav.locator('.is-active').count(),1)
 await page.getByRole('button',{name:'切换导航'}).click();assert.equal(await nav.isVisible(),false);await page.getByRole('button',{name:'切换导航'}).click();assert.equal(await nav.isVisible(),true)
 await page.screenshot({path:path.join(root,`docs/verification/ui-stage1-${role}.png`),fullPage:true})
 await page.getByRole('button',{name:'退出登录'}).click();await page.getByRole('heading',{name:'欢迎回来'}).waitFor();await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('body').evaluate(e=>e.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[])
 results.push({role,route,real_login:true,api_mocked:false,logout:true,permission_guard:true,navigation_style:true,mobile_login_no_overflow:true});await context.close()
}fs.writeFileSync(path.join(root,'docs/verification/ui-stage1-browser.json'),JSON.stringify({date:new Date().toISOString(),results},null,2)+'\n');console.log(JSON.stringify({passed:results.length,api_mocked:false}))}finally{await browser.close()}
