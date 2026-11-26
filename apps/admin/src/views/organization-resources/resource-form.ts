import type { components } from '@adc/contracts'
import { resourceDefinitions } from './resource-fields'
import type { ResourceName } from './resource-fields'
export function resourceInput(name:ResourceName,form:Record<string,unknown>):Record<string,unknown>{
  const result:Record<string,unknown>={}
  for(const field of resourceDefinitions[name].fields){const value=form[field.name];result[field.name]=field.nullable && value===''?null:value}
  return result
}
type Catalog=components['schemas']['CatalogItem']
type Requirement=components['schemas']['TreatmentQualificationView']
export function requirementOptions(catalog:Catalog[],current:Requirement[]){
  const options=catalog.map(item=>({id:item.id,label:item.label,active:item.active as boolean|undefined,selected:current.some(row=>row.qualification_id===item.id),mandatory:current.find(row=>row.qualification_id===item.id)?.is_mandatory??false}))
  for(const row of current)if(!options.some(item=>item.id===row.qualification_id))options.push({id:row.qualification_id,label:`资质 ${row.qualification_id}（已关联，目录页未加载）`,active:undefined,selected:true,mandatory:row.is_mandatory})
  return options
}
