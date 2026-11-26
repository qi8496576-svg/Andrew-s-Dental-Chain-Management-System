import {test,expect,type Page} from '@playwright/test'
import {grantCapabilities} from '../../src/api/grant-capabilities'
const appointment=(id='11',name='陈女士（测试）')=>({appointment_id:id,patient_id:'31',clinic_id:'1',dentist_id:'21',schedule_id:'41',scheduled_at:'2026-11-23T01:00:00Z',status:'SCHEDULED',attended_at:null,completed_at:null,cancellation_kind:null,rescheduled_from_id:null,invoice_id:null,patient_name:name,patient_number:'P-TEST-001',dentist_name:'王医生（测试）',clinic_name:'TH',requested_treatments:'常规检查'})
async function fixture(page:Page,role='RECEPTION'){
 const unexpected:string[]=[]
 page.on('pageerror',e=>unexpected.push(e.message))
 await page.route('**/api/v1/**',async route=>{
  const url=new URL(route.request().url()),path=url.pathname;let data:unknown={items:[],next_cursor:null}
  if(path==='/api/v1/me')data={subject_id:'test-staff',subject_type:'STAFF',roles:[role],capabilities:grantCapabilities[role],clinic_scope:['1'],binding:null}
  else if(path.endsWith('/auth/csrf'))data={csrf_token:'test-csrf'}
  else if(path.endsWith('/clinics'))data={items:[{id:'1',label:'TH · 天河诊所',code:'TH',active:true}],next_cursor:null}
  else if(path.endsWith('/dentists'))data={items:[{id:'21',label:'王医生（测试）',active:true}],next_cursor:null}
  else if(path.endsWith('/treatments'))data={items:[{id:'51',label:'常规检查',active:true,current_price:'150.00'}],next_cursor:null}
  else if(path.endsWith('/workspace/summary'))data={states:[{status:'SCHEDULED',count:105},{status:'IN_PROGRESS',count:1},{status:'COMPLETED',count:1}]}
  else if(path.endsWith('/workspace/appointments'))data={items:[{...appointment(),status:url.searchParams.get('status')||'SCHEDULED'}],next_cursor:null}
  else if(path.endsWith('/clinical-context'))data={appointment:{...appointment(),status:'IN_PROGRESS'},patient_allergy_review_status:'RECORDED',problems_or_special_needs:'已核实本次诊疗需求。',allergy_records:[{allergy_id:'1',allergy_name:'青霉素（测试）',severity_note:'需关注',is_retracted:false}],applied_treatments:[{applied_treatment_id:'61',treatment_id:'51',dentist_id:'21',standard_units:'1.00',unit_price:'150.00',subtotal:'150.00',performed_at:'2026-11-23T01:10:00Z'}]}
  else if(path.endsWith('/fee-preview'))data={appointment_id:'11',patient_name:'陈女士（测试）',patient_number:'P-TEST-001',clinic_name:'TH',items:[{treatment_name:'常规检查',standard_units:'1.00',unit_price:'150.00',subtotal:'150.00'}],total_amount:'150.00'}
  await route.fulfill({status:200,contentType:'application/json',headers:{ETag:'"test-etag"'},body:JSON.stringify(data)})
 })
 return unexpected
}
for(const role of ['HEADQUARTERS','RECEPTION','DENTIST','CASHIER'])test(`single-role home ${role}`,async({page})=>{const errors=await fixture(page,role);await page.goto('/');await expect(page.getByRole('heading',{name:'把今天的工作，安排清楚'})).toBeVisible();await expect(page.locator('.dashboard-stats').getByText('107',{exact:true})).toBeVisible();expect(errors).toEqual([]);await page.screenshot({path:`../../docs/verification/admin-review-20261123/home-${role}.png`,fullPage:true})})
for(const width of [390,768,1024,1280,1440])test(`appointment layout and navigation ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});const errors=await fixture(page);await page.goto('/appointment-booking');await expect(page.getByText('陈女士（测试）',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'＋ 新建预约'})).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
 await expect(page.locator('.app-sidebar')).toBeVisible({visible:width>=1280})
 if(width<1280){await page.getByRole('button',{name:'切换导航'}).click();await expect(page.locator('.app-sidebar')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('.app-sidebar')).toBeHidden();await expect(page.getByRole('button',{name:'切换导航'})).toBeFocused()}
 await page.screenshot({path:`../../docs/verification/admin-review-20261123/appointments-${width}.png`,fullPage:true})
 await page.getByRole('button',{name:'＋ 新建预约'}).click();await expect(page.getByRole('dialog',{name:'新建预约'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();expect(errors).toEqual([])
})
test('last date request wins and stale rows disappear immediately',async({page})=>{
 await fixture(page);await page.goto('/appointment-booking');await expect(page.getByText('陈女士（测试）',{exact:true})).toBeVisible()
 let release:(()=>void)|undefined
 await page.route('**/api/v1/workspace/appointments?**',async route=>{const date=new URL(route.request().url()).searchParams.get('start');if(date?.startsWith('2026-11-24'))await new Promise<void>(resolve=>{release=resolve});await route.fulfill({json:{items:[appointment(date?.startsWith('2026-11-24')?'12':'13',date?.startsWith('2026-11-24')?'旧日期患者':'最新日期患者')],next_cursor:null}})})
 await page.getByLabel('预约日期',{exact:true}).fill('2026-11-24');await expect(page.getByText('陈女士（测试）',{exact:true})).toBeHidden();await expect.poll(()=>!!release).toBeTruthy();await page.getByLabel('预约日期',{exact:true}).fill('2026-11-25');await expect(page.getByText('最新日期患者',{exact:true})).toBeVisible();release!();await expect(page.getByText('旧日期患者',{exact:true})).toBeHidden()
})
test('cashier previews historical fees before confirming; unknown retry keeps command',async({page})=>{
 const errors=await fixture(page,'CASHIER');let attempts=0;const keys:string[]=[]
 await page.route('**/api/v1/appointments/11/invoice',async route=>{keys.push(route.request().headers()['idempotency-key']!);attempts++;if(attempts===1){await route.abort();return}await route.fulfill({json:{invoice_id:'91',invoice_number:'INV-TEST',appointment_id:'11',issued_at:'2026-11-23T02:00:00Z',items:[{line_number:1,treatment_name:'常规检查',standard_units:'1.00',unit_price:'150.00',subtotal:'150.00'}],total_amount:'150.00'}})})
 await page.goto('/invoicing?appointmentId=11');await expect(page.getByRole('heading',{name:'陈女士（测试） · 费用预览'})).toBeVisible();await expect(page.getByRole('button',{name:'确认生成唯一费用凭据'})).toBeDisabled();await page.screenshot({path:'../../docs/verification/admin-review-20261123/fee-preview.png',fullPage:true});await page.getByRole('checkbox').check();await page.getByRole('button',{name:'确认生成唯一费用凭据'}).click();await expect(page.getByRole('button',{name:'重新确认办理结果'})).toBeVisible();await page.getByRole('button',{name:'重新确认办理结果'}).click();await expect(page.getByRole('heading',{name:'费用凭据 INV-TEST'})).toBeVisible();expect(keys.length).toBe(2);expect(keys[0]).toBe(keys[1]);expect(errors).toEqual([])
})
test('clinical summary, allergy state and dirty leave protection',async({page})=>{
 const errors=await fixture(page,'DENTIST');await page.goto('/clinical-treatment?appointmentId=11');await expect(page.locator('.patient-summary').getByText('陈女士（测试）')).toBeVisible();await expect(page.locator('.risk-recorded')).toContainText('存在已记录过敏');await page.screenshot({path:'../../docs/verification/admin-review-20261123/clinical.png',fullPage:true});await page.getByLabel('问题与特殊需求').fill('尚未保存的修改');page.once('dialog',d=>d.dismiss());await page.getByRole('link',{name:'首页',exact:true}).click();await expect(page).toHaveURL(/clinical-treatment/);expect(errors).toEqual([])
})
test('quarter workspace has steps and requires no internal ID input',async({page})=>{const errors=await fixture(page,'HEADQUARTERS');await page.goto('/quarterly-performance');await expect(page.getByRole('heading',{name:'季度核算工作区'})).toBeVisible();await expect(page.getByRole('button',{name:'1 · 资料准备'})).toBeVisible();await page.getByRole('button',{name:'2 · 冻结计算'}).click();await expect(page.getByText('尚未绑定准备批次',{exact:true})).toBeVisible();await expect(page.getByRole('textbox',{name:'同批次准备凭据 ID'})).toHaveCount(0);await page.screenshot({path:'../../docs/verification/admin-review-20261123/quarter.png',fullPage:true});expect(errors).toEqual([])})
test('refresh restores original result query without persisting clinical contents',async({page})=>{
 await fixture(page,'CASHIER');let originalKey=''
 await page.route('**/api/v1/appointments/11/invoice',async route=>{originalKey=route.request().headers()['idempotency-key']!;await route.abort()})
 await page.goto('/invoicing?appointmentId=11');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'确认生成唯一费用凭据'}).click();await expect(page.getByLabel('上次办理结果')).toBeVisible()
 await page.reload();await expect(page.getByLabel('上次办理结果')).toBeVisible();let queried=false
 await page.route('**/api/v1/requests/**',async route=>{expect(new URL(route.request().url()).pathname).toContain(originalKey);queried=true;await route.fulfill({json:{status:'SUCCEEDED',resource_references:['Invoice:91']}})})
 await page.getByRole('button',{name:'重新确认上次办理结果'}).click();await expect(page.getByRole('link',{name:'查看原记录 · Invoice:91'})).toBeVisible();expect(queried).toBeTruthy();await page.getByRole('button',{name:'已核对原结果，继续办理'}).click();await expect(page.getByLabel('上次办理结果')).toBeHidden()
})
