<script setup lang="ts">
import {computed,onMounted,ref} from 'vue'
import type {components} from '@adc/contracts'
import {createProtectedClient} from '../../api/protected'
import {prepareCommand,ApiFailure,UnknownOutcomeError,type PreparedCommand} from '../../api/http'
import {useAuthenticationStore} from '../../stores/authentication'
import {useUnsaved} from '../../composables/useUnsaved'
type Bill=components['schemas']['PatientBill']
const api=createProtectedClient(),auth=useAuthenticationStore(),items=ref<Bill[]>([]),next=ref<string|null>(null),busy=ref(false),error=ref(''),notice=ref(''),filter=ref('ALL'),reason=ref(''),selected=ref<Bill|null>(null),unknown=ref(false)
const statuses:Record<string,string>={PENDING:'待缴费',PAID:'已缴费',CLOSED:'已关闭',REFUNDED:'已退款'}
const can=(cap:string)=>['HEADQUARTERS','CASHIER'].some(role=>auth.canAccess(role,cap))
const visible=computed(()=>items.value.filter(b=>filter.value==='ALL'||b.status===filter.value))
let pending:PreparedCommand|undefined
useUnsaved(()=>!!selected.value&&!!reason.value,()=>!!pending)
function money(fen:number){return (fen/100).toFixed(2)}
function date(at:string|null){return at?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',dateStyle:'short',timeStyle:'short'}).format(new Date(at)):'—'}
async function load(more=false){if(busy.value)return;busy.value=true;error.value='';try{const page=await api.get<components['schemas']['PatientBillPage']>(`/api/v1/patient-bills?limit=100${more&&next.value?'&cursor='+encodeURIComponent(next.value):''}`);items.value=more?[...items.value,...page.items]:page.items;next.value=page.next_cursor}catch(e){if(e instanceof ApiFailure&&[401,403].includes(e.status))items.value=[];error.value=e instanceof Error?e.message:'读取失败'}finally{busy.value=false}}
async function execute(){if(!pending||busy.value)return;busy.value=true;error.value='';try{const result=await api.execute<Bill>(pending);pending=undefined;unknown.value=false;selected.value=null;reason.value='';notice.value=result.data.status==='PAID'?'缴费完成，未扣真实款。':result.data.status==='REFUNDED'?'退款已完成，原费用凭据保留。':'待缴挂号已关闭。'}catch(e){if(e instanceof UnknownOutcomeError){unknown.value=true;error.value='结果尚未确认，请保留原请求并查询或重试。'}else{pending=undefined;unknown.value=false;error.value=e instanceof Error?e.message:'办理失败'}}finally{busy.value=false;await load()}}
async function action(bill:Bill,action:'pay'|'close'|'refund'){
 if(pending||busy.value)return
 if(action==='refund'){selected.value=bill;reason.value='';return}
 if(!window.confirm(action==='pay'?`本次不扣真实款。确认收款 ¥${money(bill.amount_fen)}？`:'确认关闭此未付挂号并释放号源？'))return
 pending=prepareCommand(action==='pay'?'payDemoBill':'closePatientBill','POST',`/api/v1/patient-bills/${bill.bill_id}/${action==='pay'?'demo-payments':'close'}`,{});await execute()
}
async function refund(){if(!selected.value||!reason.value.trim()||pending)return;pending=prepareCommand('refundPatientBill','POST',`/api/v1/patient-bills/${selected.value.bill_id}/refunds`,{reason:reason.value.trim()});await execute()}
async function query(){if(!pending)return;try{const result=await api.requestResult<{status:string}>(pending);notice.value=result.status==='SUCCEEDED'?'原请求已处理，请重新确认原结果。':'尚未确认，请保留原请求。'}catch{error.value='暂未取得原回执。'}}
onMounted(()=>load())
</script>
<template>
 <section class="management-page"><div class="page-heading"><div><p class="eyebrow">诊疗与费用</p><h1>费用与缴费</h1><p class="muted">统一查看挂号费、诊疗账单与退款记录。</p></div><button :disabled="busy||!!pending" @click="load()">刷新费用</button></div>
 <div class="demo-banner"><strong>当前缴费不扣真实款</strong><p>支付与退款记录两端同步，费用凭据及绩效核算口径保持不变。</p></div>
 <p v-if="error" role="alert" class="error-message">{{error}}</p><p v-if="notice" role="status" class="success-message">{{notice}}</p>
 <div class="table-toolbar"><label>账单状态<select v-model="filter"><option value="ALL">全部状态</option><option v-for="(label,key) in statuses" :key="key" :value="key">{{label}}</option></select></label><span class="muted">已加载 {{items.length}} 条，当前 {{visible.length}} 条{{next?' · 还有更多记录':''}}</span></div>
 <div class="table-scroll"><table class="data-table"><thead><tr><th>费用类型 / 账单</th><th>门店 / 医生</th><th>就诊关联</th><th>金额</th><th>状态</th><th>缴费 / 退款</th><th>操作</th></tr></thead><tbody><tr v-for="bill in visible" :key="bill.bill_id"><td><strong>{{bill.kind==='REGISTRATION'?'挂号费':'诊疗费用'}}</strong><small>{{bill.bill_id}}</small></td><td>{{bill.clinic_name}}<small>{{bill.dentist_name||'详见费用凭据'}}</small></td><td><RouterLink v-if="bill.appointment_id" to="/appointment-booking">预约 {{bill.appointment_id}}</RouterLink><span v-else>待缴后确认预约</span><small v-if="bill.invoice_id">费用凭据 {{bill.invoice_id}}</small><small v-if="bill.expires_at&&bill.status==='PENDING'">号源保留至 {{date(bill.expires_at)}}</small></td><td class="money">¥ {{money(bill.amount_fen)}}</td><td><span class="status-badge">{{statuses[bill.status]}}</span></td><td>{{bill.payment?'演示缴费 '+date(bill.payment.paid_at):'尚未缴费'}}<small v-if="bill.payment?.refund_id">退款 {{bill.payment.refund_id}} · {{bill.payment.refund_reason}}</small></td><td class="bill-actions"><template v-if="bill.status==='PENDING'&&can('billing.pay')"><button :disabled="busy||!!pending||!bill.demo_enabled" @click="action(bill,'pay')">确认收款</button><button v-if="bill.kind==='REGISTRATION'" :disabled="busy||!!pending" @click="action(bill,'close')">关闭待缴挂号</button></template><button v-if="bill.status==='PAID'&&can('billing.refund')&&(bill.kind==='TREATMENT'||bill.can_refund)" :disabled="busy||!!pending" @click="action(bill,'refund')">办理退款</button><span v-if="bill.kind==='REGISTRATION'&&bill.status==='PAID'&&!bill.can_refund" class="muted">需先按规则取消预约</span></td></tr></tbody></table><p v-if="!visible.length&&!busy" class="muted empty">暂无相关费用记录。</p></div>
 <button v-if="next" :disabled="busy||!!pending" @click="load(true)">加载更多费用</button><div v-if="selected" class="refund-panel"><h2>全额退款</h2><p>账单 {{selected.bill_id}} · ¥ {{money(selected.amount_fen)}}。原费用凭据和审计记录保留。</p><label>退款原因<input v-model="reason" maxlength="255" :disabled="busy||!!pending" placeholder="说明真实业务原因"></label><div class="dialog-actions"><button :disabled="busy||!!pending" @click="selected=null">返回</button><button :disabled="busy||!!pending||!reason.trim()" @click="refund">确认退款</button></div></div>
 <div v-if="unknown" class="demo-banner"><p>保留原请求，避免重复办理。</p><button :disabled="busy" @click="query">查询原请求</button><button :disabled="busy" @click="execute">重新确认办理结果</button></div>
 </section>
</template>
<style scoped>
.demo-banner{border:1px solid #bddbe3;background:#eff8fa;border-radius:10px;padding:18px 22px;margin:20px 0;color:#285365}.demo-banner p{margin:8px 0 0;font-size:14px;line-height:1.7}.data-table td{vertical-align:top}.data-table small{display:block;color:#6c7e8b;font-size:12px;line-height:1.8;margin-top:7px;overflow-wrap:anywhere}.money{white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:600}.bill-actions{min-width:140px}.bill-actions button{display:block;margin-bottom:8px}.refund-panel{padding:24px;border:1px solid #d7e5eb;border-radius:10px;margin-top:24px;background:#fff}.refund-panel label{display:grid;gap:10px}.empty{padding:32px}
</style>
