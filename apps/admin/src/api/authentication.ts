import type { components } from '@adc/contracts'
import { ApiFailure, createHttpClient, prepareCommand, UnknownOutcomeError } from './http'
import { setWebCsrf, webCsrf } from './web-csrf'
type Identity = components['schemas']['Identity']
type WebSession = components['schemas']['WebSession']

export function createAuthenticationClient(send: typeof fetch = fetch) {
  let pendingLogout: ReturnType<typeof prepareCommand> | undefined
  async function json<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await send(path, { ...init, credentials: 'same-origin', cache: 'no-store' })
    const body = await response.json()
    if (!response.ok) throw new ApiFailure(response.status, body.code ?? 'INVALID_RESPONSE', body.request_id)
    return body as T
  }
  async function initialize() {
    return webCsrf(send, true)
  }
  const http = createHttpClient({ fetch: send, csrf: () => webCsrf(send) })
  async function me(): Promise<Identity> { return json<Identity>('/api/v1/me') }
  return {
    me,
    async login(username: string, password: string): Promise<Identity> {
      const token = await initialize()
      const session = await json<WebSession>('/api/v1/auth/staff-sessions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: JSON.stringify({ username, password }) })
      setWebCsrf(send, session.csrf_token)
      pendingLogout = undefined
      return { subject_id: session.subject_id, subject_type: session.subject_type, roles: session.roles, capabilities: session.capabilities, clinic_scope: session.clinic_scope, binding: null }
    },
    async logout(): Promise<void> {
      pendingLogout ??= prepareCommand('logout', 'DELETE', '/api/v1/auth/session', {})
      try { await http.execute(pendingLogout) } catch (error) {
        if (error instanceof ApiFailure && error.status === 401) { /* Already invalidated by the server. */ }
        else if (error instanceof UnknownOutcomeError) {
          try { await me(); throw error } catch (probe) {
            if (!(probe instanceof ApiFailure && probe.status === 401)) throw error
          }
        } else throw error
      }
      setWebCsrf(send, undefined)
      pendingLogout = undefined
    },
  }
}

export function authenticationMessage(error: unknown): string {
  if (error instanceof ApiFailure) {
    if (error.code === 'AUTH_ATTEMPT_LIMITED') return '登录尝试过多，请在限制期结束后重试。'
    if (error.code === 'AUTH_REQUIRED') return '账号或密码无效，请核实后重试。'
    if (error.status === 403) return '请求校验失败，请刷新页面后重试。'
  }
  return '服务暂时无法确认结果，请稍后重试。'
}

