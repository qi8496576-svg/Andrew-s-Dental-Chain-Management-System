import fs from 'node:fs'
import path from 'node:path'
import {spawn} from 'node:child_process'
import {fileURLToPath} from 'node:url'
export const root=path.resolve(import.meta.dirname,'../..')
const config=JSON.parse(fs.readFileSync(path.join(root,'ops/config/tencent-environment.json'),'utf8'))
export const host=config.ssh_user+'@'+config.public_ip
export const sshArgs=['-i',config.private_key_location_only,'-o','BatchMode=yes','-o','ConnectTimeout=15','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+path.join(root,'tmp/tencent-known-hosts')]
export const quote=value=>"'"+String(value).replaceAll("'","'\\''")+"'"
export function run(executable,args,{input,cwd=root,env=process.env}={}){return new Promise((resolve,reject)=>{
 const child=spawn(executable,args,{cwd,env,windowsHide:true});let stdout='',stderr=''
 child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.on('error',reject)
 child.on('exit',code=>code===0?resolve(stdout):reject(Error(executable+' failed ('+code+'): '+stderr.slice(-3000))))
 child.stdin.on('error',()=>{});child.stdin.end(input)
})}
// Non-interactive commands do not consume stdin. Scripts below keep their explicit input pipe.
export const ssh=command=>run('ssh',[...sshArgs,'-n',host,command])
export async function executeScript(file,args=[]){const resolved=path.resolve(root,file);if(!resolved.startsWith(path.join(root,'ops/scripts')+path.sep))throw Error('Only reviewed ops/scripts files can run');return run('ssh',[...sshArgs,host,'sudo -n bash -s -- '+args.map(quote).join(' ')],{input:fs.readFileSync(resolved)})}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(await executeScript(process.argv[2],process.argv.slice(3)))
