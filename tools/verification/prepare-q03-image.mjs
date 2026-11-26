import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {root,run} from '../deployment/cloud-ssh.mjs'
assert.match(fs.readFileSync(path.join(root,'tmp/billing-regression.log'),'utf8'),/BUILD SUCCESS/)
const reference='adc/backend:adc-q03-small-20261125-'+Date.now(),env={...process.env,DOCKER_HOST:'npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONFIG:path.join(root,'tmp/docker-config')},docker='D:/ADC-Dev/Docker/app/resources/bin/docker.exe'
await run(docker,['build','--pull=false','--tag',reference,path.join(root,'backend')],{env})
const image=JSON.parse(await run(docker,['image','inspect',reference],{env}))[0],hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex'),sources=['backend/src/main/java/com/adc/application/AppointmentBookingService.java','backend/src/main/java/com/adc/infrastructure/AppointmentBookingStore.java']
const proof={reference,id:image.Id,jar_sha256:hash('backend/target/adc-backend-0.1.0-SNAPSHOT.jar'),sources:sources.map(p=>({path:p,sha256:hash(p)})),created_at:new Date().toISOString()};fs.writeFileSync(path.join(root,'docs/verification/performance/application-image.json'),JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify({reference,id:image.Id}))
