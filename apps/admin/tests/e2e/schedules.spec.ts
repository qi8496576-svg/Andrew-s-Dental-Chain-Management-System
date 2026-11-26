import { expect,test } from '@playwright/test'
import { clinicSession } from './helpers/clinic-session'
import { shanghaiToday,shiftDate } from '../../src/views/schedules/week'
test('independent doctor week schedule creates adjacent shifts, rejects overlap and retains suspended history',async({page,browser})=>{
  const session=await clinicSession(page,browser,['listSchedules','createSchedule','suspendSchedule'])
  try{
    await session.doctor();const day=shiftDate(shanghaiToday(),1)
    await page.getByRole('link',{name:'出诊排班',exact:true}).click();await page.getByLabel('查看日期').fill(day);await page.getByRole('button',{name:'查看周排班'}).click()
    await page.getByRole('button',{name:'新增出诊班次'}).click();let dialog=page.getByRole('dialog');await dialog.getByLabel('出诊日期').fill(day);await dialog.getByLabel('开始时间').fill('09:00');await dialog.getByLabel('结束时间').fill('10:00');await dialog.getByLabel('时隙分钟').fill('20');let saved=page.waitForResponse(r=>r.url().endsWith('/api/v1/schedules') && r.request().method()==='POST');await dialog.getByRole('button',{name:'保存出诊班次'}).click();expect((await saved).status()).toBe(200);await expect(dialog).not.toBeVisible();await expect(page.locator('.shift-card')).toContainText('09:00–10:00')
    await page.getByRole('button',{name:'新增出诊班次'}).click();dialog=page.getByRole('dialog');await dialog.getByLabel('开始时间').fill('09:30');await dialog.getByLabel('结束时间').fill('10:30');const conflict=page.waitForResponse(r=>r.url().endsWith('/api/v1/schedules') && r.request().method()==='POST');await dialog.getByRole('button',{name:'保存出诊班次'}).click();expect((await conflict).status()).toBe(409);await expect(dialog).toBeVisible()
    await dialog.getByLabel('开始时间').fill('10:00');await dialog.getByLabel('结束时间').fill('11:00');await dialog.getByLabel('时隙分钟').fill('30');saved=page.waitForResponse(r=>r.url().endsWith('/api/v1/schedules') && r.request().method()==='POST');await dialog.getByRole('button',{name:'保存出诊班次'}).click();expect((await saved).status()).toBe(200);await expect(dialog).not.toBeVisible();await expect(page.locator('.shift-card')).toHaveCount(2)
    await page.locator('.shift-card').filter({hasText:'09:00–10:00'}).getByRole('button').click();await page.getByRole('dialog',{name:'出诊班次详情'}).getByRole('button',{name:'办理停诊',exact:true}).click();dialog=page.getByRole('dialog',{name:'办理停诊',exact:true});await dialog.getByLabel('停诊原因').fill('核实医生临时停诊');await dialog.getByRole('button',{name:'确认停诊并查看影响'}).click();await expect(dialog).not.toBeVisible();await expect(page.locator('.shift-card.suspended')).toContainText('09:00–10:00');await expect(page.getByRole('status')).toContainText('预约状态保持不变')
    await page.screenshot({path:'../../docs/verification/schedules.png',fullPage:true})
    await page.getByRole('button',{name:'退出登录'}).click();await expect(page.getByRole('heading',{name:'欢迎回来'})).toBeVisible()
  }finally{await session.close()}
})

