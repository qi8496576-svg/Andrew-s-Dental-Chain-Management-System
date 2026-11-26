import { API_ORIGIN } from '../config'
import { createPatientAuthentication } from './authentication'
let client:ReturnType<typeof createPatientAuthentication>|undefined
export function patientSession(){
  if(!API_ORIGIN)throw new Error('Service configuration unavailable')
  client??=createPatientAuthentication(API_ORIGIN)
  return client
}
