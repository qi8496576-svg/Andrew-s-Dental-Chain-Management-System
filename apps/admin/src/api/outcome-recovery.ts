import type {PreparedCommand} from './http'

export interface RecoveryRecord {subject:string;operation:string;method:PreparedCommand['method'];path:string;key:string;ifMatch?:string;digest:string;unknown:boolean}
const storageKey='adc-command-recovery-v1'
let subject='',records:RecoveryRecord[]=[],active=new Set<string>()
function notify(){if(typeof window!=='undefined')window.dispatchEvent(new Event('adc-recovery-changed'))}
function save(){try{sessionStorage.setItem(storageKey,JSON.stringify(records))}catch{/* In-memory recovery and leave protection remain available. */}notify()}
export function setRecoverySubject(value:string){subject=value;try{const stored=JSON.parse(sessionStorage.getItem(storageKey)??'[]');records=Array.isArray(stored)?stored.filter(r=>typeof r.key==='string'&&typeof r.digest==='string'&&r.path?.startsWith('/api/v1/')):[]}catch{records=[]}notify()}
export function recoveryRecords(){return records.filter(r=>r.subject===subject&&(r.unknown||!active.has(r.key)))}
export function originalRequest(operation:string,method:string,path:string){return records.find(r=>r.subject===subject&&r.operation===operation&&r.method===method&&r.path===path)}
export async function retainRequest(command:PreparedCommand){
 if(!subject||command.operation==='logout')return
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(command.body))
 const digest=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')
 const existing=records.find(r=>r.subject===subject)
 if(existing&&(existing.key!==command.key||existing.digest!==digest||existing.path!==command.path||existing.method!==command.method))throw new Error('REQUEST_OUTCOME_PENDING')
 if(!existing)records.push({subject,operation:command.operation,method:command.method,path:command.path,key:command.key,ifMatch:command.ifMatch,digest,unknown:false})
 active.add(command.key);save()
}
export function uncertainRequest(key:string){const record=records.find(r=>r.subject===subject&&r.key===key);if(record){record.unknown=true;save()}}
export function finishRequest(key:string){records=records.filter(r=>r.subject!==subject||r.key!==key);active.delete(key);save()}
