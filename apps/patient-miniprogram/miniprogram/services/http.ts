import {businessMessage} from './business-messages'
export interface PreparedCommand {
  readonly operation: string
  readonly method: 'POST' | 'PUT' | 'DELETE'
  readonly path: string
  readonly body: string
  readonly key: string
  readonly ifMatch?: string
}
export function prepareCommand(operation: string, method: PreparedCommand['method'], path: string, body: unknown, ifMatch?: string): Promise<PreparedCommand> {
  if (!path.startsWith('/api/v1/')) return Promise.reject(new Error('Invalid API path'))
  const serialized = JSON.stringify(body)
  return new Promise((resolve, reject) => wx.getRandomValues({ length: 16,
    success: result => resolve(Object.freeze({ operation, method, path, body: serialized, ifMatch,
      key: Array.from(new Uint8Array(result.randomValues), value => value.toString(16).padStart(2, '0')).join('') })),
    fail: () => reject(new Error('Unable to create request key')),
  }))
}
export class ApiFailure extends Error {
  constructor(readonly status: number, readonly code: string, readonly requestId?: string) { super(businessMessage(code)) }
}
export class UnknownOutcomeError extends Error {
  constructor(readonly command: PreparedCommand) { super('操作结果尚未确认，请保留原请求查询或重试') }
}
export function createHttpClient(baseUrl: string, token: () => string | undefined) {
  if (!/^https:\/\/[^/]+$/.test(baseUrl)) throw new Error('HTTPS API origin required')
  function request<T>(path: string, command?: PreparedCommand): Promise<T> {
    if (!path.startsWith('/api/v1/')) return Promise.reject(new Error('Invalid API path'))
    const session = token()
    if (!session) return Promise.reject(new ApiFailure(401, 'AUTH_REQUIRED'))
    const header: Record<string, string> = { Authorization: `Bearer ${session}` }
    if (command) {
      header['Content-Type'] = 'application/json'; header['Idempotency-Key'] = command.key
      if (command.ifMatch !== undefined) header['If-Match'] = command.ifMatch
    }
    return new Promise((resolve, reject) => wx.request({
      url: baseUrl + path, method: command?.method ?? 'GET', data: command?.body, header, timeout: 15000,
      success: result => {
        if (result.statusCode >= 500 && command) return reject(new UnknownOutcomeError(command))
        if (result.statusCode >= 200 && result.statusCode < 300) {
          if (result.statusCode !== 204 && (result.data === null || typeof result.data !== 'object'))
            return reject(command ? new UnknownOutcomeError(command) : new ApiFailure(503, 'INVALID_RESPONSE'))
          return resolve(result.data as T)
        }
        const error = result.data as { code?: string; request_id?: string }
        reject(new ApiFailure(result.statusCode, error?.code ?? 'INVALID_RESPONSE', error?.request_id))
      },
      fail: () => reject(command ? new UnknownOutcomeError(command) : new Error('Network unavailable')),
    }))
  }
  return {
    get: <T>(path: string) => request<T>(path),
    execute: <T>(command: PreparedCommand) => request<T>(command.path, command),
    requestResult: <T>(command: PreparedCommand) => request<T>(`/api/v1/requests/${encodeURIComponent(command.key)}?operation=${encodeURIComponent(command.operation)}`),
  }
}
