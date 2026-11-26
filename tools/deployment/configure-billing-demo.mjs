import fs from 'node:fs'
import assert from 'node:assert/strict'
import {accounts,login,catalog,get,request,key,origin} from './cloud-api.mjs'
const directory='docs/verification/patient-billing-20261125';fs.mkdirSync(directory,{recursive:true})
assert.equal(accounts.purpose,'owner-approved-cloud-synthetic-integration-only-20261124')
const actor=await login(accounts.admin),clinics=await catalog('clinics',actor),clinic=clinics.find(c=>c.code==='CLOUD-TEST-C1'||c.label==='CLOUD-TEST-C1');assert.ok(clinic,'Only the explicitly approved fictional clinic may be configured')
const dentists=await catalog('dentists',actor),rows=[]
const titles=['主任医师（演示）','副主任医师（演示）','主治医师（演示）','口腔医师（演示）','口腔医师（演示）'],directions=['综合口腔检查、牙体牙髓方向','牙周维护、洁牙方向','儿童口腔与预防方向','口腔常见问题检查方向','口腔修复咨询方向'],amounts=[2000,1500,1000,0,0]
for(const [index,dentist] of dentists.entries()){
 assert.ok(index<5,'Inspect unexpected extra doctors before assigning fictional profiles')
 const detail=await get('/dentists/'+dentist.id,actor);assert.match(detail.data.employee_number,/^(CLOUD-TEST-D1|DEMO-DENT-[2-5])$/,'Preserve doctors outside the owner-approved fictional fixture')
 const profile={professional_title:titles[index],specialty:directions[index]+'（虚构测试资料）',introduction:'本资料仅用于安德鲁牙科课程项目演示，为虚构医生，不代表真实医师或执业信息。演示主要方向：'+directions[index]+'。实际服务请由门店核对。'}
 const saved=await request('PATCH','/dentists/'+dentist.id,profile,actor,{key:key(),etag:detail.headers.etag});assert.equal(saved.status,200,JSON.stringify(saved.data))
 const fee=await request('PUT',`/registration-fees/${clinic.id}/${dentist.id}`,{amount_fen:amounts[index]},actor,{key:key()});assert.equal(fee.status,200,JSON.stringify(fee.data));assert.equal(fee.data.demo_enabled,true)
 rows.push({dentist_id:dentist.id,professional_title:profile.professional_title,specialty:profile.specialty,registration_fee_fen:fee.data.amount_fen})
}
const me=await get('/me',actor),bills=await get('/patient-bills?limit=100',actor)
const report={at:new Date().toISOString(),origin,clinic_id:clinic.id,clinic_code:clinic.label,synthetic_profiles_only:true,real_charge:false,doctors:rows,administrator_can_read_bills:true,bill_count:bills.data.items.length,billing_capabilities:me.data.roles.filter(r=>r.capabilities?.some(c=>c.startsWith('billing.'))).map(r=>({role:r.role,capabilities:r.capabilities.filter(c=>c.startsWith('billing.'))}))}
fs.writeFileSync(directory+'/demo-resources.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({configured_doctors:rows.length,clinic:clinic.label,demo_payment_only:true,bill_access:200}))
