import {expect,test} from '@playwright/test'
import {clinicSession} from './helpers/clinic-session'
import {shanghaiToday,shiftDate} from '../../src/views/schedules/week'
import {bookingPayload} from '../../../patient-miniprogram/miniprogram/pages/appointment-booking/payload'
test('real Vue assisted booking and native payload share binding, valid schedules, allergy and slot rules',async({page,browser})=>{
  const session=await clinicSession(page,browser,['createPatient','getPatient','reviewPatientAllergies','listPatientAllergies','searchAppointmentCandidates','createAppointment','listAppointments','getAppointment','listSchedules','createSchedule','suspendSchedule','listBindingRequests','approvePatientBinding'])
  const native=await browser.newContext({ignoreHTTPSErrors:true})
  try{
    const doctor=await session.doctor(),day=shiftDate(shanghaiToday(),1),treatment=await session.headquarters('/treatments',{treatment_code:'BOOK-CONSULT',treatment_name:'虚构预约咨询',description:null,default_unit_price:'100.00',is_active:true})
    await session.employee('/schedules',{dentist_id:doctor.dentist_id,clinic_id:'1',schedule_date:day,start_time:'09:00:00',end_time:'10:00:00',slot_minutes:20,note:null})
    const basis={clinic_id:'1',person_confirmed:true,service_basis:'核实本人及本次服务'}
    const patient=await session.employee('/patients',{full_name:'虚构预约闭环患者',date_of_birth:'1990-01-02',phone:'000',billing_address:'虚构地址',emergency_contact_name:'虚构联系人',emergency_contact_phone:'000',verification_basis:basis})
    const verified=await session.employee('/patients/lookup',{patient_number:patient.patient_number,date_of_birth:patient.date_of_birth,verification_basis:basis})
    await session.employee(`/patients/${patient.patient_id}/allergy-reviews`,{allergy_review_status:'NO_KNOWN',verification_reference:verified.verification_reference,reason:'询问全部已知过敏'})
    await page.getByRole('link',{name:'预约管理',exact:true}).click();await page.getByLabel('预约日期',{exact:true}).fill(day);await page.getByLabel('期望治疗项目').selectOption(treatment.treatment_id);await page.getByRole('button',{name:'查询可约时段'}).click();await expect(page.locator('.candidate-grid button')).toHaveCount(3)
    await page.locator('.candidate-grid button').filter({hasText:'09:00–09:20'}).click();await page.getByLabel('患者编号',{exact:true}).fill(patient.patient_number);await page.getByLabel('患者出生日期').fill(patient.date_of_birth);await page.getByLabel('本次服务依据').fill('到场本人核验');await page.getByLabel('已人工核实本人',{exact:true}).check();await page.getByRole('button',{name:'核验患者及过敏资料'}).click();await expect(page.getByRole('heading',{name:new RegExp(patient.full_name)})).toBeVisible();await page.getByLabel('已核对全部患者资料、全部已知过敏及本次就诊安排').check()
    const booked=page.waitForResponse(r=>r.url().endsWith('/api/v1/appointments') && r.request().method()==='POST');await page.getByRole('button',{name:'确认创建预约'}).click();const response=await booked;expect(response.status(),await response.text()).toBe(200);const saved=await response.json();await expect(page.getByRole('status')).toContainText(saved.appointment_id);await expect(page.locator('.appointment-timeline')).toContainText(saved.appointment_id)
    const auth={Authorization:`Bearer ${process.env.ADC_NATIVE_A}`};const submitted=await native.request.post(`${session.root}/api/v1/me/binding-requests`,{headers:{...auth,'Idempotency-Key':crypto.randomUUID()},data:{patient_number:patient.patient_number,date_of_birth:patient.date_of_birth,clinic_id:'1'}});expect(submitted.status()).toBe(200);const request=await submitted.json()
    await session.employee(`/binding-requests/${request.request_id}/approve`,{patient_id:patient.patient_id,verification_basis:{...basis,patient_number_checked:true,date_of_birth_checked:true},reason:'人工核验本人绑定'})
    const profile=await (await native.request.get(`${session.root}/api/v1/patients/${patient.patient_id}`,{headers:auth})).json()
    const candidates=await native.request.get(`${session.root}/api/v1/appointment-candidates`,{headers:auth,params:{clinic_id:'1',treatment_ids:treatment.treatment_id,start:`${day}T00:00:00+08:00`,end:`${shiftDate(day,1)}T00:00:00+08:00`}});expect(candidates.status()).toBe(200);const available=(await candidates.json()).items;expect(available).toHaveLength(2)
    const body=bookingPayload(profile,[],available[0],[treatment.treatment_id],true),key=crypto.randomUUID();expect(body).not.toHaveProperty('patient_id');expect(body.patient_details).not.toHaveProperty('verification_basis')
    for(const invalid of [{...body,patient_id:patient.patient_id},{...body,allergy_declaration:{...body.allergy_declaration,confirmed:false}},{...body,patient_details:{...body.patient_details,phone:'forged change'}}]){
      const rejected=await native.request.post(`${session.root}/api/v1/appointments`,{headers:{...auth,'Idempotency-Key':crypto.randomUUID()},data:invalid});expect([403,422]).toContain(rejected.status())
    }
    const nativeSaved=await native.request.post(`${session.root}/api/v1/appointments`,{headers:{...auth,'Idempotency-Key':key},data:body});expect(nativeSaved.status(),await nativeSaved.text()).toBe(200);const original=await nativeSaved.json()
    const replay=await native.request.post(`${session.root}/api/v1/appointments`,{headers:{...auth,'Idempotency-Key':key},data:body});expect(replay.status()).toBe(200);expect((await replay.json()).appointment_id).toBe(original.appointment_id)
    expect((await native.request.post(`${session.root}/api/v1/appointments`,{headers:{...auth,'Idempotency-Key':key},data:{...body,scheduled_at:available[1].starts_at}})).status()).toBe(409)
    // The command really commits in MySQL; only the downstream response is lost.
    let committedId='',lostKey=''
    await page.route('**/api/v1/appointments',async route=>{if(route.request().method()!=='POST'){await route.continue();return}lostKey=route.request().headers()['idempotency-key']!;const actual=await route.fetch();expect(actual.status(),await actual.text()).toBe(200);committedId=(await actual.json()).appointment_id;await route.abort('failed')})
    await page.locator('.candidate-grid button').filter({hasText:'09:40–10:00'}).click();await page.getByLabel('已核对全部患者资料、全部已知过敏及本次就诊安排').check();await page.getByRole('button',{name:'确认创建预约'}).click();await expect(page.getByRole('alert')).toContainText('结果尚未确认')
    await page.unroute('**/api/v1/appointments');await page.getByRole('button',{name:'查询原请求'}).click();await expect(page.getByRole('status')).toContainText('原请求已成功')
    const retry=page.waitForRequest(r=>r.url().endsWith('/api/v1/appointments') && r.method()==='POST');await page.getByRole('button',{name:'按原键重试'}).click();expect((await retry).headers()['idempotency-key']).toBe(lostKey);await expect(page.getByRole('status')).toContainText(committedId)
    const stopped=await session.employee(`/schedules/${original.schedule_id}/suspend`,{reason:'真实联动验收停诊'});expect(stopped.affected_appointment_ids.sort()).toEqual([saved.appointment_id,original.appointment_id,committedId].sort());expect((await (await native.request.get(`${session.root}/api/v1/appointments/${original.appointment_id}`,{headers:auth})).json()).status).toBe('SCHEDULED')
    await page.screenshot({path:'../../docs/verification/appointment-booking.png',fullPage:true});await page.getByRole('button',{name:'退出登录'}).click();await expect(page.getByRole('heading',{name:'欢迎回来'})).toBeVisible()
  }finally{await native.close();await session.close()}
})
