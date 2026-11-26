// Freeze current validated backend and freshly built admin; never changes a running stack.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {pipeline} from 'node:stream/promises'
import {createGzip} from 'node:zlib'
import {root,run,executeScript} from './cloud-ssh.mjs'
const docker='D:/ADC-Dev/Docker/app/resources/bin/docker.exe'
const env={...process.env,DOCKER_HOST:'npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONFIG:path.join(root,'tmp/docker-config'),TEMP:path.join(root,'tmp/build-temp'),TMP:path.join(root,'tmp/build-temp')}
const local=JSON.parse(fs.readFileSync(path.join(root,'ops/config/local-preview-ui.json'),'utf8'))
assert.match(local.backend_image,/^adc\/backend:[a-zA-Z0-9._-]+$/)
const release='adc-cloud-20261124-'+Date.now(),directory=path.join(root,'tmp/deployment',release),evidence=path.join(root,'docs/verification/cloud-integration-20261124')
fs.mkdirSync(directory,{recursive:true});fs.mkdirSync(evidence,{recursive:true})
if(fs.existsSync(path.join(evidence,'candidate.json'))){const previous=JSON.parse(fs.readFileSync(path.join(evidence,'candidate.json'),'utf8'));assert.match(previous.release,/^adc-cloud-20261124-\d+$/);fs.copyFileSync(path.join(evidence,'candidate.json'),path.join(evidence,'candidate-'+previous.release+'.json'))}
const hash=async file=>{const h=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))h.update(chunk);return h.digest('hex')}
const dockerRun=args=>run(docker,args,{env})
const preflight=JSON.parse(await executeScript('ops/scripts/cloud-preflight.sh'))
fs.writeFileSync(path.join(evidence,fs.existsSync(path.join(evidence,'preflight.json'))?'preflight-'+release+'.json':'preflight.json'),JSON.stringify(preflight,null,2)+'\n')
assert.equal((await dockerRun(['exec','adc-local-preview-backend-1','sha256sum','/app/app.jar'])).split(/\s/)[0],await hash(path.join(root,'backend/target/adc-backend-0.1.0-SNAPSHOT.jar')),'Packaged JAR differs from the validated running backend')
await run(process.execPath,[path.join(root,'apps/admin/node_modules/vite/bin/vite.js'),'build'],{cwd:path.join(root,'apps/admin'),env})
const admin='adc/admin:'+release
await dockerRun(['build','--pull=false','--tag',admin,path.join(root,'apps/admin')])
const refs=[local.backend_image,admin,'sha256:72c368d898861f3b3a07af0e6d690400f44f048799ed46822783d9224cc2c86d']
const images=JSON.parse(await dockerRun(['image','inspect',...refs])).map((image,index)=>({reference:index===2?'mysql@'+refs[index]:refs[index],id:image.Id,os:image.Os,architecture:image.Architecture}))
images.forEach(image=>{assert.equal(image.os,'linux');assert.equal(image.architecture,'amd64')})
const tar=path.join(directory,'images.tar'),archive=tar+'.gz'
await dockerRun(['image','save','--output',tar,...refs.slice(0,2)])
await pipeline(fs.createReadStream(tar),createGzip({level:1}),fs.createWriteStream(archive,{flags:'wx'}))
fs.unlinkSync(tar) // This exact file was created above inside the newly created candidate.
const files=['ops/compose/compose.prod.yaml','ops/compose/compose.offline.yaml','ops/compose/mysql/bootstrap.sql','ops/compose/mysql/initialize-users.sh','ops/compose/mysql/runtime-grants.sql','ops/scripts/verify-candidate.py']
const fingerprints=[]
for(const relative of files){const target=path.join(directory,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,relative),target);fingerprints.push({path:relative,sha256:await hash(target)})}
const manifest={date:new Date().toISOString(),release,status:'verified-isolated-candidate-not-production-approval',task_baseline:'ADC-TASKS-20261111-03',images,archive:{file:'images.tar.gz',sha256:await hash(archive),bytes:fs.statSync(archive).size,includes:'backend and admin only; exact approved MySQL already present on target'},backend_jar_sha256:await hash(path.join(root,'backend/target/adc-backend-0.1.0-SNAPSHOT.jar')),business_dictionary_sha256:await hash(path.join(root,'docs/diagrams/database/schema.json')),files:fingerprints,contains_secrets:false,production_deployed:false,real_wechat_verified:false,previous_cloud_candidate:'adc-20261114-1794653395719',backend_verification:'docs/verification/admin-review-20261123/backend-verification.log'}
fs.writeFileSync(path.join(directory,'candidate.json'),JSON.stringify(manifest,null,2)+'\n')
fs.writeFileSync(path.join(evidence,'candidate.json'),JSON.stringify({...manifest,local_directory:directory},null,2)+'\n')
console.log(JSON.stringify({release,directory,archive_sha256:manifest.archive.sha256,bytes:manifest.archive.bytes}))
