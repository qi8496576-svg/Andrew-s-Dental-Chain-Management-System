import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {root,run} from '../deployment/cloud-ssh.mjs'
const privateRoot='D:/secrets/AndrewDental/LocalPreview',configFile=path.join(root,'ops/config/local-preview-ui.json'),old=JSON.parse(fs.readFileSync(configFile,'utf8')),image='adc/backend:self-registration-20261124-'+Date.now()
const env={...process.env,TEMP:path.join(root,'tmp/build-temp'),TMP:path.join(root,'tmp/build-temp'),DOCKER_HOST:'npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONFIG:path.join(root,'tmp/docker-config'),ADC_BACKEND_IMAGE:image,ADC_ADMIN_IMAGE:old.frontend_image,ADC_BACKEND_SECRETS_DIR:path.join(privateRoot,'backend'),ADC_MYSQL_ROOT_PASSWORD_FILE:path.join(privateRoot,'mysql-root'),ADC_MIGRATION_PASSWORD_FILE:path.join(privateRoot,'migration'),ADC_TLS_CERTIFICATE_FILE:path.join(privateRoot,'tls/localhost.crt'),ADC_TLS_PRIVATE_KEY_FILE:path.join(privateRoot,'tls/localhost.key'),ADC_DOMAIN:'localhost',ADC_HTTPS_BIND:'127.0.0.1',ADC_HTTPS_PORT:'19443',ADC_HTTPS_ORIGIN_PORT_SUFFIX:':19443',ADC_WECHAT_APP_ID:fs.readFileSync(path.join(privateRoot,'wechat-appid'),'utf8').trim()}
const docker='D:/ADC-Dev/Docker/app/resources/bin/docker.exe',command=args=>run(docker,args,{env}),compose=['compose','--project-name','adc-local-preview','-f',path.join(root,'ops/compose/compose.prod.yaml')]
const mysql=await command(['inspect','--format','{{.Id}}','adc-local-preview-mysql-1'])
await command(['build','--pull=false','--tag',image,path.join(root,'backend')])
try{await command([...compose,'up','-d','--no-deps','--no-build','--pull','never','--wait','--wait-timeout','120','backend'])}catch(error){env.ADC_BACKEND_IMAGE=old.backend_image;await command([...compose,'up','-d','--no-deps','--no-build','--pull','never','--wait','--wait-timeout','120','backend']);throw error}
assert.equal(await command(['inspect','--format','{{.Id}}','adc-local-preview-mysql-1']),mysql)
const {only_admin_recreated,backend_and_mysql_containers_preserved,...previousConfiguration}=old;const report={...previousConfiguration,date:new Date().toISOString(),backend_image:image,previous_backend_image:old.backend_image,database_container_preserved:true,migrations_run:false}
fs.writeFileSync(configFile,JSON.stringify(report,null,2)+'\n');fs.writeFileSync('docs/verification/patient-onboarding-20261124/local-backend.json',JSON.stringify(report,null,2)+'\n');console.log('Validated JAR built and healthy in local preview; database preserved')
