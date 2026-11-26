import { expect,it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '../../router'
it('keeps binding review restricted to the separately authorized reception operation',async()=>{
  const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(_,cap)=>cap==='getPatient'})
  await router.push('/patient-bindings');expect(router.currentRoute.value.name).toBe('home')
})
it('opens the binding review page for an authorized reviewer',async()=>{
  const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(role,cap)=>role==='RECEPTION' && cap==='listBindingRequests'})
  await router.push('/patient-bindings');expect(router.currentRoute.value.name).toBe('patient-bindings')
})
