import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from './index'

describe('route bootstrap', () => {
  it('loads the home route and its Vue component', async () => {
    const router = createAppRouter(createMemoryHistory(), { ensure: async () => true })
    await router.push('/')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('home')
    expect(router.currentRoute.value.matched[0]?.components?.default).toBeDefined()
  })
  it('redirects an unauthenticated visitor to the personal login page', async () => {
    const router = createAppRouter(createMemoryHistory(), { ensure: async () => false })
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('authentication')
  })

  it('uses a not-found page for an unknown nested URL', async () => {
    const router = createAppRouter(createMemoryHistory())
    await router.push('/unknown/nested')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('not-found')
  })
  it('guards every independent resource page with actual resource capabilities',async()=>{
    const denied=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:()=>false})
    await denied.push('/settings/dentists')
    expect(denied.currentRoute.value.name).toBe('home')
    const allowed=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(role,cap)=>role==='HEADQUARTERS'&&cap==='resource.read'})
    for(const kind of ['clinics','dentists','treatments','qualifications','allergies']){await allowed.push('/settings/'+kind);expect(allowed.currentRoute.value.meta.resourceKind).toBe(kind)}
    await allowed.push('/clinic-grants');expect(allowed.currentRoute.value.name).toBe('home')
  })
})
