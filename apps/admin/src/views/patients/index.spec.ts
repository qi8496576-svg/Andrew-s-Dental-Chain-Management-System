import { expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '../../router'
import { createHttpClient } from '../../api/http'
it('patient navigation requires the current reception read capability', async () => {
  const router = createAppRouter(createMemoryHistory(), { ensure: async () => true, canAccess: () => false })
  await router.push('/patients'); expect(router.currentRoute.value.name).toBe('home')
})
it('loads patient maintenance only for an authorized reception user', async () => {
  const router = createAppRouter(createMemoryHistory(), { ensure: async () => true, canAccess: (role, capability) => role === 'RECEPTION' && capability === 'getPatient' })
  await router.push('/patients'); expect(router.currentRoute.value.name).toBe('patients')
})
it('keeps the server ETag when loading an existing patient for correction', async () => {
  const send = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"patient_id":"9007199254740993"}', { headers: { ETag: '"server-patient-version"' } }))
  const client=createHttpClient({ fetch:send,csrf:()=> 'fixture' })
  const result=await client.getResource<{ patient_id:string }>('/api/v1/patients/9007199254740993')
  expect(result.etag).toBe('"server-patient-version"');expect(result.data.patient_id).toBe('9007199254740993');expect(send).toHaveBeenCalledTimes(1)
})
