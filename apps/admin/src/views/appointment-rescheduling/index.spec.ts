import {expect,it} from 'vitest'
import {createMemoryHistory} from 'vue-router'
import {createAppRouter} from '../../router'
it('requires clinic rescheduling authority separately from patient cancellation',async()=>{const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(_,cap)=>cap==='cancelAppointment'});await router.push('/appointment-rescheduling');expect(router.currentRoute.value.name).toBe('home')})
