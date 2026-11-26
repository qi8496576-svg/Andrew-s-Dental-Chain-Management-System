import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { prepareCommand, createHttpClient, UnknownOutcomeError, ApiFailure } = require('../../tmp/mini-http-test/services/http.js')

test('mini retries preserve original serialized body, request key and If-Match', async () => {
  const sent = []
  globalThis.wx = {
    getRandomValues: ({ success }) => queueMicrotask(() => success({ randomValues: new Uint8Array(16).buffer })),
    request: request => { sent.push(request); sent.length === 1 ? request.fail({}) : request.success({ statusCode: 200, data: { id: '9223372036854775807' } }) },
  }
  const body = { amount: '1.25' }
  const pending = prepareCommand('fixture', 'POST', '/api/v1/fixture', body, '"original"')
  body.amount = '9.99'
  const command = await pending
  const http = createHttpClient('https://fixture.invalid', () => 'fixture-token')
  await assert.rejects(http.execute(command), UnknownOutcomeError)
  assert.equal((await http.execute(command)).id, '9223372036854775807')
  assert.equal(sent.length, 2)
  assert.equal(sent[0].data, '{"amount":"1.25"}')
  assert.equal(sent[0].data, sent[1].data)
  assert.equal(sent[0].header['Idempotency-Key'], sent[1].header['Idempotency-Key'])
  assert.equal(sent[0].header['If-Match'], '"original"')
  assert.equal(sent[0].header.Authorization, 'Bearer fixture-token')
})

test('mini domain rejection has no automatic retry; unknown commit keeps command', async () => {
  let calls = 0
  globalThis.wx.request = request => { calls++; request.success({ statusCode: 409, data: { code: 'STATE_CONFLICT' } }) }
  const http = createHttpClient('https://fixture.invalid', () => 'fixture-token')
  const command = await prepareCommand('fixture', 'POST', '/api/v1/fixture', {})
  await assert.rejects(http.execute(command), ApiFailure)
  assert.equal(calls, 1)
  globalThis.wx.request = request => request.success({ statusCode: 503, data: { code: 'COMMIT_OUTCOME_UNKNOWN' } })
  await assert.rejects(http.execute(command), error => error instanceof UnknownOutcomeError && error.command === command)
  globalThis.wx.request = request => request.success({ statusCode: 200, data: 'malformed response' })
  await assert.rejects(http.execute(command), UnknownOutcomeError)
})

test('missing ADC session never sends a request', async () => {
  globalThis.wx.request = () => assert.fail('Request must not be sent')
  const http = createHttpClient('https://fixture.invalid', () => undefined)
  await assert.rejects(http.get('/api/v1/me'), error => error instanceof ApiFailure && error.code === 'AUTH_REQUIRED')
  assert.throws(() => createHttpClient('http://fixture.invalid', () => 'fixture-token'))
})
