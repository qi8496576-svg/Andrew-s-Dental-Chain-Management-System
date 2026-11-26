import {expect,it} from 'vitest'
import {clockLabel,minuteOfDay,positionShifts,timetableRange} from './timetable'
const shift=(id:string,start:string,end:string)=>({schedule_id:id,start_time:start,end_time:end})
it('extends the visible day to include early and late shifts',()=>{
 expect(timetableRange([])).toEqual({start:480,end:1200})
 expect(timetableRange([shift('1','06:45:00','22:15:00')])).toEqual({start:360,end:1380})
 expect(minuteOfDay('09:30:30')).toBe(570.5)
 expect(clockLabel(1440)).toBe('24:00')
})
it('separates concurrent doctors and returns full width to a later independent shift',()=>{
 const result=positionShifts([shift('3','14:00:00','15:00:00'),shift('2','09:30:00','11:00:00'),shift('1','09:00:00','10:00:00')])
 expect(result.map(r=>[r.schedule.schedule_id,r.lane,r.lanes])).toEqual([['1',0,2],['2',1,2],['3',0,1]])
 expect(result[1]!.start-result[0]!.start).toBe(30)
})
it('reuses lanes at an exact boundary without hiding short or nested shifts',()=>{
 const result=positionShifts([shift('1','09:00:00','12:00:00'),shift('2','09:15:00','09:30:00'),shift('3','09:30:00','10:00:00'),shift('4','12:00:00','13:00:00')])
 expect(result.map(r=>[r.lane,r.lanes])).toEqual([[0,2],[1,2],[1,2],[0,1]])
 expect(result[1]!.end-result[1]!.start).toBe(15)
})
