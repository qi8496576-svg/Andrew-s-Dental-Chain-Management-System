import type {components} from '../../types/api'
type Item=components['schemas']['CatalogItem']
export type VisitIntent='CHECKUP'|'CLEANING'|'OTHER'
const normalized=(label:string)=>label.replace(/（[^）]*）|\([^)]*\)/g,'').trim()
function match(items:Item[],names:string[]){
  for(const name of names){const item=items.find(value=>value.active!==false&&normalized(value.label)===name);if(item)return item.id}
  return undefined
}
export function commonVisits(items:Item[]){
  const checkup=match(items,['口腔检查','口腔初诊检查','初诊检查','检查'])
  const cleaning=match(items,['超声波洁牙','超声洁牙','超声洁治','洗牙','洁牙'])
  return [
    {id:'CHECKUP',label:'看牙检查',description:'牙齿不舒服，或不清楚具体问题',treatmentId:checkup??'',available:!!checkup},
    {id:'CLEANING',label:'洗牙洁牙',description:'想清洁牙齿，由医生检查后确定方式',treatmentId:cleaning??'',available:!!cleaning},
  ]
}
export function intentTreatments(items:Item[],intent:VisitIntent){
  const service=commonVisits(items).find(value=>value.id===intent)
  return service?.treatmentId?[service.treatmentId]:[]
}
