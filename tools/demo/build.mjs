import fs from 'node:fs'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'
const root=path.resolve(import.meta.dirname,'../..')
assert.equal(Number(process.versions.node.split('.')[0]),24,'Use Node.js 24 (>=24.12) and npm 11')
const report={started_at:new Date().toISOString(),node:process.version,steps:[]}
const out=path.join(root,'tmp/reproduction');fs.mkdirSync(out,{recursive:true})
function run(name,command,args,cwd=root){console.log(name);const log=path.join(out,name+'.log'),fd=fs.openSync(log,'w');let r;try{r=spawnSync(command,args,{cwd,stdio:['ignore',fd,fd],windowsHide:true,shell:process.platform==='win32'&&command.endsWith('.cmd')})}finally{fs.closeSync(fd)}report.steps.push({name,exit_code:r.status,log:'tmp/reproduction/'+name+'.log'});fs.writeFileSync(path.join(out,'build.json'),JSON.stringify(report,null,2));if(r.error||r.status!==0){console.error(fs.readFileSync(log,'utf8').slice(-8000));throw r.error||Error(name+' failed')}console.log(name+' passed')}
const npm=process.platform==='win32'?'npm.cmd':'npm'
// Admin imports shared patient types, so install/compile the patient package first.
for(const [key,dir] of [['contracts','packages/contracts'],['mini','apps/patient-miniprogram'],['admin','apps/admin']]){
 const cwd=path.join(root,dir);run(key+'-install',npm,['ci','--no-fund'],cwd)
 if(key==='contracts')run('contracts-verify',npm,['run','verify'],cwd)
 if(key==='admin')for(const cmd of ['typecheck','test','build'])run('admin-'+cmd,npm,['run',cmd],cwd)
 if(key==='mini')run('mini-verify',npm,['run','verify'],cwd)
}
const miniTests=fs.readdirSync(path.join(root,'tests/unit')).filter(x=>/^mini-.*\.test\.mjs$/.test(x)).map(x=>'tests/unit/'+x)
run('mini-test-compile',process.execPath,[path.join(root,'apps/patient-miniprogram/node_modules/typescript/bin/tsc'),'-p',path.join(root,'apps/patient-miniprogram/tsconfig.json'),'--outDir',path.join(root,'tmp/mini-http-test')])
run('mini-tests',process.execPath,['--test',...miniTests])
const backend=path.join(root,'backend'),mvn=process.platform==='win32'?'mvnw.cmd':'./mvnw'
run('backend-package',mvn,['--batch-mode','--no-transfer-progress','--settings','.mvn/settings.xml',...(process.env.ADC_MAVEN_REPOSITORY?['-Dmaven.repo.local='+process.env.ADC_MAVEN_REPOSITORY]:[]),'package'],backend)
report.finished_at=new Date().toISOString();report.success=true;fs.writeFileSync(path.join(out,'build.json'),JSON.stringify(report,null,2)+'\n');console.log('Build complete. Next: node tools/demo/demo.mjs up')
