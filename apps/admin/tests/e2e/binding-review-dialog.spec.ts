import {test,expect} from '@playwright/test'
import {grantCapabilities} from '../../src/api/grant-capabilities'
for(const width of [1440,390])test(`binding review opens immediately above a long list at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900})
 const writes:string[]=[]
 await page.route('**/api/v1/**',async route=>{
  const path=new URL(route.request().url()).pathname
  if(route.request().method()!=='GET')writes.push(path)
  const data=path==='/api/v1/me'?{subject_id:'fixture',subject_type:'STAFF',roles:['RECEPTION'],capabilities:grantCapabilities.RECEPTION,clinic_scope:['1'],binding:null}:path==='/api/v1/binding-requests'?{items:Array.from({length:40},(_,i)=>({request_id:'request-'+i,patient_number:'P'+i,date_of_birth:'1990-01-02',clinic_id:'1',subject_id:'subject-'+i,status:i===0?'APPROVED':'PENDING'})),next_cursor:null}:{items:[{id:'1',label:'诊所'}],next_cursor:null}
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})
 })
 await page.goto('/patient-bindings')
 await page.getByRole('row').filter({hasText:'subject-1'}).first().getByRole('button',{name:'查看与处理'}).click()
 const dialog=page.getByRole('dialog',{name:'人工核验与处理'})
 await expect(dialog).toBeVisible();await expect(dialog.getByLabel('服务依据',{exact:true})).toBeInViewport()
 await expect(dialog.getByRole('button',{name:'批准本人绑定'})).toBeDisabled()
 await expect(dialog.getByRole('button',{name:'核验并定位患者档案'})).toBeDisabled()
 expect(await dialog.evaluate(el=>el.getBoundingClientRect().right<=innerWidth)).toBe(true)
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden()
 await page.getByRole('row').filter({hasText:'subject-0'}).getByRole('button',{name:'查看与处理'}).click()
 await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'批准本人绑定'})).toHaveCount(0)
 await expect(dialog.getByRole('button',{name:'核验后解绑此身份'})).toBeDisabled()
 expect(writes).toEqual([])
})
