import { expect, it, vi } from 'vitest'
import { createAuthenticationClient } from './authentication'
import { createProtectedClient } from './protected'
import { prepareCommand } from './http'
it('shares the current login CSRF context with business commands and logout', async () => {
  const send = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('{"csrf_token":"anonymous"}'))
    .mockResolvedValueOnce(new Response('{"subject_id":"staff","subject_type":"STAFF","csrf_token":"session-csrf","expires_at":"2026-11-11T08:00:00Z","roles":[],"capabilities":[],"clinic_scope":[]}'))
    .mockResolvedValueOnce(new Response('{}')).mockResolvedValueOnce(new Response(null, { status: 204 }))
  const auth = createAuthenticationClient(send)
  await auth.login('fixture', 'fixture-password')
  await createProtectedClient(send).execute(prepareCommand('fixture', 'POST', '/api/v1/fixture', {}))
  await auth.logout()
  expect(send).toHaveBeenCalledTimes(4)
  for (const index of [2, 3]) expect(new Headers(send.mock.calls[index]?.[1]?.headers).get('X-CSRF-Token')).toBe('session-csrf')
})
