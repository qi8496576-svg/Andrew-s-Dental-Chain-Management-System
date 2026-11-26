import {expect,it} from 'vitest'
import {createMemoryHistory} from 'vue-router'
import {createAppRouter} from '../../router'
it('requires attendance authority separately from booking or cancellation',async()=>{const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(_,cap)=>cap==='createAppointment' || cap==='cancelAppointment'});await router.push('/appointment-attendance?appointmentId=1');expect(router.currentRoute.value.name).toBe('home')})
