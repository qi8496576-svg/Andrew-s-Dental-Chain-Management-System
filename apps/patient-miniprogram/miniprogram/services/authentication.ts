import type { components } from '../types/api'
import { ApiFailure, createHttpClient, prepareCommand, UnknownOutcomeError } from './http'
import type { PreparedCommand } from './http'
type Identity = components['schemas']['Identity']
type WechatSession = components['schemas']['WechatSession']

export function createPatientAuthentication(baseUrl: string) {
  let session: string | undefined
  let pendingLogout: Awaited<ReturnType<typeof prepareCommand>> | undefined
  const http = createHttpClient(baseUrl, () => session)
  async function me(): Promise<Identity> {
    try { return await http.get<Identity>('/api/v1/me') } catch (error) {
      if (error instanceof ApiFailure && error.status === 401) session = undefined
      throw error
    }
  }
  return {
    me,
    async clinics(){
      const items:components['schemas']['CatalogItem'][]=[];let cursor:string|null=null
      do{const page:{items:components['schemas']['CatalogItem'][];next_cursor:string|null}=await http.get(`/api/v1/clinics?limit=100${cursor?`&cursor=${encodeURIComponent(cursor)}`:''}`);items.push(...page.items);cursor=page.next_cursor}while(cursor)
      return {items,next_cursor:null}
    },
    binding:()=>http.get<components['schemas']['Binding']>('/api/v1/me/binding'),
    bindingRequest:(command:PreparedCommand)=>http.execute<components['schemas']['BindingRequestView']>(command),
    registerPatient:(command:PreparedCommand)=>http.execute<components['schemas']['PatientView']>(command),
    commandResult:(command:PreparedCommand)=>http.requestResult<{status:string}>(command),
    treatments:(cursor?:string)=>http.get<{items:components['schemas']['CatalogItem'][];next_cursor:string|null}>(`/api/v1/treatments?limit=100${cursor?`&cursor=${encodeURIComponent(cursor)}`:''}`),
    bookingCandidates:(query:string)=>http.get<{items:components['schemas']['Candidate'][];next_cursor:string|null}>(`/api/v1/appointment-candidates?${query}`),
    book:(command:PreparedCommand)=>http.execute<components['schemas']['AppointmentView']>(command),
    billCommand:(command:PreparedCommand)=>http.execute<components['schemas']['PatientBill']>(command),
    ownBills:(cursor?:string)=>http.get<components['schemas']['PatientBillPage']>(`/api/v1/patient-bills?limit=100${cursor?`&cursor=${encodeURIComponent(cursor)}`:''}`),
    bill:(id:string)=>http.get<components['schemas']['PatientBill']>(`/api/v1/patient-bills/${encodeURIComponent(id)}`),
    ownAppointments:(cursor?:string)=>http.get<{items:components['schemas']['AppointmentView'][];next_cursor:string|null}>(`/api/v1/appointments?limit=100${cursor?`&cursor=${encodeURIComponent(cursor)}`:''}`),
    cancelAppointment:(command:PreparedCommand)=>http.execute<components['schemas']['AppointmentView']>(command),
    async patientProfile(cursor?:string):Promise<{patient:components['schemas']['PatientView'];allergies:{items:components['schemas']['AllergyView'][];next_cursor:string|null}}> {
      const identity=await me()
      if(!identity.binding)throw new ApiFailure(403,'PATIENT_BINDING_REQUIRED')
      const patientId=identity.binding.patient_id
      const patient=await http.get<components['schemas']['PatientView']>(`/api/v1/patients/${encodeURIComponent(patientId)}`)
      const allergies=await http.get<{items:components['schemas']['AllergyView'][];next_cursor:string|null}>(`/api/v1/patients/${encodeURIComponent(patientId)}/allergy-records${cursor?`?cursor=${encodeURIComponent(cursor)}`:''}`)
      return {patient,allergies}
    },
    async login(): Promise<Identity> {
      const code = await new Promise<string>((resolve, reject) => wx.login({
        timeout: 15000,
        success: result => result.code ? resolve(result.code) : reject(new ApiFailure(0, 'CLIENT_WECHAT_LOGIN_UNAVAILABLE')),
        fail: () => reject(new ApiFailure(0, 'CLIENT_WECHAT_LOGIN_UNAVAILABLE')),
      }))
      const issued = await new Promise<WechatSession>((resolve, reject) => wx.request({
        url: `${baseUrl}/api/v1/auth/wechat-sessions`, method: 'POST', data: { code }, timeout: 15000,
        success: result => {
          if (result.statusCode >= 200 && result.statusCode < 300) resolve(result.data as WechatSession)
          else { const error = result.data as { code?: string; request_id?: string }; reject(new ApiFailure(result.statusCode, error?.code ?? 'IDENTITY_UNAVAILABLE', error?.request_id)) }
        }, fail: () => reject(new ApiFailure(0, 'CLIENT_LOGIN_NETWORK_UNAVAILABLE')),
      }))
      if (!issued.access_token || !/^[A-Za-z0-9_-]{43}$/.test(issued.access_token) || issued.subject_type !== 'PATIENT') throw new ApiFailure(503, 'INVALID_RESPONSE')
      session = issued.access_token
      pendingLogout = undefined
      return me()
    },
    async logout(): Promise<void> {
      pendingLogout ??= await prepareCommand('logout', 'DELETE', '/api/v1/auth/session', {})
      try { await http.execute(pendingLogout) } catch (error) {
        if (error instanceof ApiFailure && error.status === 401) { /* Already invalid. */ }
        else if (error instanceof UnknownOutcomeError) {
          try { await me(); throw error } catch (probe) {
            if (!(probe instanceof ApiFailure && probe.status === 401)) throw error
          }
        } else throw error
      }
      session = undefined
      pendingLogout = undefined
    },
  }
}

