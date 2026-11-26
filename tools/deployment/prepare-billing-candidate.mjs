import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {pipeline} from 'node:stream/promises'
import {createGzip} from 'node:zlib'
import {root,run,executeScript,host,sshArgs} from './cloud-ssh.mjs'
const evidence=path.join(root,'docs/verification/patient-billing-20261125');fs.mkdirSync(evidence,{recursive:true})
const release='adc-billing-20261125-'+Date.now(),directory=path.join(root,'tmp/deployment',release);fs.mkdirSync(directory)
const env={...process.env,DOCKER_HOST:'npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONFIG:path.join(root,'tmp/docker-config')}
const docker='D:/ADC-Dev/Docker/app/resources/bin/docker.exe',dr=args=>run(docker,args,{env})
const hash=async file=>{const h=crypto.createHash('sha256');for await(const b of fs.createReadStream(file))h.update(b);return h.digest('hex')}
assert.match(fs.readFileSync(path.join(root,'tmp/billing-regression.log'),'utf8'),/BUILD SUCCESS/)
const preflight=JSON.parse(await executeScript('ops/scripts/cloud-preflight.sh'));assert.deepEqual(Object.values(preflight.database).slice(0,4),[19,163,30,33]);fs.writeFileSync(path.join(evidence,'before.json'),JSON.stringify(preflight,null,2)+'\n')
const backend='adc/backend:'+release,admin='adc/admin:'+release
await dr(['build','--pull=false','--tag',backend,path.join(root,'backend')]);console.log('Backend image built')
await run(process.execPath,[path.join(root,'apps/admin/node_modules/vite/bin/vite.js'),'build'],{cwd:path.join(root,'apps/admin')});
await dr(['build','--pull=false','--tag',admin,path.join(root,'apps/admin')]);console.log('Admin image built')
const images=JSON.parse(await dr(['image','inspect',backend,admin])).map((v,i)=>({reference:[backend,admin][i],id:v.Id,os:v.Os,architecture:v.Architecture}));for(const image of images){assert.equal(image.os,'linux');assert.equal(image.architecture,'amd64')}
const tar=path.join(directory,'images.tar'),archive=tar+'.gz';await dr(['image','save','--output',tar,backend,admin]);await pipeline(fs.createReadStream(tar),createGzip({level:1}),fs.createWriteStream(archive,{flags:'wx'}));fs.unlinkSync(tar)
const files=['ops/compose/compose.prod.yaml','ops/compose/compose.offline.yaml','ops/compose/mysql/runtime-grants.sql','ops/scripts/apply-billing-integration.sh'];const fingerprints=[]
for(const file of files){const to=path.join(directory,file);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(root,file),to);fingerprints.push({path:file,sha256:await hash(to)})}
const manifest={release,date:new Date().toISOString(),scope:'owner-approved synthetic integration; demo payment only; no real charge',images,archive:{file:'images.tar.gz',sha256:await hash(archive),bytes:fs.statSync(archive).size},backend_jar_sha256:await hash(path.join(root,'backend/target/adc-backend-0.1.0-SNAPSHOT.jar')),business_dictionary_sha256:await hash(path.join(root,'docs/diagrams/database/schema.json')),files:fingerprints,local_directory:directory,expected_database:{tables:24,columns:209,foreign_keys:44,migrations:34},contains_secrets:false}
fs.writeFileSync(path.join(directory,'candidate.json'),JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(path.join(evidence,'candidate.json'),JSON.stringify(manifest,null,2)+'\n')
await run('scp',[...sshArgs,'-r',directory,host+':/home/ubuntu/adc-upload/']);console.log(JSON.stringify({release,staged_upload:true,archive_sha256:manifest.archive.sha256,services_changed:false}))
