import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createPatientAuthentication } = require('../../tmp/mini-http-test/services/authentication.js')

test('native code exchange stores only ADC session and logout invalidates it', async () => {
  const requests = []
  const identity = { subject_id: 'fixture-patient', subject_type: 'PATIENT', roles: [], capabilities: [], clinic_scope: [], binding: null }
  globalThis.wx = {
    login: ({ success }) => success({ code: 'one-time-fixture-code' }),
    getRandomValues: ({ success }) => success({ randomValues: new Uint8Array(16).buffer }),
    request: request => {
      requests.push(request)
      if (request.url.endsWith('/auth/wechat-sessions')) request.success({ statusCode: 200, data: { access_token: 't'.repeat(43), subject_id: 'fixture-patient', subject_type: 'PATIENT', binding_status: 'UNBOUND', expires_at: '2026-11-11T08:00:00Z' } })
      else if (request.url.endsWith('/auth/session')) request.success({ statusCode: 204, data: '' })
      else request.success({ statusCode: 200, data: identity })
    },
  }
  const auth = createPatientAuthentication('https://fixture.invalid')
  assert.deepEqual(await auth.login(), identity)
  assert.deepEqual(requests[0].data, { code: 'one-time-fixture-code' })
  assert.equal(requests[0].header?.Authorization, undefined)
  assert.equal(requests[1].header.Authorization, `Bearer ${'t'.repeat(43)}`)
  await auth.logout()
  await assert.rejects(auth.me(), error => error.code === 'AUTH_REQUIRED')
})

test('platform login failure never exchanges an invented code', async () => {
  globalThis.wx.login = ({ fail }) => fail({})
  globalThis.wx.request = () => assert.fail('No platform code: no exchange request')
  const auth = createPatientAuthentication('https://fixture.invalid')
  await assert.rejects(auth.login(), error => error.code === 'CLIENT_WECHAT_LOGIN_UNAVAILABLE')
})

test('a backend connection failure is distinguishable from platform login and never authenticates', async () => {
  globalThis.wx.login = ({ success }) => success({ code: 'one-time-fixture-code' })
  globalThis.wx.request = ({ fail }) => fail({ errMsg: 'request:fail domain not configured' })
  const auth = createPatientAuthentication('https://fixture.invalid')
  await assert.rejects(auth.login(), error => error.code === 'CLIENT_LOGIN_NETWORK_UNAVAILABLE')
  await assert.rejects(auth.me(), error => error.code === 'AUTH_REQUIRED')
})

test('a missing platform code is rejected without contacting the backend', async () => {
  globalThis.wx.login = ({ success }) => success({ code: '' })
  globalThis.wx.request = () => assert.fail('Missing code must not be exchanged')
  await assert.rejects(createPatientAuthentication('https://fixture.invalid').login(), error => error.code === 'CLIENT_WECHAT_LOGIN_UNAVAILABLE')
})

test('server login throttling remains visible without automatic credential retries', async () => {
  let requests = 0
  globalThis.wx.login = ({ success }) => success({ code: 'one-time-fixture-code' })
  globalThis.wx.request = ({ success }) => { requests++; success({ statusCode: 429, data: { code: 'AUTH_ATTEMPT_LIMITED' } }) }
  await assert.rejects(createPatientAuthentication('https://fixture.invalid').login(), error => error.code === 'AUTH_ATTEMPT_LIMITED')
  assert.equal(requests, 1)
})

test('login page distinguishes failures, clears private binding text and suppresses double clicks', async () => {
  let definition
  globalThis.Page = value => { definition = value }
  require('../../tmp/mini-http-test/pages/authentication/index.js')
  const page = { data: { ...definition.data }, setData(value) { Object.assign(this.data, value) } }
  globalThis.wx.login = ({ fail }) => fail({})
  await definition.login.call(page)
  assert.match(page.data.error, /微信登录凭证/)
  assert.equal(page.data.authenticated, false)
  assert.equal(page.data.busy, false)
  globalThis.wx.login = ({ success }) => success({ code: 'fixture-code' })
  globalThis.wx.request = ({ fail }) => fail({})
  page.data.bindingText = 'stale binding'
  await definition.login.call(page)
  assert.match(page.data.error, /无法连接患者服务/)
  assert.equal(page.data.bindingText, '')
  page.data.busy = true
  globalThis.wx.login = () => assert.fail('An in-flight login must not be duplicated')
  await definition.login.call(page)
  delete globalThis.Page
})

test('returning to login refreshes the verified binding and clears an expired session', async () => {
  let definition
  globalThis.Page = value => { definition = value }
  delete require.cache[require.resolve('../../tmp/mini-http-test/pages/authentication/index.js')]
  require('../../tmp/mini-http-test/pages/authentication/index.js')
  const {patientSession}=require('../../tmp/mini-http-test/services/session.js')
  const identity={subject_id:'fixture-patient',subject_type:'PATIENT',binding:{patient_id:'1'}}
  globalThis.wx.login=({success})=>success({code:'official-code-fixture'})
  globalThis.wx.request=request=>request.success({statusCode:200,data:request.url.endsWith('/auth/wechat-sessions')?{access_token:'t'.repeat(43),subject_type:'PATIENT'}:identity})
  await patientSession().login()
  const page={data:{...definition.data},setData(value){Object.assign(this.data,value)}}
  await definition.onShow.call(page)
  assert.equal(page.data.authenticated,true)
  assert.match(page.data.bindingText,/已关联/)
  globalThis.wx.request=request=>request.success({statusCode:401,data:{code:'AUTH_REQUIRED'}})
  await definition.onShow.call(page)
  assert.equal(page.data.authenticated,false)
  assert.equal(page.data.bindingText,'')
  assert.equal(page.data.busy,false)
  delete globalThis.Page
})
