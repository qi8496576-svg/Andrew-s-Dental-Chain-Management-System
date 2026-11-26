const kinds=['candidates','candidates','candidates','treatments','invoices']
export function validSuccess(kind,result,target){
  if(!result||typeof result!=='object')return false
  const id=value=>typeof value==='string'&&/^[1-9][0-9]*$/.test(value),money=value=>typeof value==='string'&&/^[0-9]+\.[0-9]{2}$/.test(value)
  if(kind==='candidates')return Array.isArray(result.items)
  if(!target||result.appointment_id!==target.appointment_id)return false
  if(kind==='invoices')return id(result.invoice_id)&&money(result.total_amount)&&Array.isArray(result.items)&&result.items.length>0
  if(kind==='treatments')return id(result.applied_treatment_id)&&result.treatment_id===target.body.treatment_id&&result.standard_units===target.body.standard_units&&money(result.unit_price)&&money(result.subtotal)
  return false
}
export function workloadKind(vu,iteration){if(!Number.isInteger(vu)||vu<1||!Number.isInteger(iteration)||iteration<0)throw new Error('INVALID_WORKER');return kinds[(vu-1+iteration)%5]}
export function takeNext(cursor,kind,items){const index=cursor[kind]||0;if(!Array.isArray(items)||index>=items.length)throw new Error('INVENTORY_EXHAUSTED:'+kind);cursor[kind]=index+1;return items[index]}
export function classify(status){return {success:status===200,business_rejection:status===409||status===422,unexpected_error:status!==200&&status!==409&&status!==422}}
export function validatePools(workers,expected=100){
  if(!Array.isArray(workers)||workers.length!==expected)throw new Error('VU_COUNT')
  const invoices=new Set(),care=new Map(),valid=id=>typeof id==='string'&&/^[1-9][0-9]*$/.test(id)
  workers.forEach((worker,index)=>{
    if(!Array.isArray(worker.treatments)||!worker.treatments.length||!Array.isArray(worker.invoices)||!worker.invoices.length)throw new Error('EMPTY_INVENTORY')
    for(const item of worker.treatments){if(!valid(item.appointment_id)||!valid(item.body.treatment_id))throw new Error('INVALID_ID');if(care.has(item.appointment_id)&&care.get(item.appointment_id)!==index)throw new Error('SHARED_CARE_VISIT');care.set(item.appointment_id,index)}
    for(const id of worker.invoices){if(!valid(id))throw new Error('INVALID_ID');if(invoices.has(id))throw new Error('DUPLICATE_INVOICE');invoices.add(id)}
  })
  for(const id of invoices)if(care.has(id))throw new Error('CARE_INVOICE_OVERLAP')
}
