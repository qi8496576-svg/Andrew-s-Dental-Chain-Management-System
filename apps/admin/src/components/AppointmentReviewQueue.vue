<script setup lang="ts">
import {onMounted,ref} from 'vue'
import type {components} from '@adc/contracts'
import {createProtectedClient} from '../api/protected'
import {useAuthenticationStore} from '../stores/authentication'
const props=defineProps<{kind:'no-show'|'reschedule'}>(),emit=defineEmits<{select:[components['schemas']['AppointmentView'] ]}>(),api=createProtectedClient(),auth=useAuthenticationStore()
type Appointment=components['schemas']['AppointmentView']
const rows=ref<Appointment[]>([]),busy=ref(false),error=ref('')
async function load(){busy.value=true;rows.value=[];error.value='';try{const all:Appointment[]=[];let cursor:string|null=null;do{const query=new URLSearchParams({role:'RECEPTION',review:props.kind,limit:'100'});if(cursor)query.set('cursor',cursor);const page:{items:Appointment[];next_cursor:string|null}=await api.get('/api/v1/workspace/appointments?'+query);all.push(...page.items);cursor=page.next_cursor}while(cursor);rows.value=all}catch{rows.value=[];error.value='待办暂未取得，请刷新；本页不会自动登记爽约或取消。'}finally{busy.value=false}}
onMounted(()=>{if(auth.canAccess('RECEPTION','listAppointments') && auth.canAccess('RECEPTION','listSchedules'))load()})
</script>
<template><section v-if="auth.canAccess('RECEPTION','listAppointments') && auth.canAccess('RECEPTION','listSchedules')" class="review-queue"><h2>{{kind==='no-show'?'已结束但尚未处理的预约':'停诊待处理预约'}}</h2><p>列表只提供待核实线索，最终办理由服务器再次校验。</p><button :disabled="busy" @click="load">刷新待核实列表</button><p v-if="error" role="alert">{{error}}</p><ul><li v-for="item in rows" :key="item.appointment_id">{{new Date(item.scheduled_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}} · 诊所 {{item.clinic_id}} · 预约 {{item.appointment_id}} <button @click="emit('select',item)">选择此预约核实处理</button></li></ul><p v-if="!busy && !error && !rows.length">暂无符合当前授权范围的待核实预约。</p></section></template>
<style scoped>.review-queue{padding:18px;background:#f2f7f4;margin:18px 0}.review-queue li{padding:10px 0}</style>
