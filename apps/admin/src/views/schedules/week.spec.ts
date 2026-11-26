import { expect,it } from 'vitest'
import { weekDays,shiftDate } from './week'
it('uses a Monday week across month and year boundaries without relying on browser time zone',()=>{
  expect(weekDays('2027-01-01')).toEqual(['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03'])
  expect(shiftDate('2026-11-12',7)).toBe('2026-11-19')
})
