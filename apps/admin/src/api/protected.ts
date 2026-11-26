import { createHttpClient } from './http'
import { webCsrf } from './web-csrf'
export function createProtectedClient(send: typeof fetch = fetch) { return createHttpClient({ fetch: send, csrf: () => webCsrf(send) }) }
