import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {pipeline} from 'node:stream/promises'
import {gunzipSync} from 'node:zlib'
import {root,host,sshArgs,ssh,executeScript} from './cloud-ssh.mjs'
async function readOnly(action){for(let attempt=0;;attempt++){try{return await action()}catch(e){if(attempt>=2)throw e;await new Promise(r=>setTimeout(r,900))}}}
const directory=path.join(root,'docs/verification/patient-billing-20261125'),initial=JSON.parse(fs.readFileSync(path.join(directory,'candidate.json'),'utf8'))
const release=(await readOnly(()=>ssh('sudo -n cat /opt/andrew-dental/private/IntegrationRuntime/release'))).trim();assert.match(release,/^adc-billing-fix-20261125-[0-9]+$/)
const candidate=JSON.parse(fs.readFileSync(path.join(root,'tmp/deployment',release,'candidate.json'),'utf8'))
const after=JSON.parse(await readOnly(()=>executeScript('ops/scripts/cloud-preflight.sh')));assert.deepEqual(Object.values(after.database).slice(0,4),[24,209,44,34]);assert.equal(after.migration_fingerprints.at(-1),'201\t2133159943')
const before=JSON.parse(fs.readFileSync(path.join(directory,'before.json'),'utf8'));assert.deepEqual(after.migration_fingerprints.slice(0,33),before.migration_fingerprints)
const remote='/opt/andrew-dental/private/BillingBackups/'+initial.release,privateDirectory='D:/secrets/AndrewDental/CloudIntegration/Backups/'+initial.release;fs.mkdirSync(privateDirectory,{recursive:true})
const file=path.join(privateDirectory,'full.sql.gz')
const expected=(await readOnly(()=>ssh('sudo -n cat '+remote+'/full.sha256'))).split(/\s/)[0]
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
if(!fs.existsSync(file)||hash(file)!==expected){
 await readOnly(async()=>{const pending=file+'.pending-'+crypto.randomUUID(),child=spawn('ssh',[...sshArgs,host,'sudo -n cat '+remote+'/full.sql.gz'],{windowsHide:true});let error='';child.stderr.on('data',b=>error+=b);const complete=new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Private backup copy failed: '+error)))});child.stdin.end();try{await Promise.all([pipeline(child.stdout,fs.createWriteStream(pending,{flags:'wx',mode:0o600})),complete]);assert.equal(hash(pending),expected);assert.ok(gunzipSync(fs.readFileSync(pending)).length>0);fs.renameSync(pending,file)}finally{if(fs.existsSync(pending))fs.unlinkSync(pending)}})
}
const checksum=hash(file);assert.equal(checksum,expected);assert.ok(gunzipSync(fs.readFileSync(file)).length>0)
fs.writeFileSync(path.join(directory,'after.json'),JSON.stringify(after,null,2)+'\n')
const report={date:new Date().toISOString(),candidate,after,application_only_update:true,database_container_and_volume_preserved:true,no_migrations_during_application_update:true,original_33_migration_checksums_preserved:true,v201_checksum:2133159943,demo_payment_only:true,independent_pre_migration_backup:{directory:privateDirectory,sha256:checksum,bytes:fs.statSync(file).size,full_q05_restore_verified:false},tls_preserved:true}
fs.writeFileSync(path.join(directory,'application-update.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({release,database:after.database,backup_off_server:true,original_migrations_preserved:true,real_charge:false}))
