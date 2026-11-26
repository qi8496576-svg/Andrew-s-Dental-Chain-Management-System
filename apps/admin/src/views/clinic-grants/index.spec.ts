import { expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '../../router'
it('requires the independent headquarters authorization capability', async () => {
  const router = createAppRouter(createMemoryHistory(), { ensure: async () => true, canAccess: (_, capability) => capability === 'account.manage' })
  await router.push('/clinic-grants')
  expect(router.currentRoute.value.name).toBe('home')
})
it('loads the grants page for the separately authorized headquarters user', async () => {
  const router = createAppRouter(createMemoryHistory(), { ensure: async () => true, canAccess: (role, capability) => role === 'HEADQUARTERS' && capability === 'authorization.manage' })
  await router.push('/clinic-grants')
  expect(router.currentRoute.value.name).toBe('clinic-grants')
})
