import { describe, expect, it, vi } from 'vitest'
import { createAuthenticationClient } from './authentication'
import { ApiFailure } from './http'

describe('staff authentication client', () => {
  it('uses signed CSRF initialization and keeps session credentials in HttpOnly cookies', async () => {
    const send = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('{"csrf_token":"anonymous"}'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ subject_id: 'staff', subject_type: 'STAFF', csrf_token: 'rotated', expires_at: '2026-11-11T08:00:00Z', roles: [], capabilities: [], clinic_scope: [] })))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    const client = createAuthenticationClient(send)
    const identity = await client.login('CaseSensitiveUser', 'fixture-password')
    expect(identity.subject_id).toBe('staff')
    expect(identity.binding).toBeNull()
    expect(send.mock.calls[1]?.[1]?.body).toBe('{"username":"CaseSensitiveUser","password":"fixture-password"}')
    expect(new Headers(send.mock.calls[1]?.[1]?.headers).get('X-CSRF-Token')).toBe('anonymous')
    await client.logout()
    expect(new Headers(send.mock.calls[2]?.[1]?.headers).get('X-CSRF-Token')).toBe('rotated')
    expect(send.mock.calls.every(([, init]) => !new Headers(init?.headers).has('Authorization'))).toBe(true)
  })
  it('does not automatically resend credentials after authentication rejection', async () => {
    const send = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('{"csrf_token":"anonymous"}'))
      .mockResolvedValueOnce(new Response('{"code":"AUTH_REQUIRED","request_id":"fixture"}', { status: 401 }))
    await expect(createAuthenticationClient(send).login('unknown', 'wrong')).rejects.toBeInstanceOf(ApiFailure)
    expect(send).toHaveBeenCalledTimes(2)
  })
})
