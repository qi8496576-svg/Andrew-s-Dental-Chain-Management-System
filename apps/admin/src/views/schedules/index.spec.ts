import { beforeAll,expect,it } from 'vitest'
import { createAppRouter } from '../../router'
import { createMemoryHistory } from 'vue-router'
// Compile the real Vue/Element Plus module before timing navigation assertions.
// A cold Vite transform is build work, not the route guard's execution time.
beforeAll(async()=>{await import('./index.vue')},60000)
it('keeps scheduling independent from booking and denies booking-only authority',async()=>{const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(_,cap)=>cap==='createAppointment'});await router.push('/schedules');expect(router.currentRoute.value.name).toBe('home')})
it('opens the separate schedule page for a schedule reader',async()=>{const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(_,cap)=>cap==='listSchedules'});await router.push('/schedules');expect(router.currentRoute.value.name).toBe('schedules')})
