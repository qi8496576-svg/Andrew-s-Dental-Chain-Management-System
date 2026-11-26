import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {spawn} from 'node:child_process'
import {pipeline} from 'node:stream/promises'
import assert from 'node:assert/strict'
import {root,host,sshArgs,ssh,run,quote} from './cloud-ssh.mjs'
const evidence=path.join(root,'docs/verification/cloud-integration-20261124'),candidate=JSON.parse(fs.readFileSync(path.join(evidence,'candidate.json'),'utf8'))
assert.match(candidate.release,/^adc-cloud-20261124-\d+$/)
const privateRoot='D:/secrets/AndrewDental/CloudIntegration'
fs.mkdirSync(privateRoot,{recursive:true})
const accountText=await ssh('sudo -n cat /opt/andrew-dental/private/CloudTest/accounts.json')
assert.equal(JSON.parse(accountText).purpose,'owner-approved-cloud-synthetic-integration-only-20261124')
fs.writeFileSync(path.join(privateRoot,'accounts.json'),accountText,{mode:0o600})
const backupDirectory=path.join(privateRoot,'Backups',candidate.release);fs.mkdirSync(backupDirectory,{recursive:true})
const backupFile=path.join(backupDirectory,'full.sql.gz')
const child=spawn('ssh',[...sshArgs,host,'sudo -n cat /opt/andrew-dental/private/PreDomainBackups/'+candidate.release+'/full.sql.gz'],{windowsHide:true})
let error='';child.stderr.on('data',b=>error+=b)
const completion=new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Backup copy failed: '+error)))})
child.stdin.end();await Promise.all([pipeline(child.stdout,fs.createWriteStream(backupFile,{flags:'wx',mode:0o600})),completion])
const checksum=crypto.createHash('sha256').update(fs.readFileSync(backupFile)).digest('hex')
const expected=(await ssh('sudo -n cat /opt/andrew-dental/private/PreDomainBackups/'+candidate.release+'/full.sha256')).split(/\s/)[0]
assert.equal(checksum,expected)
const upload='/home/ubuntu/adc-upload/'+candidate.release
for(const name of ['renew-cloud-certificate.sh','rollback-cloud-integration.sh'])await run('scp',[...sshArgs,path.join(root,'ops/scripts',name),host+':'+upload+'/'+name])
await ssh('sudo -n install -m 0750 '+quote(upload+'/renew-cloud-certificate.sh')+' /etc/letsencrypt/renewal-hooks/deploy/andrew-dental.sh && sudo -n install -m 0700 '+quote(upload+'/rollback-cloud-integration.sh')+' /opt/andrew-dental/private/IntegrationRuntime/rollback.sh')
const result={date:new Date().toISOString(),release:candidate.release,backup:{schemas:['adc_business','adc_identity','adc_audit'],sha256:checksum,independent_off_server_copy:true,bytes:fs.statSync(backupFile).size,local_directory:backupDirectory,full_q05_restore_verified:false},renewal_hook_installed:true,rollback_script_installed:true,credentials_saved_privately:true}
fs.writeFileSync(path.join(evidence,'runtime-finalization.json'),JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify(result))
