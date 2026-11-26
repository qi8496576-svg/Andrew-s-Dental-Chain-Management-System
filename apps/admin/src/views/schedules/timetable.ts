export interface TimedShift {schedule_id:string;start_time:string;end_time:string}
export interface PositionedShift<T extends TimedShift> {schedule:T;start:number;end:number;lane:number;lanes:number}

export function minuteOfDay(time:string) {
  const [hour=0,minute=0,second=0]=time.split(':').map(Number)
  return hour*60+minute+second/60
}

export function timetableRange(shifts:TimedShift[]) {
  return {
    start:Math.floor(Math.min(8*60,...shifts.map(s=>minuteOfDay(s.start_time)))/60)*60,
    end:Math.ceil(Math.max(20*60,...shifts.map(s=>minuteOfDay(s.end_time)))/60)*60,
  }
}

/** Concurrent doctors share lanes. Adjacent shifts can reuse the same lane. */
export function positionShifts<T extends TimedShift>(shifts:T[]):PositionedShift<T>[] {
  const sorted=shifts.map(schedule=>({schedule,start:minuteOfDay(schedule.start_time),end:minuteOfDay(schedule.end_time),lane:0,lanes:1}))
    .sort((a,b)=>a.start-b.start||a.end-b.end||a.schedule.schedule_id.localeCompare(b.schedule.schedule_id))
  let group:PositionedShift<T>[]=[],groupEnd=-1,laneEnds:number[]=[]
  function finishGroup(){for(const item of group)item.lanes=laneEnds.length;group=[];laneEnds=[]}
  for(const item of sorted){
    if(item.start>=groupEnd){finishGroup();groupEnd=item.end}
    let lane=laneEnds.findIndex(end=>end<=item.start)
    if(lane===-1)lane=laneEnds.length
    laneEnds[lane]=item.end;item.lane=lane;group.push(item);groupEnd=Math.max(groupEnd,item.end)
  }
  finishGroup()
  return sorted
}

export function clockLabel(minute:number) {
  return `${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`
}
