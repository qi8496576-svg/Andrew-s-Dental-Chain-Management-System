import {expect,it} from 'vitest'
import {createMemoryHistory} from 'vue-router'
import {createAppRouter} from '../../router'
it('requires cancellation authority separately from attendance',async()=>{const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(_,cap)=>cap==='attendAppointment'});await router.push('/appointment-cancellation?appointmentId=1');expect(router.currentRoute.value.name).toBe('home')})
