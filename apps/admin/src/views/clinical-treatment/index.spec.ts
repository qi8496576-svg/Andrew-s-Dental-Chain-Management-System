import {expect,it} from 'vitest'
import {createMemoryHistory} from 'vue-router'
import {createAppRouter} from '../../router'
it('does not expose clinical risk context to reception booking authority',async()=>{const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(role,cap)=>role==='RECEPTION' && cap==='createAppointment'});await router.push('/clinical-treatment');expect(router.currentRoute.value.name).toBe('home')})
it('keeps the independent price correction capability out of an ordinary dentist route',async()=>{const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:role=>role==='DENTIST'});await router.push('/treatment-price-correction');expect(router.currentRoute.value.name).toBe('home')})
