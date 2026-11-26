import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {root,host,sshArgs,ssh,run,executeScript} from './cloud-ssh.mjs'
const evidence=path.join(root,'docs/verification/cloud-integration-20261124')
const candidate=JSON.parse(fs.readFileSync(path.join(evidence,'candidate.json'),'utf8'))
assert.match(candidate.release,/^adc-cloud-20261124-\d+$/)
assert.ok(candidate.local_directory.startsWith(path.join(root,'tmp/deployment')+path.sep))
await ssh('mkdir -p /home/ubuntu/adc-upload; test ! -e /home/ubuntu/adc-upload/'+candidate.release)
await run('scp',[...sshArgs,'-r',candidate.local_directory,host+':/home/ubuntu/adc-upload/'])
const verification=await executeScript('ops/scripts/cloud-stage-candidate.sh',[candidate.release])
fs.writeFileSync(path.join(evidence,'staging.json'),JSON.stringify({date:new Date().toISOString(),release:candidate.release,archive_sha256:candidate.archive.sha256,verified:true,verification,services_changed:false},null,2)+'\n')
console.log(verification)
