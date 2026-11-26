import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {accounts,privateRoot,login,catalog,get,request,key,origin} from './cloud-api.mjs'
const credentials={username:'admin-demo',password:'adl123456'} // Deliberately public application credentials.
const actor=await login(accounts.admin),identityResponse=await get('/me',actor),identity=identityResponse.data
// Use the authenticated server clock so a client clock offset cannot defer grants.
const validFrom=new Date(identityResponse.headers.date).toISOString()
const clinicIds=identity.clinic_scope
assert.ok(clinicIds.length>0,'An existing authorized clinic scope is required')
const fixture=JSON.parse(fs.readFileSync(path.join(privateRoot,'fixture.json'),'utf8'))
const allAccounts=await catalog('identity/staff-accounts',actor)
const journalFile=path.join(privateRoot,'public-admin-login.json')
const journal=fs.existsSync(journalFile)?JSON.parse(fs.readFileSync(journalFile,'utf8')):{username:credentials.username,commands:{}}
assert.equal(journal.username,credentials.username)
async function command(name,url,body){
 if(!journal.commands[name]){journal.commands[name]={key:key(),url,body};fs.writeFileSync(journalFile,JSON.stringify(journal,null,2)+'\n')}
 const saved=journal.commands[name];assert.equal(saved.url,url)
 const result=await request('POST',url,saved.body,actor,{key:saved.key})
 assert.equal(result.status,200,name+': '+result.data?.code);return result.data
}
let account=allAccounts.find(x=>x.username===credentials.username)
if(!account)account=await command('account','/identity/staff-accounts',{username:credentials.username,staff_reference:'APPLICATION_ADMIN',dentist_id:fixture.items.dentist.dentist_id})
await command('credential','/identity/staff-accounts/'+account.subject_id+'/credential-recovery',{verification_reference:'OWNER_REQUESTED_UNIFIED_ADMIN_LOGIN_20261126',reason:'设置统一应用管理员账号',replacement_password:credentials.password})
const source=fs.readFileSync('apps/admin/src/api/grant-capabilities.ts','utf8'),capabilities=JSON.parse(source.slice(source.indexOf('=')+1).trim())
for(const role of ['HEADQUARTERS','RECEPTION','DENTIST','CASHIER'])await command('grant-'+role,'/identity/grants',{subject_id:account.subject_id,role,clinic_ids:clinicIds,capabilities:capabilities[role],valid_from:validFrom,valid_until:null})
const manager=await login(credentials),me=(await get('/me',manager)).data
assert.deepEqual([...me.roles].sort(),['CASHIER','DENTIST','HEADQUARTERS','RECEPTION'])
for(const capability of Object.values(capabilities).flat())assert.ok(me.capabilities.includes(capability),capability)
for(const url of ['/identity/staff-accounts','/identity/grants','/clinics','/dentists','/patient-bills?limit=1','/appointments?clinic_id='+clinicIds[0]])await get(url,manager)
const accountsFile=path.join(privateRoot,'accounts.json'),backup=path.join(privateRoot,'accounts.before-unified-admin.json')
if(!fs.existsSync(backup))fs.copyFileSync(accountsFile,backup)
accounts.demo=credentials;fs.writeFileSync(accountsFile,JSON.stringify(accounts,null,2)+'\n')
fs.writeFileSync(path.join(privateRoot,'管理员登录资料.txt'),origin+'\n账号：'+credentials.username+'\n密码：'+credentials.password+'\n')
const report={checked_at:new Date().toISOString(),origin,username:credentials.username,roles:me.roles,clinic_scope:me.clinic_scope,all_registered_capabilities_verified:true,authentication_and_authorization_via_existing_api:true,database_recreated:false}
fs.writeFileSync('docs/verification/unified-admin-cloud.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
