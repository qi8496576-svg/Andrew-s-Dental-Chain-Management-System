import fs from 'node:fs'
import crypto from 'node:crypto'
export async function connect(){
 const ws=new WebSocket('ws://127.0.0.1:9420'),pending=new Map()
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('WeChat automation unavailable')),8000);ws.onopen=()=>{clearTimeout(timer);resolve()};ws.onerror=()=>{clearTimeout(timer);reject(Error('WeChat automation unavailable'))}})
 ws.onmessage=event=>{const message=JSON.parse(event.data),request=pending.get(message.id);if(request){pending.delete(message.id);clearTimeout(request.timer);message.error?request.reject(Error(request.method+': '+message.error.message)):request.resolve(message.result)}}
 const rpc=(method,params={})=>new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('WeChat timeout: '+method))},25000);pending.set(id,{resolve,reject,timer,method});ws.send(JSON.stringify({id,method,params}))})
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))
 const state=async()=>{const result=await rpc('App.callFunction',{functionDeclaration:'function(){var pages=getCurrentPages(),page=pages[pages.length-1];return {path:page.route,data:page.data}}',args:[]});return result.result}
 async function idle(){for(let i=0;i<80;i++){const current=await state();if(!current.data.busy)return current.data;await sleep(250)}throw Error('Page remains busy')}
 async function nav(page){await rpc('App.callWxMethod',{method:'reLaunch',args:[{url:'/pages/'+page+'/index'}]});for(let i=0;i<80;i++){await sleep(250);const current=await state();if(current.path==='pages/'+page+'/index')return idle()}throw Error('WeChat page did not open')}
 async function call(method,args=[]){await rpc('App.callFunction',{functionDeclaration:'function(method,args){var pages=getCurrentPages();pages[pages.length-1][method].apply(pages[pages.length-1],args);return true}',args:[method,args]});await sleep(200);return idle()}
 async function capture(file){await rpc('App.callWxMethod',{method:'pageScrollTo',args:[{scrollTop:0,duration:0}]});await sleep(250);const result=await rpc('App.captureScreenshot');fs.writeFileSync(file,Buffer.from(result.data,'base64'))}
 return {rpc,state,idle,nav,call,capture,close:()=>ws.close()}
}
