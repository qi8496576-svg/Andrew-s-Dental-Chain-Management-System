import { ApiFailure } from './http'
interface Context { token?: string; pending?: Promise<string> }
const contexts = new WeakMap<typeof fetch, Context>()
function context(send: typeof fetch) { let value = contexts.get(send); if (!value) { value = {}; contexts.set(send, value) }; return value }
export function setWebCsrf(send: typeof fetch, token?: string) { context(send).token = token }
export async function webCsrf(send: typeof fetch, refresh = false): Promise<string> {
  const state = context(send)
  if (state.pending) return state.pending
  if (state.token && !refresh) return state.token
  const pending = (async () => {
    const response = await send('/api/v1/auth/csrf', { credentials: 'same-origin', cache: 'no-store' })
    const body = await response.json()
    if (!response.ok) throw new ApiFailure(response.status, body.code ?? 'INVALID_RESPONSE', body.request_id)
    if (typeof body.csrf_token !== 'string' || !body.csrf_token) throw new ApiFailure(503, 'INVALID_RESPONSE')
    state.token = body.csrf_token
    return body.csrf_token as string
  })()
  state.pending = pending
  try { return await pending } finally { if (state.pending === pending) state.pending = undefined }
}
