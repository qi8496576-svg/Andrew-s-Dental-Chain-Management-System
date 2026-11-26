import {afterEach,expect,it,vi} from 'vitest'
const storage=new Map<string,string>()
function setup(){vi.stubGlobal('sessionStorage',{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value)});storage.clear()}
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules()})
it('restores only metadata after refresh and reuses the original key without storing clinical text',async()=>{
 setup();const recovery=await import('./outcome-recovery'),http=await import('./http');recovery.setRecoverySubject('staff-one')
 const original=http.prepareCommand('updateClinicalNotes','PATCH','/api/v1/appointments/11/clinical-notes',{problems_or_special_needs:'PRIVATE_CLINICAL_TEXT'},'"original"')
 await recovery.retainRequest(original);recovery.uncertainRequest(original.key)
 expect(storage.get('adc-command-recovery-v1')).not.toContain('PRIVATE_CLINICAL_TEXT')
 vi.resetModules();const resumed=await import('./outcome-recovery'),transport=await import('./http');resumed.setRecoverySubject('staff-one')
 expect(resumed.recoveryRecords()).toHaveLength(1)
 const retry=transport.prepareCommand('updateClinicalNotes','PATCH',original.path,JSON.parse(original.body),'"changed-version"')
 expect(retry.key).toBe(original.key);expect(retry.ifMatch).toBe('"original"');await expect(resumed.retainRequest(retry)).resolves.toBeUndefined()
 const changed={...retry,body:JSON.stringify({problems_or_special_needs:'different content'})};await expect(resumed.retainRequest(changed)).rejects.toThrow('REQUEST_OUTCOME_PENDING')
 resumed.finishRequest(retry.key);expect(resumed.recoveryRecords()).toHaveLength(0)
})
it('does not expose another employee pending metadata or allow a second command during uncertainty',async()=>{
 setup();const recovery=await import('./outcome-recovery'),http=await import('./http');recovery.setRecoverySubject('staff-one')
 const command=http.prepareCommand('invoiceAppointment','POST','/api/v1/appointments/11/invoice',{});await recovery.retainRequest(command);recovery.uncertainRequest(command.key)
 await expect(recovery.retainRequest(http.prepareCommand('invoiceAppointment','POST','/api/v1/appointments/12/invoice',{}))).rejects.toThrow('REQUEST_OUTCOME_PENDING')
 recovery.setRecoverySubject('staff-two');expect(recovery.recoveryRecords()).toHaveLength(0);expect(recovery.originalRequest(command.operation,command.method,command.path)).toBeUndefined()
})
