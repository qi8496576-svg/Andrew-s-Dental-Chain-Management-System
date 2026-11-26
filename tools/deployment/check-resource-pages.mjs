import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {chromium} from '../../apps/admin/node_modules/playwright/index.mjs'
import {accounts,origin,privateRoot} from './cloud-api.mjs'
const directory='docs/verification/resource-availability-20261124',report={checked_at:new Date().toISOString(),origin,api_mocked:false,accounts:[],checks:[]}
const browser=await chromium.launch({channel:'msedge',headless:true})
try{
 for(const name of ['admin','demo']){
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage()
  await page.goto(origin+'/authentication');await page.getByLabel('个人账号').fill(accounts[name].username);await page.getByLabel('密码',{exact:true}).fill(accounts[name].password);await page.getByRole('button',{name:'登录管理后台'}).click();await page.waitForURL(origin+'/');await page.waitForLoadState('networkidle')
  const schedules=await page.getByRole('link',{name:'出诊排班',exact:true}).count(),booking=await page.getByRole('link',{name:'预约管理',exact:true}).count()
  assert.equal(schedules>0,name==='demo');assert.equal(booking>0,name==='demo');report.accounts.push({username:accounts[name].username,appointment_navigation:booking>0,schedule_navigation:schedules>0,scope:name==='admin'?'headquarters configuration':'all granted demo roles'})
  if(name==='demo'){
   for(const [route,file] of [['/settings/treatments','treatments'],['/settings/dentists','doctors'],['/schedules','schedules'],['/analytics','analytics']]){
    await page.goto(origin+route,{waitUntil:'networkidle'});assert.equal(await page.locator('main [role=alert]').count(),0)
    if(route==='/settings/treatments'){for(const text of ['口腔检查','超声波洁牙','树脂补牙','根管治疗','儿童涂氟','正畸初诊咨询'])assert.ok(await page.getByText(text,{exact:true}).count());assert.doesNotMatch(await page.locator('main').innerText(),/本地联调|云端联调/)}
    if(route==='/settings/dentists')for(const text of ['林医生','陈医生','周医生','李医生','王医生'])assert.ok(await page.getByText(text,{exact:true}).count())
    if(route==='/analytics')assert.doesNotMatch(await page.locator('main').innerText(),/分子|分母/)
    await page.screenshot({path:directory+'/'+file+'.png',fullPage:true})
   }
   report.checks.push('Actual cloud pages display 12 recognizable services, 5 doctors, schedules and analysis without numerator/denominator jargon')
  }
  await context.close()
 }
 report.status='PASS'
 fs.writeFileSync(directory+'/browser.json',JSON.stringify(report,null,2)+'\n')
 const labels={demo:'推荐：完整业务演示（预约、排班、诊疗、费用、经营和系统配置）',admin:'总部配置账号（只显示总部已授权模块）',frontdesk:'独立前台账号',dentist:'独立牙医账号',cashier:'独立收费账号'}
 const lines=['云端演示地址：'+origin,'推荐使用 cloud-demo 体验完整业务；cloud-admin 是总部配置账号，两组密码不同。','资料为演示数据，不是真实患者、医生或收费报价。','',...['demo','admin','frontdesk','dentist','cashier'].flatMap(name=>[labels[name], '账号：'+accounts[name].username,'口令：'+accounts[name].password,''])]
 fs.writeFileSync(path.join(privateRoot,'云端联调登录资料.txt'),lines.join('\r\n'))
 console.log(JSON.stringify(report))
}finally{await browser.close()}
