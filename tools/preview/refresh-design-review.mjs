import fs from 'node:fs'
import path from 'node:path'
import {spawn} from 'node:child_process'
import assert from 'node:assert/strict'

// Updates only the existing loopback preview. No migrations, fixture seeding or volume operations.
const root=path.resolve(import.meta.dirname,'../..'),privateRoot='D:/secrets/AndrewDental/LocalPreview'
const evidenceDir=path.join(root,'docs/verification/admin-review-20261123')
const docker='D:/ADC-Dev/Docker/app/resources/bin/docker.exe',backendImage='adc/backend:design-review-20261123',frontendImage='adc/admin:design-review-20261123'
const env={...process.env,TEMP:path.join(root,'tmp/build-temp'),TMP:path.join(root,'tmp/build-temp'),DOCKER_HOST:'npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONFIG:path.join(root,'tmp/docker-config'),ADC_BACKEND_IMAGE:backendImage,ADC_ADMIN_IMAGE:frontendImage,ADC_BACKEND_SECRETS_DIR:path.join(privateRoot,'backend'),ADC_MYSQL_ROOT_PASSWORD_FILE:path.join(privateRoot,'mysql-root'),ADC_MIGRATION_PASSWORD_FILE:path.join(privateRoot,'migration'),ADC_TLS_CERTIFICATE_FILE:path.join(privateRoot,'tls/localhost.crt'),ADC_TLS_PRIVATE_KEY_FILE:path.join(privateRoot,'tls/localhost.key'),ADC_DOMAIN:'localhost',ADC_HTTPS_BIND:'127.0.0.1',ADC_HTTPS_PORT:'19443',ADC_HTTPS_ORIGIN_PORT_SUFFIX:':19443',ADC_WECHAT_APP_ID:fs.readFileSync(path.join(privateRoot,'wechat-appid'),'utf8').trim()}
const compose=['compose','--project-name','adc-local-preview','-f',path.join(root,'ops/compose/compose.prod.yaml')]
async function run(executable,args,cwd=root){return new Promise((resolve,reject)=>{const child=spawn(executable,args,{cwd,env,windowsHide:true});let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);child.on('error',reject);child.on('exit',code=>code===0?resolve(output):reject(new Error(output)))})}
const command=args=>run(docker,args)
async function status(){const output=(await command([...compose,'ps','--format','json'])).trim();return output.startsWith('[')?JSON.parse(output):output.split('\n').filter(Boolean).map(s=>JSON.parse(s))}
fs.mkdirSync(evidenceDir,{recursive:true})
const rollbackFile=path.join(evidenceDir,'rollback.json'),configFile=path.join(root,'ops/config/local-preview-ui.json')
const before=await status()
assert.ok(['mysql','backend','admin'].every(name=>before.some(s=>s.Service===name&&s.State==='running')),'Existing preview must already be running')
if(process.argv.includes('--rollback')){
 const saved=JSON.parse(fs.readFileSync(rollbackFile,'utf8'))
 env.ADC_BACKEND_IMAGE=saved.backend_image;env.ADC_ADMIN_IMAGE=saved.frontend_image
 await command([...compose,'up','-d','--no-deps','--no-build','--pull','never','--wait','--wait-timeout','120','backend','admin'])
 if(saved.ui_config)fs.writeFileSync(configFile,JSON.stringify(saved.ui_config,null,2)+'\n')
 console.log('Previous local preview images restored. Database volume unchanged.')
}else{
 if(!fs.existsSync(rollbackFile)){
  const images=JSON.parse(await command(['inspect',...['backend','admin'].map(name=>before.find(s=>s.Service===name).ID),'--format','{{json .Image}}']).then(s=>'['+s.trim().split('\n').join(',')+']'))
  fs.writeFileSync(rollbackFile,JSON.stringify({backend_image:images[0],frontend_image:images[1],ui_config:fs.existsSync(configFile)?JSON.parse(fs.readFileSync(configFile,'utf8')):null},null,2)+'\n')
 }
 console.log('Building current admin sources and local images…')
 await run(process.execPath,[path.join(root,'apps/admin/node_modules/vite/bin/vite.js'),'build'],path.join(root,'apps/admin'))
 await command(['build','--pull=false','--tag',backendImage,path.join(root,'backend')])
 await command(['build','--pull=false','--tag',frontendImage,path.join(root,'apps/admin')])
 try{
  console.log('Replacing backend/admin only; waiting for health checks…')
  await command([...compose,'up','-d','--no-deps','--no-build','--pull','never','--wait','--wait-timeout','120','backend','admin'])
  const after=await status()
  assert.equal(after.find(s=>s.Service==='mysql').ID,before.find(s=>s.Service==='mysql').ID,'MySQL container must be preserved')
  assert.ok(after.filter(s=>['backend','admin'].includes(s.Service)).every(s=>s.State==='running'&&s.Health==='healthy'))
  const evidence={date:new Date().toISOString(),project:'adc-local-preview',frontend_image:frontendImage,backend_image:backendImage,url:'https://localhost:19443',theme_primary:'#17778b',current_sources_built:true,database_container_preserved:true,migrations_run:false,production_deployed:false,rollback_command:'node tools/preview/refresh-design-review.mjs --rollback'}
  fs.writeFileSync(configFile,JSON.stringify(evidence,null,2)+'\n');fs.writeFileSync(path.join(evidenceDir,'deployment.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence))
 }catch(error){
  const saved=JSON.parse(fs.readFileSync(rollbackFile,'utf8'));env.ADC_BACKEND_IMAGE=saved.backend_image;env.ADC_ADMIN_IMAGE=saved.frontend_image
  await command([...compose,'up','-d','--no-deps','--no-build','--pull','never','--wait','--wait-timeout','120','backend','admin'])
  throw new Error('New preview was not healthy; restored previous images. '+error.message)
 }
}
