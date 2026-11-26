import { describe, expect, it } from 'vitest'
import { navigationFor } from './navigation'

describe('shared navigation', () => {
  it('keeps unauthorized modules out of the shared shell', () => {
    expect(navigationFor(() => false)).toEqual([])
  })
  it('keeps appointments and schedules as separate reception entries', () => {
    const groups = navigationFor((role, capability) => role === 'RECEPTION' && ['listAppointments', 'listSchedules'].includes(capability))
    expect(groups.flatMap(group => group.items.map(item => item.to))).toEqual(['/appointment-booking', '/schedules'])
  })
  it('supports an explicitly authorized multi-role subject without synthesizing permissions', () => {
    const permitted = new Set(['DENTIST:getClinicalContext', 'CASHIER:getInvoice'])
    const entries = navigationFor((role, capability) => permitted.has(`${role}:${capability}`)).flatMap(group => group.items)
    expect(entries.map(item => item.to)).toEqual(['/clinical-treatment', '/invoicing'])
    expect(entries.some(item => item.to === '/staff-accounts')).toBe(false)
  })
})
