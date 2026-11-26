import { defineStore } from 'pinia'
import { ref,watch } from 'vue'
import {setRecoverySubject} from '../api/outcome-recovery'
import type { components } from '@adc/contracts'
import { authenticationMessage, createAuthenticationClient } from '../api/authentication'

export const useAuthenticationStore = defineStore('authentication', () => {
  const identity = ref<components['schemas']['Identity'] | null>(null)
  watch(()=>identity.value?.subject_id,value=>setRecoverySubject(value??''),{flush:'sync'})
  const busy = ref(false)
  const error = ref('')
  const client = createAuthenticationClient()
  async function ensure(): Promise<boolean> {
    try { identity.value = await client.me(); error.value = ''; return true } catch { identity.value = null; return false }
  }
  async function login(username: string, password: string): Promise<boolean> {
    busy.value = true; error.value = ''
    try { identity.value = await client.login(username, password); return true } catch (failure) {
      identity.value = null; error.value = authenticationMessage(failure); return false
    } finally { busy.value = false }
  }
  async function logout(): Promise<boolean> {
    busy.value = true; error.value = ''
    try { await client.logout(); identity.value = null; return true } catch {
      error.value = '退出结果尚未确认，请再次退出以核对原请求。'; return false
    } finally { busy.value = false }
  }
  function canAccess(role: string, capability: string) { return identity.value?.roles.includes(role) === true && identity.value?.capabilities.includes(capability) === true }
  return { identity, busy, error, ensure, login, logout, canAccess }
})
