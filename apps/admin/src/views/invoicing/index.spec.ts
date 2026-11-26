import {expect,it} from 'vitest'
import {createMemoryHistory} from 'vue-router'
import {createAppRouter} from '../../router'
it('does not infer cashier access from dentist completion authority',async()=>{const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:role=>role==='DENTIST'});await router.push('/invoicing');expect(router.currentRoute.value.name).toBe('home')})
it('headquarters invoice source access is an explicit read capability',async()=>{const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(role,cap)=>role==='HEADQUARTERS' && cap==='analysis.read'});await router.push('/invoice-sources');expect(router.currentRoute.value.name).toBe('home')})
