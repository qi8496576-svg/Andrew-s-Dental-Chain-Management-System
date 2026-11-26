import { expect,test } from '@playwright/test'
test('real patient binding review, rebind, old session denial and retained history',async({page,browser})=>{
  const root=process.env.ADC_AUTH_BASE_URL!,manager=await browser.newContext({ignoreHTTPSErrors:true})
  try{
    const initial=await (await manager.request.get(`${root}/api/v1/auth/csrf`)).json()
    const signed=await manager.request.post(`${root}/api/v1/auth/staff-sessions`,{headers:{'X-CSRF-Token':initial.csrf_token,Origin:root},data:{username:process.env.ADC_MANAGER_USERNAME,password:process.env.ADC_MANAGER_PASSWORD}});expect(signed.status()).toBe(200)
    const csrf=(await signed.json()).csrf_token
    const accounts=await (await manager.request.get(`${root}/api/v1/identity/staff-accounts`)).json();const target=accounts.items.find((a:{username:string})=>a.username===process.env.ADC_TEST_USERNAME).subject_id
    expect((await manager.request.post(`${root}/api/v1/identity/grants`,{headers:{'X-CSRF-Token':csrf,Origin:root,'Idempotency-Key':crypto.randomUUID()},data:{subject_id:target,role:'RECEPTION',clinic_ids:['1'],capabilities:['createPatient','getPatient','listBindingRequests','approvePatientBinding','rebindPatient','revokePatientBinding'],valid_from:new Date().toISOString(),valid_until:null}})).status()).toBe(200)
    await page.goto('/authentication');await page.getByLabel('个人账号').fill(process.env.ADC_TEST_USERNAME!);await page.getByLabel('密码',{exact:true}).fill(process.env.ADC_TEST_PASSWORD!)
    const login=page.waitForResponse(r=>r.url().endsWith('/api/v1/auth/staff-sessions') && r.request().method()==='POST');await page.getByRole('button',{name:'登录管理后台'}).click();const userCsrf=(await (await login).json()).csrf_token
    const creation=await page.request.post('/api/v1/patients',{headers:{'X-CSRF-Token':userCsrf,Origin:root,'Idempotency-Key':crypto.randomUUID()},data:{full_name:'虚构绑定测试患者',date_of_birth:'1990-01-02',phone:'000',billing_address:'虚构地址',emergency_contact_name:'虚构联系人',emergency_contact_phone:'000',verification_basis:{clinic_id:'1',person_confirmed:true,service_basis:'owned browser fixture'}}});expect(creation.status()).toBe(200);const patient=await creation.json()
    const native=await browser.newContext({ignoreHTTPSErrors:true});try{
      async function request(token:string){const response=await native.request.post(`${root}/api/v1/me/binding-requests`,{headers:{Authorization:`Bearer ${token}`,'Idempotency-Key':crypto.randomUUID()},data:{patient_number:patient.patient_number,date_of_birth:'1990-01-02',clinic_id:'1'}});expect(response.status()).toBe(200);return response.json()}
      const first=await request(process.env.ADC_NATIVE_A!)
      await page.getByRole('link',{name:'患者身份绑定',exact:true}).click()
      async function verify(subject:string){const row=page.getByRole('row').filter({hasText:subject});await row.getByRole('button',{name:'核验此申请'}).click();await page.getByLabel('服务依据',{exact:true}).fill('核实到场本人及本次诊所服务');await page.getByLabel('已核对原始患者编号').check();await page.getByLabel('已核对出生日期').check();await page.getByLabel('已人工核实到场本人').check();await page.getByRole('button',{name:'核验并定位患者档案'}).click();await expect(page.getByText(`已核验档案 ID：${patient.patient_id}`)).toBeVisible();await page.getByLabel('操作原因',{exact:true}).fill('本人申请并核验')}
      await verify(first.subject_id);await page.getByRole('button',{name:'批准本人绑定'}).click();await expect(page.getByRole('status')).toContainText('绑定已保存')
      expect((await native.request.get(`${root}/api/v1/patients/${patient.patient_id}`,{headers:{Authorization:`Bearer ${process.env.ADC_NATIVE_A}`}})).status()).toBe(200)
      const second=await request(process.env.ADC_NATIVE_B!);await page.getByRole('button',{name:'刷新申请'}).click();await verify(second.subject_id);await page.getByLabel('换号前的有效登录身份').fill(first.subject_id);await page.getByRole('button',{name:'核验后换号重绑'}).click();await expect(page.getByRole('status')).toContainText('绑定已保存')
      expect((await native.request.get(`${root}/api/v1/patients/${patient.patient_id}`,{headers:{Authorization:`Bearer ${process.env.ADC_NATIVE_A}`}})).status()).toBe(403)
      expect((await native.request.get(`${root}/api/v1/me/binding`,{headers:{Authorization:`Bearer ${process.env.ADC_NATIVE_B}`}})).status()).toBe(200)
      await verify(second.subject_id);await page.getByRole('button',{name:'核验后解绑此身份'}).click();await expect(page.getByRole('status')).toContainText('解绑已完成')
      expect((await native.request.get(`${root}/api/v1/me/binding`,{headers:{Authorization:`Bearer ${process.env.ADC_NATIVE_B}`}})).status()).toBe(404)
    }finally{await native.close()}
    await page.getByRole('button',{name:'退出登录'}).click();await expect(page.getByRole('heading',{name:'欢迎回来'})).toBeVisible()
  }finally{await manager.close()}
})

