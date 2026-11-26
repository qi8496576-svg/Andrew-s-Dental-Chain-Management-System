import fs from 'node:fs'
import path from 'node:path'
import {spawn} from 'node:child_process'
import https from 'node:https'
import net from 'node:net'
import assert from 'node:assert/strict'
const root=path.resolve(import.meta.dirname,'../..'),config=JSON.parse(fs.readFileSync(path.join(root,'ops/config/tencent-environment.json')))
const args=['-i',config.private_key_location_only,'-o','BatchMode=yes','-o','ConnectTimeout=10','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+path.join(root,'tmp/tencent-known-hosts')],host=config.ssh_user+'@'+config.public_ip
function remote(command){return new Promise((resolve,reject)=>{const child=spawn('ssh',[...args,host,command],{windowsHide:true});let data='',error='';child.stdout.on('data',b=>data+=b);child.stderr.on('data',b=>error+=b);child.on('error',reject);child.on('exit',code=>code===0?resolve(data):reject(Error('Read-only SSH failed: '+error)))})}
const ca=await remote('sudo -n cat /opt/andrew-dental/private/LoopbackTLS/localhost.crt')
assert.ok(ca.includes('BEGIN CERTIFICATE'))
await new Promise((resolve,reject)=>{const server=net.createServer();server.on('error',reject);server.listen(24443,'127.0.0.1',()=>server.close(resolve))})
const tunnel=spawn('ssh',[...args,'-o','ExitOnForwardFailure=yes','-N','-T','-L','127.0.0.1:24443:127.0.0.1:24443',host],{windowsHide:true})
let tunnelError='';tunnel.stderr.on('data',b=>tunnelError+=b);let startError;tunnel.on('error',e=>startError=e)
const request=(method,url,body)=>new Promise((resolve,reject)=>{const req=https.request({hostname:'localhost',port:24443,path:url,method,ca,headers:body?{'Content-Type':'application/json'}:{}},res=>{const authorized=res.socket.authorized;res.resume();res.on('end',()=>resolve({status:res.statusCode,tls_authorized:authorized}))});req.on('error',reject);req.setTimeout(6000,()=>req.destroy(Error('HTTPS timeout')));req.end(body)})
const result={date:new Date().toISOString(),task:'T050',kind:'ssh-tunnel-isolated-cloud-integration',public_website_enabled:false,formal_domain_verified:false,production_release:false}
try{
 let online=false
 for(let i=0;i<20;i++){if(startError)throw startError;if(tunnel.exitCode!==null)throw Error('Tunnel stopped: '+tunnelError);try{const response=await request('GET','/');assert.equal(response.status,200);assert.ok(response.tls_authorized);online=true;break}catch{}await new Promise(r=>setTimeout(r,500))}
 assert.ok(online,'Tunnel HTTPS did not become available')
 result.frontend_status=200;result.tls_ca_verified=true
 const anonymous=await request('GET','/api/v1/me');assert.equal(anonymous.status,401);result.anonymous_protected_api_status=anonymous.status
 const invalid=await request('POST','/api/v1/auth/wechat-sessions','{}');assert.equal(invalid.status,400);result.empty_wechat_code_status=invalid.status
 const listeners=await remote("ss -ltnH '( sport = :24443 )'")
 assert.match(listeners,/127\.0\.0\.1:24443/);assert.doesNotMatch(listeners,/0\.0\.0\.0:24443|\[::\]:24443/)
 result.loopback_only=true;result.passed=true
}catch(error){result.passed=false;result.error=error.message;process.exitCode=1}
finally{tunnel.kill();fs.writeFileSync(path.join(root,'docs/verification/tencent-loopback-readiness.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result))}
