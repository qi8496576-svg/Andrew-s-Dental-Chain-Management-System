<script setup lang="ts">
import {ref,watch} from 'vue'
import type {components} from '@adc/contracts'
import {createProtectedClient} from '../../api/protected'
import {prepareCommand,UnknownOutcomeError,type PreparedCommand} from '../../api/http'
import {useUnsaved} from '../../composables/useUnsaved'
const props=defineProps<{dentistId:string;clinics:{id:string;label:string}[];canWrite:boolean}>(),api=createProtectedClient()
const clinic=ref(''),amount=ref('0.00'),enabled=ref(false),busy=ref(false),error=ref(''),notice=ref(''),unknown=ref(false)
let pending:PreparedCommand|undefined
useUnsaved(()=>false,()=>!!pending)
async function load(){if(!clinic.value||pending)return;busy.value=true;error.value='';try{const fee=await api.get<components['schemas']['RegistrationFee']>(`/api/v1/registration-fees/${clinic.value}/${props.dentistId}`);amount.value=(fee.amount_fen/100).toFixed(2);enabled.value=fee.demo_enabled}catch(e){error.value=e instanceof Error?e.message:'读取挂号费失败'}finally{busy.value=false}}
watch(()=>props.dentistId,()=>{clinic.value='';notice.value='';amount.value='0.00'})
watch(clinic,()=>load())
async function save(){if(!clinic.value||busy.value)return;if(!pending){if(!/^\d{1,7}(\.\d{1,2})?$/.test(amount.value)){error.value='请输入合法金额，最多两位小数。';return}const fen=Math.round(Number(amount.value)*100);pending=prepareCommand('setRegistrationFee','PUT',`/api/v1/registration-fees/${clinic.value}/${props.dentistId}`,{amount_fen:fen})}busy.value=true;error.value='';try{await api.execute(pending);pending=undefined;unknown.value=false;notice.value='挂号费已保存，仅影响之后新建账单。'}catch(e){if(e instanceof UnknownOutcomeError){unknown.value=true;error.value='保存结果尚未确认，请保留原请求重试。'}else{pending=undefined;error.value=e instanceof Error?e.message:'保存失败'}}finally{busy.value=false}}
</script>
<template><section class="doctor-fee"><h3>挂号费配置</h3><p class="muted">未配置时为0元。演示支付不扣真实款；不使用治疗目录价作为挂号费。</p><div class="fee-form"><label>执业门店<select v-model="clinic" :disabled="busy||!!pending"><option value="">选择当前执业门店</option><option v-for="item in clinics" :key="item.id" :value="item.id">{{item.label}}</option></select></label><label>挂号费（元）<input v-model="amount" type="number" min="0" max="1000000" step="0.01" :disabled="busy||!!pending||!canWrite||!clinic"></label><button v-if="canWrite" :disabled="busy||!clinic" @click="save">{{unknown?'重新确认原保存结果':'保存挂号费'}}</button></div><p v-if="clinic" class="muted">{{enabled?'此门店已启用演示支付，不扣真实款。':'此门店尚未启用演示支付，只可设为0元。'}}</p><p v-if="error" role="alert" class="error-message">{{error}}</p><p v-if="notice" role="status" class="success-message">{{notice}}</p></section></template>
<style scoped>.doctor-fee{padding:20px;border:1px solid #d9e7ed;border-radius:10px;margin:24px 0;background:#f8fbfc}.fee-form{display:flex;gap:16px;align-items:end;flex-wrap:wrap}.fee-form label{display:grid;gap:9px}.fee-form input{max-width:160px}</style>
