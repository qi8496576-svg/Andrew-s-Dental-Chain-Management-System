<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElDialog } from 'element-plus/es/components/dialog/index'
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-dialog.css'
import { createProtectedClient } from '../../api/protected'
import { grantCapabilities } from '../../api/grant-capabilities'
import { ApiFailure, prepareCommand, UnknownOutcomeError } from '../../api/http'
import type { PreparedCommand } from '../../api/http'
import { useAuthenticationStore } from '../../stores/authentication'
type Grant = { grant_id: string; subject_id: string; role: string; clinic_ids: string[]; capabilities?: string[]; valid_from: string; valid_until?: string | null; revoked: boolean }
type Page = { items: Grant[]; next_cursor: string | null }
const auth = useAuthenticationStore(), router = useRouter(), api = createProtectedClient()
const roles: Record<string, string> = { RECEPTION: '前台', DENTIST: '牙医', CASHIER: '收费人员', HEADQUARTERS: '总部' }
const labels: Record<string, string> = {
  'billing.read':'查看本人诊所账单','billing.pay':'办理收款与关闭待缴挂号','billing.refund':'办理全额退款','account.manage': '管理员工账号', 'authorization.manage': '分配诊所权限', 'resource.read':'查看组织与治疗资源', 'resource.write': '维护组织与治疗资源', 'analysis.read': '查看运营分析', 'cost.verify': '核验成本', 'performance.calculate': '核算季度绩效', 'performance.publish': '复核发布绩效', 'sensitive.drilldown': '查看敏感来源', 'audit.read': '查询审计', correctTreatmentPrice: '经核实纠正治疗价格',
  searchAppointmentCandidates: '查询可预约时段', listAppointments: '查看预约列表', createAppointment: '创建预约', getAppointment: '查看预约', attendAppointment: '确认到诊', cancelAppointment: '取消预约', markNoShow: '登记爽约', rescheduleAppointment: '停诊改约', listSchedules: '查看出诊排班', createSchedule: '建立出诊排班', suspendSchedule: '挂起出诊排班',
  createPatient: '建立患者档案', getPatient: '查看患者资料', updatePatient: '更正患者资料', reviewPatientAllergies: '核实过敏状态', addPatientAllergy: '记录过敏', listPatientAllergies: '查看过敏记录', correctPatientAllergy: '更正过敏记录', retractPatientAllergy: '撤回过敏误记', listBindingRequests: '查看绑定申请', approvePatientBinding: '人工核验绑定', rebindPatient: '核验换号重绑', revokePatientBinding: '核验解绑',
  completeAppointment: '完成本次诊疗', updateClinicalNotes: '记录临床问题', recordAppliedTreatment: '记录实际治疗', getClinicalContext: '查看本次临床上下文', getAppliedTreatment: '查看实际治疗', invoiceAppointment: '生成费用凭据', getInvoice: '查看费用凭据',
}
const items = ref<Grant[]>([]), next = ref<string | null>(null), permitted = ref<string[]>([]), accounts = ref<{ subject_id: string; username?: string }[]>([])
const busy = ref(false), error = ref(''), notice = ref(''), filter = ref(''), dialog = ref(false), revokeTarget = ref<Grant | null>(null), unknown = ref(false)
const subject = ref(''), role = ref('RECEPTION'), clinics = ref<string[]>([]), capabilities = ref<string[]>([]), from = ref(''), until = ref(''), reason = ref(''), confirmed = ref(false)
const clinicLabels=ref<{id:string;label:string}[]>([])
function clinicLabel(id:string){return clinicLabels.value.find(c=>c.id===id)?.label??'诊所 '+id}
const roleHelp:Record<string,string>={RECEPTION:'核验患者、安排预约和到诊；按需选择取消、爽约与停诊处理。',DENTIST:'查看本人就诊风险，记录实际治疗并完成诊疗。',CASHIER:'核对已完成就诊的费用，生成和查阅费用凭据。',HEADQUARTERS:'按职责选择资源维护、分析、成本核验、计算或独立发布。'}
const statusFilter=ref('all')
function grantStatus(grant:Grant){if(grant.revoked)return '已撤销';if(Date.parse(grant.valid_from)>Date.now())return '未生效';if(grant.valid_until&&Date.parse(grant.valid_until)<=Date.now())return '已结束';return '有效'}
const visible=computed(()=>items.value.filter(grant=>statusFilter.value==='all'||grantStatus(grant)===statusFilter.value))
let pending: PreparedCommand | undefined
watch(role, () => { capabilities.value = [] })
function shanghaiNow() { return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, -1) }
function display(value?: string | null) { return value ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value)) : '无预定结束' }
async function failed(failure: unknown) {
  if (failure instanceof ApiFailure && (failure.status === 401 || failure.status === 403)) {
    await auth.ensure()
    if (!auth.canAccess('HEADQUARTERS', 'authorization.manage')) { items.value = []; await router.replace(auth.identity ? '/' : '/authentication') }
  }
  error.value = failure instanceof ApiFailure && failure.status === 403 ? '角色、诊所或有效期超出当前可授范围，请核实。' : '操作未完成，请核实输入或稍后重试。'
}
async function load(more = false) {
  busy.value = true
  try { const query = new URLSearchParams(); if (filter.value) query.set('subject_id', filter.value); if (more && next.value) query.set('cursor', next.value); const page = await api.get<Page>(`/api/v1/identity/grants?${query}`); items.value = more ? [...items.value, ...page.items] : page.items; next.value = page.next_cursor }
  catch (failure) { await failed(failure) } finally { busy.value = false }
}
async function initialize() {
  try {
    const ids = new Set<string>(); let cursor: string | null = null
    do { const query = new URLSearchParams({ subject_id: auth.identity!.subject_id, limit: '100' }); if (cursor) query.set('cursor', cursor); const page = await api.get<Page>(`/api/v1/identity/grants?${query}`); page.items.filter(grant=>grant.role==='HEADQUARTERS'&&grantStatus(grant)==='有效').forEach(grant=>grant.clinic_ids.forEach(id=>ids.add(id))); cursor = page.next_cursor } while (cursor)
    permitted.value = [...ids].sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }))
    if(auth.canAccess('HEADQUARTERS','account.manage')){accounts.value=[];let after:string|null=null;do{const page:{items:{subject_id:string;username?:string}[];next_cursor:string|null}=await api.get('/api/v1/identity/staff-accounts?limit=100'+(after?'&cursor='+encodeURIComponent(after):''));accounts.value.push(...page.items);after=page.next_cursor}while(after)}
    try{let cursor:string|null=null;do{const page:{items:{id:string;label:string}[];next_cursor:string|null}=await api.get('/api/v1/clinics?limit=100'+(cursor?'&cursor='+encodeURIComponent(cursor):''));clinicLabels.value.push(...page.items);cursor=page.next_cursor}while(cursor)}catch{}
    await load()
  } catch (failure) { await failed(failure) }
}
function open(grant: Grant | null = null) {
  if (pending) return
  revokeTarget.value = grant; subject.value = ''; clinics.value = []; capabilities.value = []; from.value = shanghaiNow(); until.value = ''; reason.value = ''; confirmed.value = false; error.value = ''; dialog.value = true
}
async function completed() { pending = undefined; unknown.value = false; dialog.value = false; notice.value = '授权变更已确认，后续请求按当前权限核验。'; await auth.ensure(); if (auth.canAccess('HEADQUARTERS', 'authorization.manage')) await initialize(); else await router.replace('/') }
async function execute() {
  if (!pending) return; busy.value = true
  try { await api.execute<Grant>(pending); await completed() } catch (failure) {
    if (failure instanceof UnknownOutcomeError) { unknown.value = true; error.value = '结果确认中，请保留当前页面并重新确认办理结果。' }
    else { pending = undefined; unknown.value = false; await failed(failure) }
  } finally { busy.value = false }
}
async function submit() {
  if (!confirmed.value || pending) return
  if (revokeTarget.value) pending = prepareCommand('revokeClinicGrant', 'POST', `/api/v1/identity/grants/${encodeURIComponent(revokeTarget.value.grant_id)}/revoke`, { reason: reason.value })
  else pending = prepareCommand('createClinicGrant', 'POST', '/api/v1/identity/grants', { subject_id: subject.value, role: role.value, clinic_ids: clinics.value, capabilities: capabilities.value, valid_from: `${from.value}+08:00`, valid_until: until.value ? `${until.value}+08:00` : null })
  await execute()
}
async function lookup() { if (!pending) return; try { const result = await api.requestResult<{ status: string }>(pending); if (result.status === 'SUCCEEDED') await completed(); else error.value = '原请求结果尚未确认，可稍后查询或重新确认办理结果。' } catch (failure) { await failed(failure) } }
onMounted(initialize)
</script>
<template>
  <section><div class="page-heading"><div><p class="eyebrow">系统管理</p><h1>角色、岗位与诊所授权</h1><p class="muted">岗位、能力、诊所与有效期共同决定访问范围。时间按上海时区显示。</p></div><button class="compact-primary" :disabled="busy || !!pending" @click="open()">建立授权</button></div>
    <p class="muted">岗位为前台、牙医、收费和总部四类；按员工配置实际能力及诊所范围，服务端逐次核验。授权调整采用撤销后新建，保留原记录。</p><p class="muted">当前可管理诊所：{{ permitted.map(clinicLabel).join('、') || '正在核验' }}</p>
    <p v-if="notice" role="status" class="success-message">{{ notice }}</p><p v-if="error && !dialog" role="alert" class="error-message">{{ error }}</p>
    <form class="table-toolbar" @submit.prevent="load()"><label>员工主体标识筛选 <input v-model="filter"></label><label>授权状态<select v-model="statusFilter"><option value="all">全部状态</option><option>有效</option><option>未生效</option><option>已结束</option><option>已撤销</option></select></label><button :disabled="busy">筛选 / 刷新</button></form>
    <div class="table-scroll"><table class="data-table"><thead><tr><th>员工主体</th><th>岗位</th><th>诊所范围</th><th>操作能力</th><th>有效期（上海）</th><th>撤销记录</th><th>操作</th></tr></thead><tbody><tr v-for="grant in visible" :key="grant.grant_id"><td><strong>{{accounts.find(a=>a.subject_id===grant.subject_id)?.username || '员工主体'}}</strong><small class="record-reference">{{grant.subject_id}}</small></td><td>{{ roles[grant.role] }}</td><td>{{ grant.clinic_ids.map(clinicLabel).join('、') }}</td><td><details><summary>{{grant.capabilities?grant.capabilities.length+' 项能力':'能力明细未取得'}}</summary>{{grant.capabilities?.map(c=>labels[c]??c).join('、')}}</details></td><td>{{ display(grant.valid_from) }}<br>{{ display(grant.valid_until) }}</td><td>{{grantStatus(grant)}}</td><td><button v-if="!grant.revoked" :disabled="busy || !!pending" @click="open(grant)">撤销</button></td></tr></tbody></table></div><button v-if="next" :disabled="busy" @click="load(true)">加载更多</button>
  </section>
  <ElDialog v-model="dialog" :title="revokeTarget ? '撤销授权' : '建立诊所授权'" width="650px" :close-on-click-modal="false" :close-on-press-escape="!pending" :show-close="!pending">
    <form class="management-form" @submit.prevent="submit"><template v-if="!revokeTarget">
      <label v-if="accounts.length">员工<select v-model="subject" required :disabled="!!pending"><option value="" disabled>选择员工</option><option v-for="account in accounts" :key="account.subject_id" :value="account.subject_id">{{account.username}} · {{account.subject_id}}</option></select></label><label v-else>员工主体标识<input v-model="subject" required :disabled="!!pending"><small>当前无员工目录权限，请由账号管理人员提供主体标识。</small></label><datalist id="grant-employees"><option v-for="account in accounts" :key="account.subject_id" :value="account.subject_id" :label="account.username" /></datalist>
      <label for="grant-role">岗位</label><select id="grant-role" v-model="role" :disabled="!!pending"><option v-for="(label, code) in roles" :key="code" :value="code">{{ label }}</option></select>
      <fieldset :disabled="!!pending"><legend>明确诊所范围</legend><label v-for="id in permitted" :key="id" class="checkbox-label"><input v-model="clinics" type="checkbox" :value="id">{{clinicLabel(id)}}</label></fieldset>
      <p class="workspace-note">{{roleHelp[role]}}</p><fieldset :disabled="!!pending"><legend>独立操作能力</legend><div class="capability-grid"><label v-for="capability in grantCapabilities[role]" :key="capability" class="checkbox-label"><input v-model="capabilities" type="checkbox" :value="capability">{{ labels[capability] || capability }}</label></div></fieldset>
      <label>生效时点（上海）<input v-model="from" type="datetime-local" step="0.001" required :disabled="!!pending"></label><label>结束时点（可空，上海）<input v-model="until" type="datetime-local" step="0.001" :disabled="!!pending"></label><p class="muted">所选有效期必须在你当前可授予的有效期内；新诊所不会自动扩大旧授权。</p>
    </template><template v-else><p>撤销后，下一次业务请求立即按新权限核验，保留原授权历史。</p><label>撤销原因<input v-model="reason" required maxlength="255" :disabled="!!pending"></label></template>
    <div v-if="!revokeTarget" class="confirmation-summary"><h3>授权摘要</h3><p>员工：{{accounts.find(a=>a.subject_id===subject)?.username||subject||'尚未选择'}} · 岗位：{{roles[role]}}</p><p>诊所：{{clinics.map(clinicLabel).join('、')||'尚未选择'}}</p><p>能力：{{capabilities.map(c=>labels[c]).join('、')||'尚未选择'}}</p><p>{{from}} 至 {{until||'未设结束'}}（北京时间）</p></div><label class="checkbox-label"><input v-model="confirmed" type="checkbox" required :disabled="!!pending">已核对本次岗位、诊所及权限变更依据</label><p v-if="error" role="alert" class="error-message">{{ error }}</p>
    <div v-if="unknown" class="dialog-actions"><button type="button" :disabled="busy" @click="lookup">查询办理进度</button><button type="button" :disabled="busy" @click="execute">重新确认办理结果</button></div><div v-else class="dialog-actions"><button type="button" :disabled="busy" @click="dialog = false">取消</button><button class="compact-primary" type="submit" :disabled="busy || !confirmed || (!revokeTarget && !clinics.length)">确认授权变更</button></div>
    </form>
  </ElDialog>
</template>

