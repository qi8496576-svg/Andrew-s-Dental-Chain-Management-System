import {originalRequest,retainRequest,uncertainRequest,finishRequest} from './outcome-recovery'
import {businessMessage} from './business-messages'
export interface PreparedCommand {
  readonly operation: string
  readonly method: 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  readonly path: string
  readonly body: string
  readonly key: string
  readonly ifMatch?: string
}
export function prepareCommand(operation: string, method: PreparedCommand['method'], path: string, body: unknown, ifMatch?: string): PreparedCommand {
  if (!path.startsWith('/api/v1/') || path.startsWith('//')) throw new Error('Invalid API path')
  const previous=originalRequest(operation,method,path)
  return Object.freeze({ operation, method, path, body: JSON.stringify(body), key: previous?.key??crypto.randomUUID(), ifMatch: previous?.ifMatch??ifMatch })
}
export class ApiFailure extends Error {
  constructor(readonly status: number, readonly code: string, readonly requestId?: string) { super(businessMessage(code)) }
}
export class UnknownOutcomeError extends Error {
  constructor(readonly command: PreparedCommand) { super('操作结果尚未确认，请保留原请求查询或重试') }
}
export function createHttpClient(options: { fetch?: typeof fetch; csrf: () => string | Promise<string> }) {
  const send = options.fetch ?? fetch
  async function getResource<T>(path: string): Promise<{data:T;etag:string|null;serverDate:string|null}> {
    if (!path.startsWith('/api/v1/')) throw new Error('Invalid API path')
    const response = await send(path, { credentials: 'same-origin', cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) throw new ApiFailure(response.status, data.code ?? 'INVALID_RESPONSE', data.request_id)
    return {data:data as T,etag:response.headers.get('ETag'),serverDate:response.headers.get('Date')}
  }
  async function execute<T>(command: PreparedCommand): Promise<{ data: T; etag: string | null }> {
    const csrf = await options.csrf()
    if (!csrf) throw new ApiFailure(403, 'ACCESS_DENIED')
    try{await retainRequest(command)}catch{throw new ApiFailure(409,'REQUEST_OUTCOME_PENDING')}
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Idempotency-Key': command.key, 'X-CSRF-Token': csrf }
      if (command.ifMatch !== undefined) headers['If-Match'] = command.ifMatch
      const response = await send(command.path, { method: command.method, body: command.body, headers, credentials: 'same-origin', cache: 'no-store' })
      if (response.status >= 500) throw new UnknownOutcomeError(command)
      const data = response.status === 204 ? undefined : await response.json()
      if (!response.ok) throw new ApiFailure(response.status, data?.code ?? 'INVALID_RESPONSE', data?.request_id)
      finishRequest(command.key)
      return { data: data as T, etag: response.headers.get('ETag') }
    } catch (error) {
      if(error instanceof ApiFailure){if(!error.code.includes('IDEMPOTENCY'))finishRequest(command.key);throw error}
      uncertainRequest(command.key)
      if (error instanceof UnknownOutcomeError) throw error
      throw new UnknownOutcomeError(command)
    }
  }
  return {
    get: async <T>(path:string):Promise<T> => (await getResource<T>(path)).data, getResource, execute,
    requestResult: <T>(command: PreparedCommand) => getResource<T>(`/api/v1/requests/${encodeURIComponent(command.key)}?operation=${encodeURIComponent(command.operation)}`).then(result=>result.data),
  }
}
