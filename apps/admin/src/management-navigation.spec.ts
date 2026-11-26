import { describe, expect, it } from 'vitest'
import { managementEntries, resourceKind } from './management-navigation'
describe('management destinations', () => {
  it('rejects unknown or ambiguous resource query values', () => {
    expect(resourceKind('dentists')).toBe('dentists')
    expect(resourceKind('beds')).toBe('clinics')
    expect(resourceKind(['dentists', 'clinics'])).toBe('clinics')
  })
  it('offers no management links without existing capabilities', () => {
    expect(managementEntries(() => false)).toEqual([])
  })
  it('reuses actual resource pages and retains separate account/grant permissions', () => {
    const entries = managementEntries((role, cap) => role === 'HEADQUARTERS' && cap === 'resource.read')
    expect(entries).toHaveLength(5)
    expect(entries.find(item => item.label === '医生与执业资质')?.to).toBe('/settings/dentists')
    expect(entries.some(item => item.to.includes('staff-accounts'))).toBe(false)
    expect(entries.some(item => item.label.includes('床位'))).toBe(false)
  })
  it('keeps every configuration destination separate from daily navigation', async () => {
    const {navigationFor}=await import('./navigation')
    const daily=new Set(navigationFor(()=>true).flatMap(group=>group.items.map(item=>item.to)))
    const entries=managementEntries(()=>true)
    expect(entries).toHaveLength(7)
    expect(new Set(entries.map(item=>item.to)).size).toBe(7)
    expect(entries.every(item=>!daily.has(item.to))).toBe(true)
  })
})
