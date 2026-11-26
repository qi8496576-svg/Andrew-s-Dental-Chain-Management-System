<script setup lang="ts">
import { computed,onMounted,ref,watch } from 'vue'
import { ElDialog } from 'element-plus/es/components/dialog/index'
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-dialog.css'
import type { components } from '@adc/contracts'
import { createProtectedClient } from '../../api/protected'
import { ApiFailure,prepareCommand,UnknownOutcomeError,type PreparedCommand } from '../../api/http'
import { useAuthenticationStore } from '../../stores/authentication'
import {storeToRefs} from 'pinia'
import {useViewScope} from '../../stores/view-scope'
import { weekDays,shiftDate,shanghaiToday } from './week'
import {positionShifts,timetableRange,clockLabel,type PositionedShift} from './timetable'
type Schedule=components['schemas']['ScheduleView'];type Catalog=components['schemas']['CatalogItem']
const api=createProtectedClient(),auth=useAuthenticationStore(),dentist=ref(''),clinics=ref<Catalog[]>([]),doctors=ref<Catalog[]>([]),rows=ref<Schedule[]>([]),busy=ref(false),error=ref(''),notice=ref(''),unknown=ref(false),dialog=ref(false),suspending=ref<Schedule|null>(null),reason=ref(''),affected=ref<string[]>([])
const form=ref({dentist_id:'',clinic_id:'',schedule_date:shanghaiToday(),start_time:'09:00',end_time:'10:00',slot_minutes:20,note:''})
const days=computed(()=>weekDays(date.value)),can=(cap:string)=>auth.canAccess('RECEPTION',cap)
const scope=useViewScope(),{date,clinic}=storeToRefs(scope)
watch([date,clinic,dentist],()=>load())
let pending:PreparedCommand|undefined
const viewMode=ref<'week'|'day'>('week')
const pixelsPerMinute=1.15,timetableHeader=ref<HTMLElement>(),detailOpen=ref(false),selectedShift=ref<Schedule|null>(null)
const dailyRows=computed(()=>rows.value.filter(row=>row.schedule_date===date.value))
const range=computed(()=>timetableRange(dailyRows.value)),gridHeight=computed(()=>(range.value.end-range.value.start)*pixelsPerMinute)
const ticks=computed(()=>Array.from({length:(range.value.end-range.value.start)/30+1},(_,i)=>range.value.start+i*30))
const weekColumns=computed(()=>days.value.map(day=>{const shifts=rows.value.filter(row=>row.schedule_date===day);return {day,count:shifts.length,doctors:[...new Set(shifts.map(row=>row.dentist_id))].map(id=>({id,shifts:shifts.filter(row=>row.dentist_id===id).sort((a,b)=>a.start_time.localeCompare(b.start_time)||a.schedule_id.localeCompare(b.schedule_id))}))}}))
const doctorColumns=computed(()=>[...new Set(dailyRows.value.map(row=>row.dentist_id))].map(id=>({id,entries:positionShifts(dailyRows.value.filter(row=>row.dentist_id===id))})))
const normalCount=computed(()=>rows.value.filter(row=>row.schedule_status==='NORMAL').length)
const weekDoctorCount=computed(()=>new Set(rows.value.map(row=>row.dentist_id)).size)
const timelineStyle=computed(()=>({gridTemplateColumns:`64px repeat(${Math.max(doctorColumns.value.length,1)}, minmax(190px, 1fr))`,minWidth:64+Math.max(doctorColumns.value.length,1)*190+'px'}))
const doctorName=(id:string)=>doctors.value.find(item=>item.id===id)?.label??'医生 '+id
const clinicName=(id:string)=>clinics.value.find(item=>item.id===id)?.label??'诊所 '+id
function entryLabel(shift:Schedule){return shift.schedule_date+' '+shift.start_time.slice(0,5)+'–'+shift.end_time.slice(0,5)+' · '+doctorName(shift.dentist_id)+' · '+clinicName(shift.clinic_id)+' · '+(shift.schedule_status==='SUSPENDED'?'已停诊':'正常出诊')}
function entryStyle(entry:PositionedShift<Schedule>){return {top:(entry.start-range.value.start)*pixelsPerMinute+2+'px',height:Math.max((entry.end-entry.start)*pixelsPerMinute-4,2)+'px',left:'calc('+entry.lane/entry.lanes*100+'% + 3px)',width:'calc('+100/entry.lanes+'% - 6px)'}}
function showDetails(shift:Schedule){selectedShift.value=shift;detailOpen.value=true}
function showDay(day:string){date.value=day;viewMode.value='day'}
function syncHeader(event:Event){if(timetableHeader.value)timetableHeader.value.scrollLeft=(event.currentTarget as HTMLElement).scrollLeft}
function currentWeek(){const today=shanghaiToday();if(date.value===today)void load();else date.value=today}
let loadVersion=0
async function failed(failure:unknown){error.value=failure instanceof ApiFailure?`操作未完成：${failure.message}`:'连接暂时不可用。';if(failure instanceof ApiFailure && [401,403].includes(failure.status)){rows.value=[];affected.value=[];await auth.ensure()}}
async function catalog(path:string){const all:Catalog[]=[];let next:string|null=null;do{const page:{items:Catalog[];next_cursor:string|null}=await api.get<{items:Catalog[];next_cursor:string|null}>(`${path}?limit=100${next?`&cursor=${encodeURIComponent(next)}`:''}`);all.push(...page.items);next=page.next_cursor}while(next);return all}
async function load(){if(!date.value)return;const version=++loadVersion;busy.value=true;error.value='';rows.value=[];try{const query=new URLSearchParams({start:days.value[0]+'T00:00:00+08:00',end:shiftDate(days.value[6]!,1)+'T00:00:00+08:00',limit:'100'});if(clinic.value)query.set('clinic_id',clinic.value);if(dentist.value)query.set('dentist_id',dentist.value);const all:Schedule[]=[];let next:string|null=null;do{const page:{items:Schedule[];next_cursor:string|null}=await api.get('/api/v1/schedules?'+query+(next?'&cursor='+encodeURIComponent(next):''));if(version!==loadVersion)return;all.push(...page.items);next=page.next_cursor}while(next);rows.value=all}catch(failure){if(version===loadVersion){rows.value=[];await failed(failure)}}finally{if(version===loadVersion)busy.value=false}}
function move(offset:number){date.value=shiftDate(date.value,offset)}

function create(){if(pending)return;form.value={...form.value,clinic_id:clinic.value || clinics.value[0]?.id || '',dentist_id:dentist.value || doctors.value[0]?.id || '',schedule_date:date.value};suspending.value=null;dialog.value=true}
function suspend(row:Schedule){if(pending)return;suspending.value=row;reason.value='';dialog.value=true}
async function execute(){if(!pending)return;busy.value=true;error.value='';try{const op=pending.operation,result=await api.execute<Schedule|components['schemas']['SuspendView']>(pending);if(op==='suspendSchedule'){affected.value=(result.data as components['schemas']['SuspendView']).affected_appointment_ids;notice.value=`班次已停诊，${affected.value.length} 个预约待前台人工处理；预约状态保持不变。`}else{notice.value='正常班次已保存，预约仍需满足全部资格及占位规则。';affected.value=[]}pending=undefined;unknown.value=false;dialog.value=false;await load()}catch(failure){if(failure instanceof UnknownOutcomeError){unknown.value=true;error.value='结果确认中，请保留当前页面并重新确认办理结果。'}else{pending=undefined;unknown.value=false;await failed(failure)}}finally{busy.value=false}}
async function save(){if(pending)return;if(suspending.value)pending=prepareCommand('suspendSchedule','POST',`/api/v1/schedules/${suspending.value.schedule_id}/suspend`,{reason:reason.value});else pending=prepareCommand('createSchedule','POST','/api/v1/schedules',{...form.value,start_time:`${form.value.start_time}:00`,end_time:`${form.value.end_time}:00`,note:form.value.note || null});await execute()}
async function query(){if(!pending)return;try{const result=await api.requestResult<{status:string}>(pending);notice.value=result.status==='SUCCEEDED'?'原请求已成功，请重新确认取得当前结果。':'尚未确认成功，可重新确认办理结果。'}catch(failure){await failed(failure)}}
onMounted(async()=>{try{[clinics.value,doctors.value]=await Promise.all([catalog('/api/v1/clinics'),catalog('/api/v1/dentists')]);await load()}catch(failure){await failed(failure)}})
</script>
<template><section><div class="page-heading"><div><h1>出诊排班</h1><p class="muted">按时间查看一周出诊安排 · 北京时间</p></div><button v-if="can('createSchedule')" :disabled="busy || unknown" @click="create">新增出诊班次</button></div>
<p v-if="error" role="alert" class="error-message">{{error}}</p><p v-if="notice" role="status">{{notice}}</p><p v-if="affected.length">待处理预约 ID：{{affected.join('、')}}。请在预约管理中按停诊改约流程处理。</p>
<div v-if="unknown"><button @click="query" :disabled="busy">查询办理进度</button><button @click="execute" :disabled="busy">重新确认办理结果</button></div>
<form class="week-toolbar" @submit.prevent="load"><label>查看日期<input v-model="date" type="date" required :disabled="busy || unknown"></label><label>排班诊所<select v-model="clinic" :disabled="busy || unknown"><option value="">全部授权诊所</option><option v-for="item in clinics" :key="item.id" :value="item.id">{{item.label}}</option></select></label><label>排班医生<select v-model="dentist" aria-label="排班医生" :disabled="busy || unknown"><option value="">全部可见医生</option><option v-for="item in doctors" :key="item.id" :value="item.id">{{item.label}}</option></select></label><button :disabled="busy || unknown">查看周排班</button><button type="button" :disabled="busy || unknown" @click="currentWeek">回到本周</button><button type="button" :disabled="busy || unknown" @click="move(-7)">上一周</button><button type="button" :disabled="busy || unknown" @click="move(7)">下一周</button></form>
<div class="schedule-summary"><div><strong>{{normalCount}}</strong><span>正常出诊班次</span></div><div><strong>{{weekDoctorCount}}</strong><span>本周出诊医生</span></div><div><strong>{{rows.length-normalCount}}</strong><span>已停诊班次</span></div><p>班次与患者端共用同一份排班数据；可约时间以预约时的资格和占位核验为准。</p></div>
<div class="timetable-toolbar"><div><h2 id="timetable-title">{{days[0]}} 至 {{days[6]}}</h2><p>{{viewMode==='week'?'按日期和医生查看整周安排':'查看日期：'+date+' · 北京时间'}}</p></div><div class="schedule-view-tabs" role="group" aria-label="排班视图"><button type="button" :aria-pressed="viewMode==='week'" @click="viewMode='week'">周概览</button><button type="button" :aria-pressed="viewMode==='day'" @click="viewMode='day'">日视图</button></div></div>
<p v-if="busy" class="timetable-feedback" role="status">正在读取本周排班…</p><p v-else-if="!rows.length&&!error" class="timetable-feedback" role="status">本周没有符合筛选条件的出诊班次，可调整诊所、医生或查看日期。</p>
<section v-if="viewMode==='week'" class="week-overview" aria-labelledby="timetable-title" :aria-busy="busy" tabindex="0" aria-label="整周出诊安排，窄屏可左右滚动">
 <section v-for="(column,index) in weekColumns" :key="column.day" class="week-day" :class="{'is-today':column.day===scope.today}">
  <button type="button" class="week-day-heading" :aria-label="column.day+' 查看日视图'" @click="showDay(column.day)"><span>{{['周一','周二','周三','周四','周五','周六','周日'][index]}}<small v-if="column.day===scope.today">今天</small></span><strong>{{column.day.slice(5).replace('-',' / ')}}</strong><span>{{column.count}} 个班次 <span aria-hidden="true">↗</span></span></button>
  <div class="week-doctors"><article v-for="doctor in column.doctors" :key="doctor.id" class="week-doctor"><h3>{{doctorName(doctor.id)}}</h3><button v-for="shift in doctor.shifts" :key="shift.schedule_id" type="button" class="agenda-shift" :class="{suspended:shift.schedule_status==='SUSPENDED'}" :data-schedule="shift.schedule_id" :aria-label="entryLabel(shift)" :title="entryLabel(shift)" @click="showDetails(shift)"><span class="agenda-time">{{shift.start_time.slice(0,5)}}–{{shift.end_time.slice(0,5)}}</span><span class="agenda-clinic">{{clinicName(shift.clinic_id)}}</span><span v-if="shift.schedule_status==='SUSPENDED'" class="agenda-status">已停诊</span></button></article><p v-if="!column.count" class="day-empty">暂无出诊安排</p></div>
 </section>
</section>
<section v-else class="daily-schedule"><div class="date-tabs" role="group" aria-label="选择出诊日期"><button v-for="(day,index) in days" :key="day" type="button" :aria-pressed="day===date" :disabled="busy||unknown" @click="showDay(day)"><span>{{['周一','周二','周三','周四','周五','周六','周日'][index]}}</span><strong>{{day.slice(5)}}</strong></button></div>
<p v-if="!dailyRows.length&&!busy" class="timetable-feedback">当天暂无符合筛选条件的班次，请选择其他日期。</p>
<section v-if="dailyRows.length" class="timetable-shell" aria-labelledby="timetable-title" :aria-busy="busy">
 <div ref="timetableHeader" class="timetable-heading-scroll"><div class="timetable-heading" :style="timelineStyle"><div class="time-heading">时间<small>北京时间</small></div><div v-for="column in doctorColumns" :key="column.id" class="day-heading"><strong>{{doctorName(column.id)}}</strong><span>{{column.entries.length}} 个出诊班次</span></div></div></div>
 <div class="timetable-scroll" tabindex="0" aria-label="当日医生出诊安排，可上下查看时段，医生较多时可左右滚动" @scroll="syncHeader"><div class="timetable-body" :style="{...timelineStyle,height:gridHeight+'px'}">
  <div class="time-axis" aria-hidden="true"><span v-for="tick in ticks" :key="tick" class="time-label" :class="{'half-hour':tick%60!==0,'first-tick':tick===range.start,'last-tick':tick===range.end}" :style="{top:(tick-range.start)*pixelsPerMinute+'px'}">{{clockLabel(tick)}}</span></div>
  <section v-for="column in doctorColumns" :key="column.id" class="timetable-day" :aria-label="doctorName(column.id)+' 出诊安排'">
   <div v-for="tick in ticks.slice(0,-1)" :key="tick" class="time-gridline" :class="{'half-hour':tick%60!==0}" :style="{top:(tick-range.start)*pixelsPerMinute+'px'}" aria-hidden="true"></div>
   <article v-for="entry in column.entries" :key="entry.schedule.schedule_id" class="shift-card" :class="{suspended:entry.schedule.schedule_status==='SUSPENDED',compact:entry.end-entry.start<35,narrow:entry.lanes>1}" :style="entryStyle(entry)" :data-schedule="entry.schedule.schedule_id" :data-start="entry.schedule.start_time">
    <button type="button" class="timetable-entry" :aria-label="entryLabel(entry.schedule)" :title="entryLabel(entry.schedule)" @click="showDetails(entry.schedule)"><strong class="entry-time"><span>{{entry.schedule.start_time.slice(0,5)}}</span><span class="entry-time-end">–{{entry.schedule.end_time.slice(0,5)}}</span></strong><span class="entry-doctor">{{doctorName(entry.schedule.dentist_id)}}</span><small class="entry-clinic">{{clinicName(entry.schedule.clinic_id)}}</small><span v-if="entry.schedule.schedule_status==='SUSPENDED'" class="entry-status">已停诊</span></button>
   </article>
  </section>
 </div></div>
 <footer class="timetable-footer"><span>每列为一位医生。点击班次查看详情或办理停诊。</span><span>向下查看晚间时段 ↓</span></footer>
</section>
</section>
<ElDialog v-model="detailOpen" title="出诊班次详情" width="480px"><template v-if="selectedShift"><p class="shift-detail-time">{{selectedShift.schedule_date}} · {{selectedShift.start_time.slice(0,5)}}–{{selectedShift.end_time.slice(0,5)}}</p><dl class="shift-details"><dt>出诊医生</dt><dd>{{doctorName(selectedShift.dentist_id)}}</dd><dt>实际诊所</dt><dd>{{clinicName(selectedShift.clinic_id)}}</dd><dt>时隙</dt><dd>{{selectedShift.slot_minutes}} 分钟 / 时隙</dd><dt>当前状态</dt><dd>{{selectedShift.schedule_status==='SUSPENDED'?'已停诊':'正常出诊'}}</dd><dt>排班备注</dt><dd>{{selectedShift.note||'未填写'}}</dd></dl><p class="workspace-note">可约时隙以有效排班及合法候选为准；停诊后的预约须逐条核实处理。</p><div class="dialog-actions"><button @click="detailOpen=false">关闭</button><button v-if="can('suspendSchedule')&&selectedShift.schedule_status==='NORMAL'" class="compact-primary" :disabled="busy||unknown" @click="detailOpen=false;suspend(selectedShift)">办理停诊</button></div></template></ElDialog>
<ElDialog v-model="dialog" :title="suspending?'办理停诊':'新增出诊班次'" width="540px" :close-on-click-modal="false" :close-on-press-escape="!unknown" :show-close="!unknown"><p v-if="error" role="alert" class="error-message">{{error}}</p><form @submit.prevent="save"><fieldset :disabled="busy || unknown"><template v-if="suspending"><p>{{suspending.schedule_date}} {{suspending.start_time}}–{{suspending.end_time}}</p><p>停诊保留班次及预约。系统列出待处理预约，由前台核实患者意向后办理。</p><label>停诊原因<input v-model="reason" maxlength="255" required></label></template><template v-else><label>出诊诊所<select v-model="form.clinic_id" required><option v-for="item in clinics" :key="item.id" :value="item.id">{{item.label}}</option></select></label><label>出诊医生<select v-model="form.dentist_id" required><option v-for="item in doctors" :key="item.id" :value="item.id">{{item.label}}</option></select></label><label>出诊日期<input v-model="form.schedule_date" type="date" required></label><label>开始时间<input v-model="form.start_time" type="time" required></label><label>结束时间<input v-model="form.end_time" type="time" required></label><label>时隙分钟<input v-model.number="form.slot_minutes" type="number" min="1" max="32767" required></label><label>排班备注<input v-model="form.note" maxlength="255"></label></template><button>{{suspending?'确认停诊并查看影响':'保存出诊班次'}}</button></fieldset></form><div v-if="unknown"><button :disabled="busy" @click="query">查询办理进度</button><button :disabled="busy" @click="execute">重新确认办理结果</button></div></ElDialog>
</section></template>
<style scoped src="./schedule.css"></style>
