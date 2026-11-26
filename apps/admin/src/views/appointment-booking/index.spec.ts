import { expect,it } from 'vitest'
import { createAppRouter } from '../../router'
import { createMemoryHistory } from 'vue-router'
it('keeps appointment management separate from schedule authority',async()=>{const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(_,cap)=>cap==='listSchedules'});await router.push('/appointment-booking');expect(router.currentRoute.value.name).toBe('home')})
