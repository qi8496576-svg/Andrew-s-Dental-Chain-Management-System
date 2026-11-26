import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {spawn} from 'node:child_process'
import {pipeline} from 'node:stream/promises'
import {createGzip} from 'node:zlib'
import assert from 'node:assert/strict'
const root=path.resolve(import.meta.dirname,'../..'),evidence=path.join(root,'docs/verification/database'),smoke=JSON.parse(fs.readFileSync(path.join(evidence,'container-smoke.json'),'utf8'))
assert.equal(smoke.passed,true,'Do not export an unverified candidate')
assert.ok(smoke.steps.includes('real_vue_new_clinic_qualification_allergy_schedule_booking_browser_passed'))
const docker=process.env.ADC_DOCKER_EXE??'D:/ADC-Dev/Docker/app/resources/bin/docker.exe',env={...process.env,DOCKER_HOST:'npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONFIG:path.join(root,'tmp/docker-config')}
const release='adc-20261114-'+Date.now(),base=path.join(root,'tmp/deployment');fs.mkdirSync(base,{recursive:true});const destination=path.join(base,release);fs.mkdirSync(destination)
async function run(args){return new Promise((resolve,reject)=>{const p=spawn(docker,args,{cwd:root,env,windowsHide:true});let out='';p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>out+=b);p.on('error',reject);p.on('exit',code=>code===0?resolve(out):reject(new Error('Docker export step failed; exit '+code)))})}
async function hash(file){const digest=crypto.createHash('sha256');for await(const part of fs.createReadStream(file))digest.update(part);return digest.digest('hex')}
const images=['adc/backend:local-20261114','adc/admin:local-20261114','mysql@sha256:72c368d898861f3b3a07af0e6d690400f44f048799ed46822783d9224cc2c86d'],metadata=JSON.parse(await run(['image','inspect',...images])).map((info,i)=>({reference:images[i],id:info.Id,repo_digests:info.RepoDigests,os:info.Os,architecture:info.Architecture}))
for(const image of metadata){assert.equal(image.os,'linux');assert.equal(image.architecture,'amd64')}
assert.ok(metadata[2].repo_digests.includes(images[2]))
await run(['image','save','--output',path.join(destination,'images.tar'),...images]);await pipeline(fs.createReadStream(path.join(destination,'images.tar')),createGzip({level:1}),fs.createWriteStream(path.join(destination,'images.tar.gz'),{flags:'wx'}))
const archiveHash=await hash(path.join(destination,'images.tar.gz'));fs.writeFileSync(path.join(destination,'images.sha256'),archiveHash+'  images.tar.gz\n');fs.unlinkSync(path.join(destination,'images.tar')) // Only the file just created in this exclusive new directory.
const files=['ops/compose/compose.prod.yaml','ops/compose/compose.offline.yaml','ops/compose/mysql/bootstrap.sql','ops/compose/mysql/runtime-grants.sql','ops/compose/mysql/initialize-users.sh','ops/runbooks/isolated-deployment.md','ops/runbooks/new-clinic-management.md','ops/scripts/verify-candidate.py']
const fingerprints=[];for(const relative of files){const target=path.join(destination,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,relative),target);fingerprints.push({path:relative,sha256:await hash(target)})}
const manifest={date:new Date().toISOString(),release,status:'verified-isolated-candidate-not-production-approval',task_baseline:'ADC-TASKS-20261111-03',smoke_evidence:'docs/verification/database/container-smoke.json',real_wechat_verified:false,production_deployed:false,images:metadata,archive:{file:'images.tar.gz',sha256:archiveHash,bytes:fs.statSync(path.join(destination,'images.tar.gz')).size},backend_jar_sha256:await hash(path.join(root,'backend/target/adc-backend-0.1.0-SNAPSHOT.jar')),business_dictionary_sha256:await hash(path.join(root,'docs/diagrams/database/schema.json')),files:fingerprints,contains_secrets:false}
fs.writeFileSync(path.join(destination,'candidate.json'),JSON.stringify(manifest,null,2)+'\n');fs.copyFileSync(path.join(destination,'candidate.json'),path.join(evidence,'deployment-candidate.json'));console.log(JSON.stringify({directory:destination,archive_sha256:archiveHash,bytes:manifest.archive.bytes,contains_secrets:false}))
