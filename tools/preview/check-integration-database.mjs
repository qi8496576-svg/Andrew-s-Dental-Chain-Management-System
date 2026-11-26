import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
const reportFile='docs/verification/local-patient-admin.json',report=JSON.parse(fs.readFileSync(reportFile,'utf8'))
assert.equal(report.status,'PASS')
const {appointment_id:cancelled,attended_appointment_id:attended}=report.fixture
assert.ok([cancelled,attended].every(id=>/^\d+$/.test(id)))
const input=`SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='adc_business';
SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='adc_business';
SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA='adc_business';
SELECT status FROM adc_business.Appointment WHERE appointment_id=${cancelled};
SELECT status FROM adc_business.Appointment WHERE appointment_id=${attended};`
const result=spawnSync('D:/ADC-Dev/Docker/app/resources/bin/docker.exe',['exec','-i','adc-local-preview-mysql-1','sh','-ec','MYSQL_PWD="$(cat /run/secrets/mysql_root_password)" exec mysql --user=root --batch --skip-column-names'],{env:{...process.env,DOCKER_HOST:'npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONFIG:path.resolve('tmp/docker-config')},input,encoding:'utf8',windowsHide:true})
assert.equal(result.status,0,'Local MySQL verification failed')
const rows=result.stdout.trim().split(/\r?\n/)
assert.deepEqual(rows,['19','163','30','CANCELLED','IN_PROGRESS'])
report.database_verification={business_tables:19,business_columns:163,business_foreign_keys:30,cancelled_status:'CANCELLED',attended_status:'IN_PROGRESS',source:'direct read of adc-local-preview-mysql-1',checked_at:new Date().toISOString()}
fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report.database_verification))
