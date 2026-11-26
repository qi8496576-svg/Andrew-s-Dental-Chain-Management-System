import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {pipeline} from 'node:stream/promises'
import {Transform} from 'node:stream'
import {root,host,sshArgs,run} from './cloud-ssh.mjs'
const privateRoot='D:/secrets/AndrewDental/CloudIntegration/RecoveryBackups',stamp=new Date().toISOString().replaceAll(/[:.]/g,'-'),directory=path.join(privateRoot,stamp);fs.mkdirSync(directory,{recursive:true})
async function transfer(mode,destination,transform){
 const child=spawn('ssh',[...sshArgs,host,'sudo -n bash -s -- '+mode],{windowsHide:true});let stderr='';child.stderr.on('data',b=>stderr+=b)
 const finished=new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Controlled recovery transfer failed: '+stderr.slice(-600))))})
 child.stdin.on('error',()=>{});child.stdin.end(fs.readFileSync(path.join(root,'ops/scripts/recovery-transfer.sh')))
 await Promise.all([transform?pipeline(child.stdout,transform,fs.createWriteStream(destination,{flags:'wx',mode:0o600})):pipeline(child.stdout,fs.createWriteStream(destination,{flags:'wx',mode:0o600})),finished])
}
await transfer('backups',path.join(directory,'backups.tar.gz'))
const verification=JSON.parse(await run('C:/Users/LiuYang/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',[path.join(root,'tools/verification/verify-recovery-transfer.py'),directory]));assert.equal(verification.status,'PASS')
const keys='D:/secrets/AndrewDental/RecoveryKeys';fs.mkdirSync(keys,{recursive:true});const keyFile=path.join(keys,'configuration-aes256gcm.key');if(!fs.existsSync(keyFile))fs.writeFileSync(keyFile,crypto.randomBytes(32),{flags:'wx',mode:0o600});const key=fs.readFileSync(keyFile);assert.equal(key.length,32)
const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv),plainHash=crypto.createHash('sha256');const observe=new Transform({transform(chunk,encoding,callback){plainHash.update(chunk);callback(null,chunk)}})
const child=spawn('ssh',[...sshArgs,host,'sudo -n bash -s -- configuration'],{windowsHide:true});let stderr='';child.stderr.on('data',b=>stderr+=b);const finish=new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Configuration backup failed: '+stderr.slice(-600))))});child.stdin.on('error',()=>{});child.stdin.end(fs.readFileSync(path.join(root,'ops/scripts/recovery-transfer.sh')))
const encrypted=path.join(directory,'configuration.enc');await Promise.all([pipeline(child.stdout,observe,cipher,fs.createWriteStream(encrypted,{flags:'wx',mode:0o600})),finish]);const tag=cipher.getAuthTag();const ciphertext=fs.readFileSync(encrypted),decipher=crypto.createDecipheriv('aes-256-gcm',key,iv);decipher.setAuthTag(tag);const clear=Buffer.concat([decipher.update(ciphertext),decipher.final()]);assert.equal(crypto.createHash('sha256').update(clear).digest('hex'),plainHash.digest('hex'));clear.fill(0)
fs.writeFileSync(path.join(directory,'configuration-metadata.json'),JSON.stringify({format:'AES-256-GCM',iv:iv.toString('hex'),tag:tag.toString('hex'),key_location_only:keyFile,ciphertext_sha256:crypto.createHash('sha256').update(ciphertext).digest('hex')},null,2)+'\n',{mode:0o600})
const report={date:new Date().toISOString(),...verification,server_to_independent_windows_host:true,configuration_encrypted:true,configuration_roundtrip_verified:true,configuration_key_stored_separately:true,backup_auto_deletion_enabled:false,ongoing_transfer_requires_backup_host_online:true}
fs.mkdirSync(path.join(root,'docs/verification/recovery'),{recursive:true});fs.writeFileSync(path.join(root,'docs/verification/recovery/off-server-copy.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
