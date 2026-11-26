import {expect,it} from 'vitest'
import {createMemoryHistory} from 'vue-router'
import {createAppRouter} from '../../router'
it('requires manual no-show authority separately from cancellation',async()=>{const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(_,cap)=>cap==='cancelAppointment'});await router.push('/appointment-no-show');expect(router.currentRoute.value.name).toBe('home')})
