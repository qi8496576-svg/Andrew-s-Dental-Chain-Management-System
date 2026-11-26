import fs from 'node:fs'
import https from 'node:https'
import crypto from 'node:crypto'
export const origin='https://andrewdental.cn'
export const privateRoot='D:/secrets/AndrewDental/CloudIntegration'
export const accounts=JSON.parse(fs.readFileSync(privateRoot+'/accounts.json','utf8'))
export function request(method,path,body,actor,command={}){return new Promise((resolve,reject)=>{
 const headers={...(body!==undefined?{'Content-Type':'application/json'}:{}),...(actor?{Origin:origin,Cookie:actor.cookie,'X-CSRF-Token':actor.csrf}:{}),...(command.key?{'Idempotency-Key':command.key}:{}),...(command.etag?{'If-Match':command.etag}:{})}
 const req=https.request(origin+'/api/v1'+path,{method,headers},res=>{let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>{let data;try{data=text?JSON.parse(text):undefined}catch{return reject(Error('Invalid API response'))}resolve({status:res.statusCode,data,headers:res.headers})})})
 req.setTimeout(20000,()=>req.destroy(Error('API timeout; inspect the original request before retry')));req.on('error',reject);req.end(body===undefined?undefined:JSON.stringify(body))
})}
export async function login(account){const pre=await request('GET','/auth/csrf');if(pre.status!==200)throw Error('CSRF bootstrap failed');const result=await request('POST','/auth/staff-sessions',account,{cookie:pre.headers['set-cookie'].map(s=>s.split(';')[0]).join('; '),csrf:pre.data.csrf_token});if(result.status!==200)throw Error('Staff login failed: '+result.status+' '+result.data?.code);return {cookie:result.headers['set-cookie'].find(s=>s.startsWith('adc_session=')).split(';')[0],csrf:result.data.csrf_token}}
export async function get(path,actor){const response=await request('GET',path,undefined,actor);if(response.status!==200)throw Error('GET '+path+': '+response.status+' '+response.data?.code);return response}
export async function catalog(kind,actor,query={}){const items=[];let cursor;do{const q=new URLSearchParams({...query,limit:'100'});if(cursor)q.set('cursor',cursor);const response=await get('/'+kind+'?'+q,actor);items.push(...response.data.items);cursor=response.data.next_cursor}while(cursor);return items}
export const key=()=>crypto.randomUUID()
