import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {pipeline} from 'node:stream/promises'
import {createGzip} from 'node:zlib'
import {root,run,executeScript,host,sshArgs} from './cloud-ssh.mjs'
assert.ok(fs.existsSync(path.join(root,'apps/admin/dist/index.html')),'Build the web app first')
const pre=JSON.parse(await executeScript('ops/scripts/cloud-preflight.sh'))
assert.deepEqual(Object.values(pre.database).slice(0,4),[24,209,44,34])
const release='adc-admin-20261126-'+Date.now(),directory=path.join(root,'tmp/deployment',release)
fs.mkdirSync(directory,{recursive:true})
const env={...process.env,DOCKER_HOST:'npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONFIG:path.join(root,'tmp/docker-config'),DOCKER_BUILDKIT:'0'}
const docker=process.env.ADC_DOCKER||'D:/ADC-Dev/Docker/app/resources/bin/docker.exe',reference='adc/admin:'+release
await run(docker,['build','--pull=false','--tag',reference,path.join(root,'apps/admin')],{env})
const image=JSON.parse(await run(docker,['image','inspect',reference],{env}))[0]
const tar=path.join(directory,'images.tar'),archive=tar+'.gz'
await run(docker,['image','save','--output',tar,reference],{env})
await pipeline(fs.createReadStream(tar),createGzip({level:1}),fs.createWriteStream(archive,{flags:'wx'}));fs.unlinkSync(tar)
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const files=[]
for(const file of ['ops/compose/compose.prod.yaml','ops/compose/compose.offline.yaml','ops/scripts/apply-admin-update.sh']){
 const to=path.join(directory,file);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(root,file),to);files.push({path:file,sha256:hash(to)})
}
const manifest={release,created_at:new Date().toISOString(),frontend_only:true,contains_secrets:false,image:{reference,id:image.Id},archive:{file:'images.tar.gz',sha256:hash(archive)},files}
fs.writeFileSync(path.join(directory,'candidate.json'),JSON.stringify(manifest,null,2)+'\n')
fs.writeFileSync(path.join(root,'tmp/admin-deployment-candidate.json'),JSON.stringify({release,directory},null,2)+'\n')
await run('scp',[...sshArgs,'-r',directory,host+':/home/ubuntu/adc-upload/'])
console.log('Web image uploaded; applying frontend-only update')
console.log(await executeScript('ops/scripts/apply-admin-update.sh',[release]))
const after=JSON.parse(await executeScript('ops/scripts/cloud-preflight.sh'))
for(const key of ['business_tables','business_columns','business_foreign_keys','migrations','clinics','patients'])assert.equal(after.database[key],pre.database[key])
assert.deepEqual(after.migration_fingerprints,pre.migration_fingerprints)
fs.writeFileSync(path.join(root,'docs/verification/admin-login-deployment.json'),JSON.stringify({candidate:manifest,pre,after,database_and_backend_preserved:true},null,2)+'\n')
console.log(JSON.stringify({release,image:image.Id,database_and_backend_preserved:true}))
