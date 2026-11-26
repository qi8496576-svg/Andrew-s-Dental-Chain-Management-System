import {expect,it} from 'vitest'
import {createMemoryHistory} from 'vue-router'
import {createAppRouter} from '../../router'
it('requires explicit analysis capability instead of generic headquarters role',async()=>{for(const permission of ['resource.read','performance.calculate']){const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(role,cap)=>role==='HEADQUARTERS' && cap===permission});await router.push('/analytics');expect(router.currentRoute.value.name).toBe('home')}})
it('allows a scoped analyst without granting sensitive source permissions',async()=>{const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(role,cap)=>role==='HEADQUARTERS' && cap==='analysis.read'});await router.push('/analytics');expect(router.currentRoute.value.name).toBe('analytics')})
