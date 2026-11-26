import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {root,run,host,sshArgs,executeScript} from './cloud-ssh.mjs'
const test=JSON.parse(fs.readFileSync(path.join(root,'docs/verification/recovery/q05-local-drill.json'),'utf8'));assert.equal(test.status,'PASS')
const release='adc-recovery-20261125-'+Date.now(),directory=path.join(root,'tmp/deployment',release);fs.mkdirSync(directory)
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),files=[]
for(const file of ['full-backup.sh','verify-manifest.sh','archive-binlog.sh','restore-to-position.sh','verify-consistency.sh','cloud-cycle.sh']){fs.copyFileSync(path.join(root,'ops/backup',file),path.join(directory,file));files.push({file,sha256:hash(path.join(directory,file))})}
for(const file of ['mysqlbinlog','provenance.json']){fs.copyFileSync(path.join(root,'tmp/backup-tools',file),path.join(directory,file));files.push({file,sha256:hash(path.join(directory,file))})}
fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify({release,files},null,2)+'\n')
await run('scp',[...sshArgs,'-r',directory,host+':/home/ubuntu/adc-upload/'])
console.log((await executeScript('ops/scripts/install-recovery-jobs.sh',[release])).trim())
fs.writeFileSync(path.join(root,'docs/verification/recovery/cloud-jobs.json'),JSON.stringify({release,date:new Date().toISOString(),daily_full:true,archive_interval_seconds:300,health_interval_seconds:300,no_pruning:true,database_container_recreated:false,files},null,2)+'\n')
