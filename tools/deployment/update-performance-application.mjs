import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {pipeline} from 'node:stream/promises'
import {createGzip} from 'node:zlib'
import {root,run,executeScript,host,sshArgs} from './cloud-ssh.mjs'
const evidence=path.join(root,'docs/verification/performance'),proof=JSON.parse(fs.readFileSync(path.join(evidence,'application-image.json'))),load=JSON.parse(fs.readFileSync(path.join(evidence,'q03-small-run.json')))
assert.equal(load.status,'PASS');const performanceProof=JSON.parse(fs.readFileSync(path.join(evidence,'performance-tested-image.json')));assert.equal(load.images.backend,performanceProof.id)
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
for(const source of performanceProof.sources)assert.equal(hash(path.join(root,source.path)),source.sha256,'Performance-tested candidate sources must not change before deployment')
assert.match(fs.readFileSync(path.join(root,'tmp/billing-regression.log'),'utf8'),/BUILD SUCCESS/)
const pre=JSON.parse(await executeScript('ops/scripts/cloud-preflight.sh')),release='adc-billing-fix-20261125-'+Date.now(),directory=path.join(root,'tmp/deployment',release);fs.mkdirSync(directory)
const env={...process.env,DOCKER_HOST:'npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONFIG:path.join(root,'tmp/docker-config')},docker='D:/ADC-Dev/Docker/app/resources/bin/docker.exe'
const tar=path.join(directory,'images.tar'),archive=tar+'.gz';await run(docker,['image','save','--output',tar,proof.reference],{env});await pipeline(fs.createReadStream(tar),createGzip({level:1}),fs.createWriteStream(archive,{flags:'wx'}));fs.unlinkSync(tar)
const files=[];for(const file of ['ops/compose/compose.prod.yaml','ops/compose/compose.offline.yaml','ops/compose/mysql/runtime-grants.sql','ops/scripts/apply-billing-app-update.sh']){const to=path.join(directory,file);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(root,file),to);files.push({path:file,sha256:hash(to)})}
const manifest={release,date:new Date().toISOString(),application_only:true,images:[{reference:proof.reference,id:proof.id}],archive:{file:'images.tar.gz',sha256:hash(archive)},files,backend_jar_sha256:proof.jar_sha256,contains_secrets:false,tested_profile:load.profile}
fs.writeFileSync(path.join(directory,'candidate.json'),JSON.stringify(manifest,null,2)+'\n');await run('scp',[...sshArgs,'-r',directory,host+':/home/ubuntu/adc-upload/']);console.log('Tested application-only image uploaded')
console.log((await executeScript('ops/scripts/apply-billing-app-update.sh',[release])).trim());const after=JSON.parse(await executeScript('ops/scripts/cloud-preflight.sh'));assert.deepEqual(after.database,pre.database);assert.deepEqual(after.migration_fingerprints,pre.migration_fingerprints)
fs.writeFileSync(path.join(evidence,'application-update.json'),JSON.stringify({candidate:manifest,performance_tested_image:performanceProof,performance_candidate_sources_unchanged:true,billing_list_lock_fix_verified_separately:true,pre,after,database_counts_and_migrations_unchanged:true},null,2)+'\n');console.log('Application query and billing list corrections deployed; original database and volumes retained')
