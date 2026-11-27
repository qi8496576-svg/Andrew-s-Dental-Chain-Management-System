<script setup lang="ts">
import { onMounted,ref,watch } from 'vue'
import { ElDialog } from 'element-plus/es/components/dialog/index'
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-dialog.css'
import type { components } from '@adc/contracts'
import { createProtectedClient } from '../../api/protected'
import { ApiFailure,prepareCommand,UnknownOutcomeError,type PreparedCommand } from '../../api/http'
import { useAuthenticationStore } from '../../stores/authentication'
type Request=components['schemas']['BindingRequestView']
const api=createProtectedClient(),auth=useAuthenticationStore()
const rows=ref<Request[]>([]),next=ref<string|null>(null),selected=ref<Request|null>(null),patientId=ref(''),oldSubject=ref(''),service=ref(''),reason=ref(''),checkedNumber=ref(false),checkedBirth=ref(false),confirmed=ref(false),busy=ref(false),error=ref(''),notice=ref(''),unknown=ref(false)
let pending:PreparedCommand|undefined
const can=(cap:string)=>auth.canAccess('RECEPTION',cap)
watch([selected,service,checkedNumber,checkedBirth,confirmed],()=>{patientId.value=''})
async function failed(failure:unknown){error.value=failure instanceof ApiFailure?`操作未完成：${failure.message}`:'连接暂时不可用。';if(failure instanceof ApiFailure && [401,403].includes(failure.status)){rows.value=[];selected.value=null;patientId.value='';await auth.ensure()}}
async function load(more=false){busy.value=true;error.value='';try{const page=await api.get<{items:Request[];next_cursor:string|null}>(`/api/v1/binding-requests${more && next.value?`?cursor=${encodeURIComponent(next.value)}`:''}`);rows.value=more?[...rows.value,...page.items]:page.items;next.value=page.next_cursor}catch(failure){await failed(failure)}finally{busy.value=false}}
function select(row:Request){if(pending)return;selected.value=row;patientId.value='';checkedNumber.value=false;checkedBirth.value=false;confirmed.value=false;service.value='';reason.value='';notice.value='';error.value=''}
function closeReview(){if(!busy.value && !pending)selected.value=null}
function basis(){return {clinic_id:selected.value!.clinic_id,patient_number_checked:checkedNumber.value,date_of_birth_checked:checkedBirth.value,person_confirmed:confirmed.value,service_basis:service.value}}
async function execute(){if(!pending)return;busy.value=true;error.value='';const op=pending.operation;try{const result=await api.execute<components['schemas']['PatientLookupResult']>(pending);if(op==='lookupPatient')patientId.value=result.data.patient.patient_id;else{notice.value=op==='revokePatientBinding'?'解绑已完成，历史记录保留。':'绑定已保存，旧身份的访问依据立即失效。';selected.value=null;await load()}pending=undefined;unknown.value=false}catch(failure){if(failure instanceof UnknownOutcomeError){unknown.value=true;error.value='结果确认中，请保留当前页面并重新确认办理结果。'}else{pending=undefined;unknown.value=false;await failed(failure)}}finally{busy.value=false}}
async function lookup(){if(!selected.value || pending)return;pending=prepareCommand('lookupPatient','POST','/api/v1/patients/lookup',{patient_number:selected.value.patient_number,date_of_birth:selected.value.date_of_birth,verification_basis:{clinic_id:selected.value.clinic_id,person_confirmed:confirmed.value,service_basis:service.value}});await execute()}
async function submit(action:'approve'|'rebind'|'revoke'){if(!selected.value || pending)return;const row=selected.value;const body={verification_basis:basis(),reason:reason.value};if(action==='approve')pending=prepareCommand('approvePatientBinding','POST',`/api/v1/binding-requests/${encodeURIComponent(row.request_id)}/approve`,{...body,patient_id:patientId.value});else if(action==='rebind')pending=prepareCommand('rebindPatient','POST',`/api/v1/patient-bindings/${encodeURIComponent(oldSubject.value)}/rebind`,{...body,new_subject_id:row.subject_id,binding_request_id:row.request_id});else pending=prepareCommand('revokePatientBinding','POST',`/api/v1/patient-bindings/${encodeURIComponent(row.subject_id)}/revoke`,body);await execute()}
async function query(){if(!pending)return;try{const result=await api.requestResult<{status:string}>(pending);notice.value=result.status==='SUCCEEDED'?'原请求已成功，请重新确认读取当前授权结果。':'尚未确认成功，可重新确认办理结果。'}catch(failure){await failed(failure)}}
onMounted(()=>load())
</script>
<template>
  <section><div class="page-heading"><div><h1>患者身份绑定</h1><p>首次本人登记自动关联；已有档案及换号须由门店核实。每个档案同时仅保留一个有效登录身份。</p></div><button :disabled="busy || unknown" @click="load()">刷新申请</button></div>
    <p v-if="error" role="alert" class="error-message">{{error}}</p><p v-if="notice" role="status">{{notice}}</p>
    <div v-if="unknown"><button :disabled="busy" @click="query">查询办理进度</button><button :disabled="busy" @click="execute">重新确认办理结果</button></div>
    <table><caption>本次授权诊所的申请；历史批准记录不代表当前有效绑定</caption><thead><tr><th>患者编号</th><th>出生日期</th><th>服务诊所</th><th>登录身份</th><th>申请状态</th><th>操作</th></tr></thead><tbody><tr v-for="row in rows" :key="row.request_id"><td>{{row.patient_number}}</td><td>{{row.date_of_birth}}</td><td>{{row.clinic_id}}</td><td>{{row.subject_id}}</td><td>{{row.status==='PENDING'?'待人工核验':'历史已办理'}}</td><td><button :disabled="busy || unknown" @click="select(row)">查看与处理</button></td></tr></tbody></table><button v-if="next" :disabled="busy || unknown" @click="load(true)">加载更多</button>
    <ElDialog :model-value="!!selected" title="人工核验与处理" width="680px" :style="{maxWidth:'calc(100vw - 32px)'}" :close-on-click-modal="false" :close-on-press-escape="!busy && !unknown" :show-close="!busy && !unknown" @update:model-value="!$event && closeReview()">
    <form v-if="selected" class="management-form" @submit.prevent="lookup"><p>申请人 {{selected.subject_id}} · 患者编号 {{selected.patient_number}} · 出生日期 {{selected.date_of_birth}}</p>
    <p v-if="error" role="alert" class="error-message">{{error}}</p><p v-if="notice" role="status">{{notice}}</p>
    <div v-if="unknown" class="dialog-actions"><button type="button" :disabled="busy" @click="query">查询办理进度</button><button type="button" :disabled="busy" @click="execute">重新确认办理结果</button></div>
    <fieldset :disabled="busy || unknown"><legend>实际服务依据</legend><label>服务依据<input v-model="service" required maxlength="255"></label><label><input v-model="checkedNumber" type="checkbox">已核对原始患者编号</label><label><input v-model="checkedBirth" type="checkbox">已核对出生日期</label><label><input v-model="confirmed" type="checkbox">已人工核实到场本人</label><button type="button" @click="lookup" v-if="can('getPatient')" :disabled="!confirmed || !checkedNumber || !checkedBirth">核验并定位患者档案</button><p v-if="patientId">已核验档案 ID：{{patientId}}</p><label v-if="!can('getPatient')">已在授权流程核验的档案 ID<input v-model="patientId" pattern="[1-9][0-9]*"></label><label>操作原因<input v-model="reason" required maxlength="255"></label>
    <template v-if="selected.status==='PENDING'"><button v-if="can('approvePatientBinding')" type="button" :disabled="!patientId || !reason || !service || !confirmed || !checkedNumber || !checkedBirth" @click="submit('approve')">批准本人绑定</button><label>换号前的有效登录身份<input v-model="oldSubject" maxlength="36"></label><button v-if="can('rebindPatient')" type="button" :disabled="!oldSubject || !patientId || !reason || !service || !confirmed || !checkedNumber || !checkedBirth" @click="submit('rebind')">核验后换号重绑</button></template>
    <button v-else-if="can('revokePatientBinding')" type="button" :disabled="!patientId || !reason || !service || !confirmed || !checkedNumber || !checkedBirth" @click="submit('revoke')">核验后解绑此身份</button></fieldset></form>
    </ElDialog>
  </section>
</template>


