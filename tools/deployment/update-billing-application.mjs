import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {pipeline} from 'node:stream/promises'
import {createGzip} from 'node:zlib'
import {root,run,executeScript,host,sshArgs} from './cloud-ssh.mjs'
const evidence=path.join(root,'docs/verification/patient-billing-20261125')
assert.match(fs.readFileSync(path.join(root,'tmp/billing-regression.log'),'utf8'),/Tests run: 16, Failures: 0, Errors: 0, Skipped: 0/)
assert.match(fs.readFileSync(path.join(root,'tmp/billing-regression.log'),'utf8'),/BUILD SUCCESS/)
const pre=JSON.parse(await executeScript('ops/scripts/cloud-preflight.sh'));assert.deepEqual(Object.values(pre.database).slice(0,4),[24,209,44,34])
const release='adc-billing-fix-20261125-'+Date.now(),directory=path.join(root,'tmp/deployment',release);fs.mkdirSync(directory)
const env={...process.env,DOCKER_HOST:'npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONFIG:path.join(root,'tmp/docker-config')}
const dr=args=>run('D:/ADC-Dev/Docker/app/resources/bin/docker.exe',args,{env})
const hash=async file=>{const h=crypto.createHash('sha256');for await(const b of fs.createReadStream(file))h.update(b);return h.digest('hex')}
const reference='adc/backend:'+release;await dr(['build','--pull=false','--tag',reference,path.join(root,'backend')]);console.log('Corrected backend image built')
const value=JSON.parse(await dr(['image','inspect',reference]))[0];assert.equal(value.Os,'linux');assert.equal(value.Architecture,'amd64')
const tar=path.join(directory,'images.tar'),archive=tar+'.gz';await dr(['image','save','--output',tar,reference]);await pipeline(fs.createReadStream(tar),createGzip({level:1}),fs.createWriteStream(archive,{flags:'wx'}));fs.unlinkSync(tar)
const files=[]
for(const file of ['ops/compose/compose.prod.yaml','ops/compose/compose.offline.yaml','ops/compose/mysql/runtime-grants.sql','ops/scripts/apply-billing-app-update.sh']){const to=path.join(directory,file);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(root,file),to);files.push({path:file,sha256:await hash(to)})}
const manifest={release,date:new Date().toISOString(),application_only:true,images:[{reference,id:value.Id}],archive:{file:'images.tar.gz',sha256:await hash(archive)},files,backend_jar_sha256:await hash(path.join(root,'backend/target/adc-backend-0.1.0-SNAPSHOT.jar')),contains_secrets:false}
fs.writeFileSync(path.join(directory,'candidate.json'),JSON.stringify(manifest,null,2)+'\n')
await run('scp',[...sshArgs,'-r',directory,host+':/home/ubuntu/adc-upload/']);console.log('Verified app-only candidate uploaded')
console.log((await executeScript('ops/scripts/apply-billing-app-update.sh',[release])).trim())
const after=JSON.parse(await executeScript('ops/scripts/cloud-preflight.sh'));assert.deepEqual(after.database,pre.database);assert.deepEqual(after.migration_fingerprints,pre.migration_fingerprints)
fs.writeFileSync(path.join(evidence,'application-update.json'),JSON.stringify({candidate:manifest,pre,after,database_counts_and_migrations_unchanged:true},null,2)+'\n')
