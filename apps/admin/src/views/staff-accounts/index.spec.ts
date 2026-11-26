import { expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '../../router'
it('does not route a logged-in account without account management access to the page', async () => {
  const router = createAppRouter(createMemoryHistory(), { ensure: async () => true, canAccess: () => false })
  await router.push('/staff-accounts')
  expect(router.currentRoute.value.name).toBe('home')
})
it('loads the account management page only after current access is checked', async () => {
  const router = createAppRouter(createMemoryHistory(), { ensure: async () => true, canAccess: (role, capability) => role === 'HEADQUARTERS' && capability === 'account.manage' })
  await router.push('/staff-accounts')
  expect(router.currentRoute.value.name).toBe('staff-accounts')
})
