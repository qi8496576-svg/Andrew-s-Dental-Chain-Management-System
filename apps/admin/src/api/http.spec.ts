import { describe, expect, it, vi } from 'vitest'
import { createHttpClient, prepareCommand, UnknownOutcomeError, ApiFailure } from './http'

describe('command transport', () => {
  it('preserves server time for cutoffs when the client clock is ahead', async () => {
    const send=vi.fn<typeof fetch>().mockResolvedValue(new Response('{"subject_id":"fixture"}',{status:200,headers:{Date:'Tue, 24 Nov 2026 05:00:00 GMT',ETag:'"fixture"'}}))
    const http=createHttpClient({fetch:send,csrf:()=>''})
    const result=await http.getResource('/api/v1/me')
    expect(result.serverDate).toBe('Tue, 24 Nov 2026 05:00:00 GMT')
    expect(result.etag).toBe('"fixture"')
    expect(new Headers(send.mock.calls[0]?.[1]?.headers).has('X-CSRF-Token')).toBe(false)
  })
  it('keeps the exact original key, body and If-Match after an unknown outcome', async () => {
    const send = vi.fn<typeof fetch>().mockRejectedValueOnce(new TypeError('network disconnected'))
      .mockResolvedValueOnce(new Response('{"id":"9223372036854775807","amount":"1.25"}', { status: 200 }))
    const http = createHttpClient({ fetch: send, csrf: () => 'csrf-fixture' })
    const body = { amount: '1.25' }
    const command = prepareCommand('updateFixture', 'PUT', '/api/v1/fixture/1', body, '"original"')
    body.amount = '9.99'
    await expect(http.execute(command)).rejects.toBeInstanceOf(UnknownOutcomeError)
    const result = await http.execute<{ id: string; amount: string }>(command)
    expect(result.data.id).toBe('9223372036854775807')
    expect(send).toHaveBeenCalledTimes(2)
    const first = send.mock.calls[0]?.[1]
    const second = send.mock.calls[1]?.[1]
    expect(first).toEqual(second)
    expect(first?.body).toBe('{"amount":"1.25"}')
    expect(first?.credentials).toBe('same-origin')
    expect(new Headers(first?.headers).get('Idempotency-Key')).toBe(command.key)
    expect(new Headers(first?.headers).get('If-Match')).toBe('"original"')
    expect(new Headers(first?.headers).has('Authorization')).toBe(false)
  })
  it('reports domain rejection and never retries automatically', async () => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"code":"STATE_CONFLICT","message":"conflict","request_id":"fixture"}', { status: 409 }))
    const http = createHttpClient({ fetch: send, csrf: () => 'csrf-fixture' })
    await expect(http.execute(prepareCommand('fixture', 'POST', '/api/v1/fixture', {}))).rejects.toBeInstanceOf(ApiFailure)
    expect(send).toHaveBeenCalledTimes(1)
  })
  it('retains the original command on server commit uncertainty or invalid success body', async () => {
    const command = prepareCommand('fixture', 'POST', '/api/v1/fixture', {})
    for (const response of [new Response('{"code":"COMMIT_OUTCOME_UNKNOWN"}', { status: 503 }), new Response('invalid JSON', { status: 200 })]) {
      const http = createHttpClient({ fetch: vi.fn<typeof fetch>().mockResolvedValue(response), csrf: () => 'csrf-fixture' })
      try { await http.execute(command); expect.fail('Expected unknown outcome') } catch (error) {
        expect(error).toBeInstanceOf(UnknownOutcomeError)
        expect((error as UnknownOutcomeError).command).toBe(command)
      }
    }
  })
})
