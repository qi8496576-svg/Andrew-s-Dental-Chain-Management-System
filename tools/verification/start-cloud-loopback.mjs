import fs from 'node:fs'
import path from 'node:path'
import {spawn} from 'node:child_process'
import assert from 'node:assert/strict'
const root=path.resolve(import.meta.dirname,'../..'),config=JSON.parse(fs.readFileSync(path.join(root,'ops/config/tencent-environment.json')))
assert.equal(config.public_ip,'43.139.92.113');assert.equal(config.project_directory,'/opt/andrew-dental')
const script=fs.readFileSync(path.join(root,'ops/scripts/start-loopback-integration.sh'),'utf8').replaceAll('\r\n','\n')
const log=fs.createWriteStream(path.join(root,'docs/verification/tencent-loopback-start.log'))
const code=await new Promise((resolve,reject)=>{const child=spawn('ssh',['-i',config.private_key_location_only,'-o','BatchMode=yes','-o','ConnectTimeout=10','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+path.join(root,'tmp/tencent-known-hosts'),config.ssh_user+'@'+config.public_ip,'sudo -n env ADC_ISOLATED_LOOPBACK=acknowledged sh -s'],{windowsHide:true});child.on('error',reject);child.stdout.on('data',b=>log.write(b));child.stderr.on('data',b=>log.write(b));child.stdin.on('error',()=>{});child.stdin.end(script);child.on('exit',resolve)})
log.end();console.log(JSON.stringify({cloud_loopback_start_passed:code===0,log:'docs/verification/tencent-loopback-start.log',public_website_enabled:false}));if(code!==0)process.exitCode=1
