import {expect,test,type Page} from '@playwright/test'
const shift=(id:string,day:string,start:string,end:string,dentist='21',status='NORMAL')=>({schedule_id:id,clinic_id:'1',dentist_id:dentist,schedule_date:day,start_time:start,end_time:end,slot_minutes:20,schedule_status:status,note:null})
const schedules=[shift('1','2026-11-23','09:00:00','10:00:00'),shift('2','2026-11-23','09:30:00','11:00:00','22'),shift('3','2026-11-23','14:00:00','15:00:00'),shift('4','2026-11-24','07:00:00','08:00:00'),shift('5','2026-11-27','21:30:00','23:00:00','22','SUSPENDED'),shift('6','2026-11-25','10:20:00','10:40:00')]
async function fixture(page:Page){
 await page.clock.setFixedTime(new Date('2026-11-23T04:00:00Z'))
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/api/v1/**',async route=>{
  const url=new URL(route.request().url());let data:unknown={items:[],next_cursor:null}
  if(url.pathname.endsWith('/me'))data={subject_id:'timetable-fixture',subject_type:'STAFF',roles:['RECEPTION'],capabilities:['listSchedules','createSchedule','suspendSchedule'],clinic_scope:['1'],binding:null}
  else if(url.pathname.endsWith('/clinics'))data={items:[{id:'1',label:'天河诊所',active:true}],next_cursor:null}
  else if(url.pathname.endsWith('/dentists'))data={items:[{id:'21',label:'林医生',active:true},{id:'22',label:'王医生',active:true}],next_cursor:null}
  else if(url.pathname.endsWith('/schedules'))data={items:url.searchParams.get('start')?.startsWith('2026-11-23')?schedules.filter(s=>!url.searchParams.get('dentist_id')||s.dentist_id===url.searchParams.get('dentist_id')):[],next_cursor:null}
  await route.fulfill({json:data})
 })
 return errors
}
test('week overview groups actual shifts by date and opens the daily doctor timeline',async({page})=>{
 const errors=await fixture(page);await page.goto('/schedules');await expect(page.locator('.agenda-shift')).toHaveCount(6);await expect(page.locator('.week-day-heading')).toHaveCount(7)
 await page.getByRole('button',{name:'日视图',exact:true}).click();await expect(page.locator('.shift-card')).toHaveCount(3);await expect(page.locator('.day-heading')).toHaveCount(2)
 const morning=await page.locator('[data-schedule="1"]').boundingBox(),concurrent=await page.locator('[data-schedule="2"]').boundingBox(),afternoon=await page.locator('[data-schedule="3"]').boundingBox()
 expect(concurrent!.y-morning!.y).toBeCloseTo(34.5,0);expect(concurrent!.height-morning!.height).toBeCloseTo(34.5,0);expect(afternoon!.y-morning!.y).toBeCloseTo(345,0);expect(morning!.x+morning!.width).toBeLessThan(concurrent!.x)
 await page.locator('[data-schedule="3"] button').click();await expect(page.getByRole('dialog',{name:'出诊班次详情'})).toContainText('14:00–15:00');await page.getByRole('dialog').getByRole('button',{name:'办理停诊',exact:true}).click();await expect(page.getByRole('dialog',{name:'办理停诊',exact:true})).toContainText('停诊保留班次及预约');expect(errors).toEqual([])
})
test('narrow week overview and daily timeline stay within the viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});const errors=await fixture(page);await page.goto('/schedules');await expect(page.locator('.agenda-shift')).toHaveCount(6)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
 await page.getByRole('button',{name:'日视图',exact:true}).click();await expect(page.locator('.shift-card')).toHaveCount(3);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(errors).toEqual([])
})
test('doctor filtering and empty weeks use the current overview',async({page})=>{
 const errors=await fixture(page);await page.goto('/schedules');await expect(page.locator('.agenda-shift')).toHaveCount(6);await page.getByLabel('排班医生',{exact:true}).selectOption('22');await expect(page.locator('.agenda-shift')).toHaveCount(2)
 await page.getByRole('button',{name:'下一周',exact:true}).click();await expect(page.locator('.agenda-shift')).toHaveCount(0);await expect(page.getByText('本周没有符合筛选条件的出诊班次，可调整诊所、医生或查看日期。')).toBeVisible();await expect(page.locator('.timetable-toolbar h2')).toContainText('2026-11-30 至 2026-12-06');expect(errors).toEqual([])
})
