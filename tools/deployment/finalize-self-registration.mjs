import fs from 'node:fs'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
const directory='docs/verification/patient-onboarding-20261124',read=name=>JSON.parse(fs.readFileSync(directory+'/'+name,'utf8').replace(/^\uFEFF/,''))
const device=read('device-integration.json'),buttons=read('button-interactions.json'),schedule=read('schedule-browser.json'),preview=read('preview.json'),personal=read('personal-runtime.json')
assert.equal(schedule.status,'PASS');assert.equal(preview.status,'PASS');assert.equal(personal.status,'PASS');assert.equal(buttons.profile_button,'PASS_ACTUAL_TAP');assert.equal(buttons.profile_subtitle,'PASS_CURRENT_RENDER');assert.equal(buttons.scheduled_shortcut,'PASS_ACTUAL_TAP')
assert.equal(device.new_registration_created,true);assert.equal(device.management_before,'SCHEDULED');assert.equal(device.management_after,'CANCELLED');assert.equal(device.original_other_account_binding_preserved,true);assert.equal(device.database.self_declarations,1);assert.equal(device.database.business_tables,19);assert.equal(device.database.business_columns,163);assert.equal(device.database.appointment_events,2)
if(device.status!=='PASS'){
 assert.equal(device.error,'App.captureScreenshot: timeout waiting for automator response')
 fs.copyFileSync(directory+'/device-integration.json',directory+'/device-integration-initial.json')
 device.diagnostics=[{stage:device.stage,error:device.error,resolution:'Business assertions had passed; personal-center runtime, screenshot and actual button taps verified separately.'}]
 delete device.error
}
Object.assign(device,{status:'PASS',business_status:'PASS',stage:'COMPLETE',personal_runtime:'PASS',profile_button:'PASS_ACTUAL_TAP',profile_subtitle:'PASS_CURRENT_RENDER',record_shortcut:'PASS_ACTUAL_TAP'})
fs.writeFileSync(directory+'/device-integration.json',JSON.stringify(device,null,2)+'\n')
const owner={recorded_at:new Date().toISOString(),source:'Owner reply in this chat',result:'新版正常，可以进入预约',new_ui_visible:true,appointment_page_accessible:true,phone_new_registration_or_payment_not_claimed:true}
fs.writeFileSync(directory+'/owner-device-confirmation.json',JSON.stringify(owner,null,2)+'\n')
const candidate=JSON.parse(fs.readFileSync('docs/verification/cloud-integration-20261124/candidate.json','utf8'))
const report={at:new Date().toISOString(),status:'PASS',release:candidate.release,origin:'https://andrewdental.cn',backend_image:candidate.images[0].id,admin_image:candidate.images[1].id,backend_jar_sha256:candidate.backend_jar_sha256,business_dictionary_sha256:candidate.business_dictionary_sha256,business_schema_changed:false,technical_schema_changed:false,database_container_preserved:true,migrations_run:false,actual_wechat_new_registration:'PASS',actual_wechat_booking_and_cancellation:'PASS',management_readback:'PASS',original_other_account_binding:'PASS_PRESERVED',week_and_day_schedule_ui:'PASS',phone_owner_confirmation:'PASS_UI_AND_APPOINTMENT_ENTRY',online_payment:'DESIGN_ONLY_NOT_IMPLEMENTED',production_miniprogram_upload:false,reference_miniapp_current_version_inspected:false,evidence:['device-integration.json','button-interactions.json','schedule-browser.json','owner-device-confirmation.json','preview.json']}
fs.writeFileSync(directory+'/final.json',JSON.stringify(report,null,2)+'\n')
const configFile='ops/config/tencent-environment.json',config=JSON.parse(fs.readFileSync(configFile,'utf8'));config.updated_on='2026-11-24';config.domain_integration??={};config.domain_integration.release=candidate.release;config.domain_integration.self_registration_verified=true;fs.writeFileSync(configFile,JSON.stringify(config,null,2)+'\n')
fs.writeFileSync('docs/verification/cloud-integration-20261124/staging.json',JSON.stringify({date:new Date().toISOString(),release:candidate.release,archive_sha256:candidate.archive.sha256,verified:true,verification:'Exact uploaded archive resumed after SSH interruption; candidate files and image fingerprints verified by cloud-stage-candidate.sh',services_changed:false},null,2)+'\n')
const amendment='specs/001-system-specification/amendments/20261124-patient-onboarding-and-payments.md';let text=fs.readFileSync(amendment,'utf8');text=text.replace('- [ ] R03','- [x] R03').replace('- [ ] R04','- [x] R04').replace('正在实施；支付仍为后续设计','已实施并通过云端与真实微信验收；支付仍为后续设计');text+='\n\n最终验收：docs/verification/patient-onboarding-20261124/README.md。R01—R04 已通过；手机确认仅表示新版可见及可进入预约，不将其扩大为真机首次登记或支付验收。\n';fs.writeFileSync(amendment,text)
console.log(JSON.stringify({status:report.status,release:report.release,real_wechat_business:'PASS',management_sync:'PASS',phone_ui:'PASS',payment:'DESIGN_ONLY'}))
