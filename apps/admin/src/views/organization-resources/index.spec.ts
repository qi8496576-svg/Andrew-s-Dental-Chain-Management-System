import { expect,it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '../../router'
import { resourceInput, requirementOptions } from './resource-form'
it('resource navigation requires an existing headquarters resource capability',async()=>{
  const denied=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:()=>false});await denied.push('/organization-resources');expect(denied.currentRoute.value.name).toBe('home')
  const allowed=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(role,capability)=>role==='HEADQUARTERS' && capability==='resource.read'});await allowed.push('/organization-resources');expect(allowed.currentRoute.value.name).toBe('organization-resources')
})
it('resource forms preserve exact price text and never send response-only fields',()=>{
  expect(resourceInput('treatments',{treatment_code:'F-1',treatment_name:'Fixture',description:'',default_unit_price:'9999999999.99',is_active:true,treatment_id:'9007199254740993',future_impact:[]})).toEqual({treatment_code:'F-1',treatment_name:'Fixture',description:null,default_unit_price:'9999999999.99',is_active:true})
})
it('editing treatment requirements retains already linked IDs outside the loaded catalog page',()=>{
  const options=requirementOptions([{id:'1',label:'Loaded',active:true}],[{qualification_id:'9007199254740993',is_mandatory:true}])
  expect(options.find(row=>row.id==='9007199254740993')).toMatchObject({selected:true,mandatory:true})
  expect(options.find(row=>row.id==='1')).toMatchObject({selected:false})
})
