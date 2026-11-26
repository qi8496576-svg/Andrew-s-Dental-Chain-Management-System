import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {chromium} from '../../apps/admin/node_modules/playwright/index.mjs'
const root=path.resolve(import.meta.dirname,'../..'),privateRoot='D:/secrets/AndrewDental/LocalPreview',credentials=JSON.parse(fs.readFileSync(path.join(privateRoot,'preview-accounts.json'),'utf8')),state=JSON.parse(fs.readFileSync(path.join(root,'docs/verification/local-preview.json'),'utf8'))
assert.equal(state.ready,true);assert.equal(state.url,'https://localhost:19443');process.env.TEMP=path.join(root,'tmp/build-temp');process.env.TMP=process.env.TEMP
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[]
try{
  for(const [role,route] of [['admin','/organization-resources'],['frontdesk','/schedules'],['dentist','/clinical-treatment'],['cashier','/invoicing']]){
    const context=await browser.newContext({ignoreHTTPSErrors:true}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message))
    try{await page.goto(state.url+'/authentication');await page.getByLabel('个人账号').fill(credentials[role].username);await page.getByLabel('密码',{exact:true}).fill(credentials[role].password);await page.getByRole('button',{name:'登录管理后台'}).click();await page.getByRole('heading',{name:'管理后台',exact:true}).waitFor();await page.goto(state.url+route);await page.getByRole('main').getByRole('heading',{level:1}).waitFor();assert.equal(new URL(page.url()).pathname,route);if(role==='admin'){await page.locator('.resource-list button').filter({hasText:'LOCAL-PREVIEW-C1'}).click();await page.getByRole('heading',{name:'LOCAL-PREVIEW-C1',exact:true}).waitFor();}if(role==='frontdesk'){await page.locator('.shift-card').first().waitFor();assert.equal(await page.locator('.shift-card').count(),1);}assert.deepEqual(errors,[]);if(['admin','frontdesk'].includes(role))await page.screenshot({path:path.join(root,`docs/verification/local-preview-${role}.png`),fullPage:true});await page.getByRole('button',{name:'退出登录'}).click();await page.getByRole('heading',{name:'欢迎回来'}).waitFor();results.push({role,route,real_browser_login_and_page:true,logout_verified:true})}finally{await context.close()}
  }
  fs.writeFileSync(path.join(root,'docs/verification/local-preview-browser.json'),JSON.stringify({date:new Date().toISOString(),url:state.url,real_mysql:true,api_mocked:false,local_self_signed_certificate:true,real_wechat_verified:false,results},null,2)+'\n');console.log(JSON.stringify({local_preview_browser_roles_verified:results.length,api_mocked:false,real_wechat_verified:false}))
}finally{await browser.close()}

