export function shiftDate(date:string,days:number){const value=new Date(`${date}T12:00:00Z`);value.setUTCDate(value.getUTCDate()+days);return value.toISOString().slice(0,10)}
export function weekDays(date:string){const value=new Date(`${date}T12:00:00Z`),offset=(value.getUTCDay()+6)%7;return Array.from({length:7},(_,index)=>shiftDate(date,index-offset))}
export function shanghaiToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
