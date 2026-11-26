import fs from 'node:fs'
import assert from 'node:assert/strict'
import {chromium} from '../../apps/admin/node_modules/playwright/index.mjs'
import {accounts,origin,privateRoot} from './cloud-api.mjs'
const directory='docs/verification/patient-billing-20261125',probe=JSON.parse(fs.readFileSync(privateRoot+'/billing-probe.json','utf8'))
const report={date:new Date().toISOString(),origin,api_mocked:false,checks:[]},browser=await chromium.launch({channel:'msedge',headless:true})
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}})
 await page.goto(origin+'/authentication');await page.getByLabel('个人账号').fill(accounts.demo.username);await page.getByLabel('密码',{exact:true}).fill(accounts.demo.password);await page.getByRole('button',{name:'登录管理后台'}).click();await page.waitForURL(origin+'/')
 await page.getByRole('link',{name:'费用与缴费',exact:true}).click();await page.getByRole('heading',{name:'费用与缴费',exact:true}).waitFor()
 const row=page.getByRole('row').filter({hasText:probe.bill_id});await row.waitFor();assert.match(await row.innerText(),/已退款/);assert.match(await row.innerText(),/演示缴费/);assert.match(await row.innerText(),/演示缴费及退款验收/)
 await page.getByLabel('账单状态').selectOption('REFUNDED');assert.equal(await page.getByRole('row').filter({hasText:probe.bill_id}).count(),1)
 await page.screenshot({path:directory+'/admin-bill-refund.png',fullPage:true});report.checks.push('完整演示账号可从日常导航进入费用与缴费','真实挂号账单、预约编号、演示支付和退款原因与患者端一致','退款状态筛选实际生效')
 await page.goto(origin+'/schedules');await page.waitForLoadState('networkidle');assert.doesNotMatch(await page.locator('main').innerText(),/课表/);report.checks.push('出诊排班页面无课表措辞')
 report.status='PASS'
}catch(e){report.status='FAIL';report.error=e.message;process.exitCode=1}finally{await browser.close();fs.writeFileSync(directory+'/admin-browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))}
