<script setup lang="ts">
import {ref,onMounted,onBeforeUnmount} from 'vue'
import {recoveryRecords,finishRequest,type RecoveryRecord} from '../api/outcome-recovery'
import {createProtectedClient} from '../api/protected'
import type {PreparedCommand} from '../api/http'
const records=ref<RecoveryRecord[]>([]),busy=ref(false),notice=ref(''),references=ref<string[]>([]),confirmedKey=ref('')
const api=createProtectedClient()
function refresh(){records.value=recoveryRecords()}
async function confirm(record:RecoveryRecord){busy.value=true;notice.value='';references.value=[];confirmedKey.value='';try{const result=await api.requestResult<{status:string;resource_references:string[]}>({...record,body:''} as PreparedCommand);if(result.status==='SUCCEEDED'){notice.value='上次办理已成功。核对下列原记录后，可继续办理。';references.value=result.resource_references;confirmedKey.value=record.key}else notice.value='结果仍在确认中。请回到原办理页面，重新填写相同内容后确认；系统会使用原请求，不会另建新请求。'}catch{notice.value='暂时无法读取原结果，请核对当前登录账号与授权后重试。'}finally{busy.value=false}}
function destination(reference:string){const [kind,id]=reference.split(':');const paths:Record<string,string>={Appointment:'/appointment-booking',Invoice:'/invoicing',QuarterlyPerformance:'/quarterly-performance',CostEntry:'/cost-entries',Patient:'/patients',AppliedTreatment:'/clinical-treatment'};return {path:paths[kind??'']??'/',query:kind==='Invoice'?{invoiceId:id}:undefined}}
function acknowledge(){finishRequest(confirmedKey.value);confirmedKey.value='';notice.value='';references.value=[]}
onMounted(()=>{refresh();window.addEventListener('adc-recovery-changed',refresh)})
onBeforeUnmount(()=>window.removeEventListener('adc-recovery-changed',refresh))
</script>
<template><aside v-if="records.length" class="confirmation-summary result-recovery" role="status" aria-label="上次办理结果"><strong>上次办理结果待确认</strong><p>请先确认原结果，再开始新的办理。临床表单内容仅保留在当前页面内存中。</p><button v-for="record in records" :key="record.key" :disabled="busy" @click="confirm(record)">重新确认上次办理结果</button><p v-if="notice">{{notice}}</p><ul v-if="references.length"><li v-for="reference in references" :key="reference"><RouterLink :to="destination(reference)">查看原记录 · {{reference}}</RouterLink></li></ul><button v-if="confirmedKey" :disabled="busy" @click="acknowledge">已核对原结果，继续办理</button><details><summary>关联标识</summary><p v-for="record in records" :key="record.key" class="record-reference">{{record.operation}} · {{record.key}}</p></details></aside></template>
