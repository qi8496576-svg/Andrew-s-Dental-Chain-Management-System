import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
const root=path.resolve(import.meta.dirname,'../..'),privateRoot='D:/secrets/AndrewDental/LocalPreview'
const candidate=JSON.parse(fs.readFileSync(path.join(root,'docs/verification/database/deployment-candidate.json'),'utf8'))
const docker='D:/ADC-Dev/Docker/app/resources/bin/docker.exe',image=process.env.ADC_ADMIN_IMAGE??'adc/admin:workspace-20261118'
if(!/^adc\/admin:[a-zA-Z0-9._-]+$/.test(image))throw new Error('Admin preview image must be a local adc/admin tag')
const env={...process.env,TEMP:path.join(root,'tmp/build-temp'),TMP:path.join(root,'tmp/build-temp'),DOCKER_HOST:'npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONFIG:path.join(root,'tmp/docker-config'),ADC_BACKEND_IMAGE:candidate.images[0].id,ADC_ADMIN_IMAGE:image,ADC_BACKEND_SECRETS_DIR:path.join(privateRoot,'backend'),ADC_MYSQL_ROOT_PASSWORD_FILE:path.join(privateRoot,'mysql-root'),ADC_MIGRATION_PASSWORD_FILE:path.join(privateRoot,'migration'),ADC_TLS_CERTIFICATE_FILE:path.join(privateRoot,'tls/localhost.crt'),ADC_TLS_PRIVATE_KEY_FILE:path.join(privateRoot,'tls/localhost.key'),ADC_DOMAIN:'localhost',ADC_HTTPS_BIND:'127.0.0.1',ADC_HTTPS_PORT:'19443',ADC_HTTPS_ORIGIN_PORT_SUFFIX:':19443',ADC_WECHAT_APP_ID:fs.readFileSync(path.join(privateRoot,'wechat-appid'),'utf8').trim()}
async function run(args){return new Promise((resolve,reject)=>{const child=spawn(docker,args,{cwd:root,env,windowsHide:true});let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);child.on('error',reject);child.on('exit',code=>code===0?resolve(output):reject(new Error(output)))})}
const configFile=path.join(root,'ops/config/local-preview-ui.json');if(fs.existsSync(configFile)){const ui=JSON.parse(fs.readFileSync(configFile,'utf8'));if(ui.backend_image)env.ADC_BACKEND_IMAGE=ui.backend_image}
const compose=['compose','--project-name','adc-local-preview','-f',path.join(root,'ops/compose/compose.prod.yaml')]
const before=JSON.parse(await run([...compose,'ps','--format','json']).then(s=>s.trim().startsWith('[')?s:'['+s.trim().split('\n').join(',')+']'))
if(!['mysql','backend','admin'].every(name=>before.some(s=>s.Service===name&&s.State==='running')))throw new Error('Existing local preview must be running; this command does not initialize it')
// The runtime Dockerfile copies dist; always compile current sources first.
await new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[path.join(root,'apps/admin/node_modules/vite/bin/vite.js'),'build'],{cwd:path.join(root,'apps/admin'),env,windowsHide:true});let output=''
 child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);child.on('error',reject)
 child.on('exit',code=>code===0?resolve():reject(new Error('Admin production build failed: '+output)))
})
await run(['build','--pull=false','--tag',image,path.join(root,'apps/admin')])
await run([...compose,'up','-d','--no-deps','--no-build','--pull','never','--wait','--wait-timeout','60','admin'])
const after=JSON.parse(await run([...compose,'ps','--format','json']).then(s=>s.trim().startsWith('[')?s:'['+s.trim().split('\n').join(',')+']'))
for(const service of ['mysql','backend'])if(before.find(s=>s.Service===service)?.ID!==after.find(s=>s.Service===service)?.ID)throw new Error('Unexpected backend/database container change')
const evidence={date:new Date().toISOString(),project:'adc-local-preview',frontend_image:image,backend_image:env.ADC_BACKEND_IMAGE,url:'https://localhost:19443',current_sources_built:true,only_admin_recreated:true,backend_and_mysql_containers_preserved:true}
fs.writeFileSync(path.join(root,'ops/config/local-preview-ui.json'),JSON.stringify(evidence,null,2)+'\n')
fs.writeFileSync(path.join(root,'docs/verification/ui-stage1-deployment.json'),JSON.stringify(evidence,null,2)+'\n')
console.log(JSON.stringify(evidence))
