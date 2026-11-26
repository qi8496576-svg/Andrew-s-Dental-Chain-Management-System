import fs from 'node:fs'
import {login,accounts,get,request,privateRoot} from './cloud-api.mjs'
const p=JSON.parse(fs.readFileSync(privateRoot+'/billing-probe.json')),out=[]
for(const role of ['demo','admin']){const a=await login(accounts[role]),one=await request('GET','/patient-bills/'+p.bill_id,undefined,a),list=await get('/patient-bills?limit=100',a);out.push({role,detail_status:one.status,code:one.data?.code,items:list.data.items.length,has_expected:list.data.items.some(x=>x.bill_id===p.bill_id),next:!!list.data.next_cursor})}
console.log(JSON.stringify(out))
