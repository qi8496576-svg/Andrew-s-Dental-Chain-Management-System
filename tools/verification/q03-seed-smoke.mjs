import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {spawn} from 'node:child_process'
import assert from 'node:assert/strict'
import {writeSeed} from '../../tests/performance/q03-seed.mjs'

// No external target argument: only the random, newly created container is writable.
assert.equal(process.argv.length,2,'External database targets are not supported')
const root=path.resolve(import.meta.dirname,'../..'),name='adc-q03-'+crypto.randomUUID(),network=name+'-net',
 work=path.join(root,'tmp',name),generated=path.join(work,'generated'),evidence=path.join(root,'docs/verification/performance'),
 docker=process.env.ADC_DOCKER_EXE||'D:/ADC-Dev/Docker/app/resources/bin/docker.exe',
 mysql='mysql@sha256:72c368d898861f3b3a07af0e6d690400f44f048799ed46822783d9224cc2c86d',
 backend=JSON.parse(fs.readFileSync(path.join(root,'docs/verification/patient-billing-20261125/application-update.json'))).candidate.images[0].id,
 env={...process.env,DOCKER_HOST:process.env.DOCKER_HOST||'npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONFIG:path.join(root,'tmp/docker-config')}
fs.mkdirSync(work,{mode:0o700});fs.mkdirSync(evidence,{recursive:true})
fs.writeFileSync(path.join(work,'mysql-root'),crypto.randomBytes(32).toString('base64'),{mode:0o444})
const log=fs.createWriteStream(path.join(evidence,'q03-seed-smoke.log')),steps=[]
function run(args,{input,capture=false,allowFailure=false}={}){return new Promise((resolve,reject)=>{const child=spawn(docker,args,{cwd:root,env,windowsHide:true});let output='';child.stdout.on('data',b=>{if(capture)output+=b;else log.write(b)});child.stderr.on('data',b=>log.write(b));child.on('error',reject);child.stdin.on('error',()=>{});child.on('exit',code=>{if(code===0||allowFailure)resolve({code,output});else reject(Error('Docker step failed ('+code+'); see q03-seed-smoke.log'))});if(input instanceof fs.ReadStream)input.pipe(child.stdin);else child.stdin.end(input)})}
const query=sql=>run(['exec','-i',name,'sh','-ec','MYSQL_PWD="$(cat /fixture/mysql-root)" exec mysql --user=root --batch --skip-column-names'],{input:sql,capture:true})
const result={date:new Date().toISOString(),task:'T053',kind:'real-mysql-synthetic-baseline-only',preview_or_cloud_modified:false,full_q03_executed:false,steps}
let ownNetwork=false,ownContainer=false
try{
 const asOf=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
 result.generated=await writeSeed(generated,asOf);steps.push('full_approved_scale_generated');console.log('Q03 seed generated; starting isolated MySQL')
 await run(['network','create','--internal',network]);ownNetwork=true
 await run(['run','-d','--name',name,'--label','adc.purpose=q03-owned-synthetic','--network',network,'--network-alias','mysql','--memory','768m','--mount',`type=bind,source=${work},target=/fixture,readonly`,'--env','MYSQL_ROOT_PASSWORD_FILE=/fixture/mysql-root','--env','MYSQL_ROOT_HOST=%',mysql,'--lower-case-table-names=0','--default-time-zone=+00:00']);ownContainer=true
 let ready=false
 for(let n=0;n<90;n++){try{await query('SELECT 1;');ready=true;break}catch{}await new Promise(resolve=>setTimeout(resolve,1000))}
 assert.ok(ready,'New MySQL failed to start')
 await query(fs.readFileSync(path.join(root,'ops/compose/mysql/bootstrap.sql'),'utf8'))
 await run(['run','--rm','--network',network,'--mount',`type=bind,source=${work},target=/fixture,readonly`,
 '--env','ADC_MIGRATION_URL=jdbc:mysql://mysql:3306/adc_identity?connectionTimeZone=UTC&allowPublicKeyRetrieval=true&sslMode=DISABLED',
 '--env','ADC_MIGRATION_USERNAME=root','--env','ADC_MIGRATION_PASSWORD_FILE=/fixture/mysql-root','--entrypoint','java',backend,
 '-Xmx192m','-Dloader.main=com.adc.infrastructure.MigrationMain','-cp','/app/app.jar','org.springframework.boot.loader.launch.PropertiesLauncher'])
 steps.push('approved_flyway_migrations_applied');console.log('Migrations passed; loading full synthetic baseline')
 const tables=JSON.parse((await query("SELECT JSON_ARRAYAGG(TABLE_NAME) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='adc_business';")).output.trim())
 assert.equal(tables.length,24)
 for(const table of tables){assert.match(table,/^[A-Za-z]+$/);assert.equal((await query('SELECT COUNT(*) FROM adc_business.`'+table+'`;')).output.trim(),'0','Refuse nonempty target')}
 const uuid=(await query('SELECT @@server_uuid;')).output.trim();assert.match(uuid,/^[a-f0-9-]{36}$/)
 await query(fs.createReadStream(path.join(generated,'seed-q03.sql')));steps.push('full_seed_committed_with_all_foreign_keys_and_checks')
 result.counts=JSON.parse((await query(fs.readFileSync(path.join(root,'tests/performance/capture-baseline.sql'),'utf8'))).output.trim())
 assert.equal(result.counts.server_uuid,uuid)
 for(const [key,expected]of Object.entries({clinics:30,dentists:100,patients:10000,appointments:100000,applied_treatments:200000}))assert.equal(result.counts[key],expected,key)
 fs.writeFileSync(path.join(evidence,'q03-count-capture-isolated.json'),JSON.stringify(result.counts,null,2)+'\n')
 result.inventory=JSON.parse((await query(fs.readFileSync(path.join(root,'tests/performance/verify-inventory.sql'),'utf8'))).output.trim())
 for(const [key,expected]of Object.entries({business_tables:24,business_columns:209,business_foreign_keys:44,care_inventory:50000,invoice_inventory:50000,preexisting_invoices:0,duplicate_occupied_slots:0,ineligible_treatments:0,missing_state_events:0}))assert.equal(result.inventory[key],expected,key)
 steps.push('real_counts_schema_and_inventory_checks_passed');result.passed=true
}catch(error){result.passed=false;result.error=error.message;process.exitCode=1}
finally{
 // Names are internal UUIDs with the fixed test prefix, never caller-provided.
 assert.match(name,/^adc-q03-[0-9a-f-]{36}$/)
 if(ownContainer)await run(['rm','-f','-v',name],{allowFailure:true})
 if(ownNetwork)await run(['network','rm',network],{allowFailure:true})
 result.owned_test_resources_removed=ownContainer
 fs.writeFileSync(path.join(evidence,'q03-seed-smoke.json'),JSON.stringify(result,null,2)+'\n');log.end()
 console.log(JSON.stringify({passed:result.passed,steps,counts:result.counts,full_q03_executed:false,error:result.error}))
}
