<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElDialog } from 'element-plus/es/components/dialog/index'
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-dialog.css'
import { createProtectedClient } from '../../api/protected'
import { ApiFailure, prepareCommand, UnknownOutcomeError } from '../../api/http'
import type { PreparedCommand } from '../../api/http'
import { useAuthenticationStore } from '../../stores/authentication'
type Account = { subject_id: string; username?: string; enabled: boolean }
type Page = { items: Account[]; next_cursor: string | null }
const auth = useAuthenticationStore(), router = useRouter(), api = createProtectedClient()
const items = ref<Account[]>([]), next = ref<string | null>(null), busy = ref(false), error = ref(''), notice = ref('')
const dialog = ref(false), mode = ref<'create' | 'activate' | 'deactivate' | 'recover'>('create'), target = ref<Account | null>(null)
const username = ref(''), staffReference = ref(''), dentist = ref(''), reason = ref(''), verification = ref(''), password = ref(''), verified = ref(false), unknown = ref(false)
const search=ref(''),status=ref('all')
const visible=computed(()=>items.value.filter(a=>(status.value==='all'||a.enabled===(status.value==='active'))&&(''+a.username+' '+a.subject_id).toLowerCase().includes(search.value.toLowerCase())))
let pending: PreparedCommand | undefined
async function failed(failure: unknown) {
  if (failure instanceof ApiFailure && (failure.status === 401 || failure.status === 403)) {
    items.value = []; await auth.ensure(); await router.replace(auth.identity ? '/' : '/authentication')
  }
  error.value = failure instanceof ApiFailure && failure.status === 409 ? '记录或请求内容冲突，请核实后重试。' : '操作未完成，请核实输入或稍后重试。'
}
async function load(more = false) {
  busy.value = true; error.value = ''
  try { const page = await api.get<Page>(`/api/v1/identity/staff-accounts${more && next.value ? `?cursor=${encodeURIComponent(next.value)}` : ''}`); items.value = more ? [...items.value, ...page.items] : page.items; next.value = page.next_cursor }
  catch (failure) { await failed(failure) } finally { busy.value = false }
}
function open(action: typeof mode.value, account: Account | null = null) {
  if (pending) return
  mode.value = action; target.value = account; username.value = ''; staffReference.value = ''; dentist.value = ''; reason.value = ''; verification.value = ''; password.value = ''; verified.value = false; error.value = ''; dialog.value = true
}
async function completed() { pending = undefined; unknown.value = false; password.value = ''; dialog.value = false; notice.value = '操作已确认，账号列表已更新。'; await load() }
async function execute() {
  if (!pending) return
  busy.value = true; error.value = ''
  try { await api.execute<Account>(pending); await completed() } catch (failure) {
    if (failure instanceof UnknownOutcomeError) { unknown.value = true; error.value = '操作结果尚未确认。请重新确认办理结果或重新确认办理结果，避免再次创建。' }
    else { pending = undefined; unknown.value = false; await failed(failure) }
  } finally { busy.value = false }
}
async function submit() {
  if (!verified.value || pending) return
  if (mode.value === 'create') pending = prepareCommand('createStaffAccount', 'POST', '/api/v1/identity/staff-accounts', { staff_reference: staffReference.value, username: username.value, dentist_id: dentist.value || null })
  else {
    const action = mode.value === 'recover' ? 'credential-recovery' : mode.value
    const operation = mode.value === 'recover' ? 'credentialrecoveryStaffAccount' : mode.value === 'activate' ? 'activateStaffAccount' : 'deactivateStaffAccount'
    const body = mode.value === 'recover' ? { verification_reference: verification.value, reason: reason.value, replacement_password: password.value } : { reason: reason.value, verification_reference: verification.value || null }
    pending = prepareCommand(operation, 'POST', `/api/v1/identity/staff-accounts/${encodeURIComponent(target.value!.subject_id)}/${action}`, body)
  }
  await execute()
}
async function lookup() {
  if (!pending) return
  try { const result = await api.requestResult<{ status: 'SUCCEEDED' | 'PENDING' | 'UNKNOWN' }>(pending); if (result.status === 'SUCCEEDED') await completed(); else error.value = result.status === 'PENDING' ? '原请求仍在处理中，请稍后查询。' : '暂未确认原请求结果，可重新确认办理结果。' } catch (failure) { await failed(failure) }
}
function closed() { if (!pending) password.value = '' }
onMounted(() => load())
</script>
<template>
  <section class="management-page">
    <div class="page-heading"><div><p class="eyebrow">系统管理</p><h1>员工账号</h1><p class="muted">核实个人身份后办理账号事务。业务岗位与诊所权限单独授予。</p></div><button class="compact-primary" :disabled="busy || !!pending" @click="open('create')">建立员工账号</button></div>
    <p v-if="notice" role="status" class="success-message">{{ notice }}</p><p v-if="error && !dialog" role="alert" class="error-message">{{ error }}</p>
    <div class="table-toolbar"><div class="filter-fields"><label>筛选已加载账号<input v-model="search" placeholder="账号或主体标识"></label><label>账号状态<select v-model="status"><option value="all">全部</option><option value="active">已启用</option><option value="inactive">已停用</option></select></label></div><span class="muted">匹配 {{visible.length}} / 已加载 {{items.length}} 条</span><button :disabled="busy" @click="load()">刷新</button></div>
    <div class="table-scroll"><table class="data-table"><thead><tr><th>个人账号</th><th>状态</th><th>账号标识</th><th>操作</th></tr></thead><tbody><tr v-for="account in visible" :key="account.subject_id"><td>{{ account.username }}</td><td><span :class="['status-badge', { inactive: !account.enabled }]">{{ account.enabled ? '已启用' : '已停用' }}</span></td><td class="muted">{{ account.subject_id }}</td><td class="row-actions"><button :disabled="busy || !!pending" @click="open(account.enabled ? 'deactivate' : 'activate', account)">{{ account.enabled ? '停用' : '启用' }}</button><button :disabled="busy || !!pending" @click="open('recover', account)">密码管理</button></td></tr><tr v-if="!visible.length && !busy"><td colspan="4">暂无可显示的员工账号。</td></tr></tbody></table></div>
    <button v-if="next" :disabled="busy" @click="load(true)">加载更多</button>
    <p class="muted">新账号未设置密码时不能登录。非牙医员工无需关联牙医资料；启用账号不会自动增加权限。</p>
  </section>
  <ElDialog v-model="dialog" :title="mode === 'create' ? '建立员工账号' : mode === 'recover' ? '核验并设置密码' : mode === 'activate' ? '启用员工账号' : '停用员工账号'" width="540px" :close-on-click-modal="false" :close-on-press-escape="!pending" :show-close="!pending" @closed="closed">
    <form class="management-form" @submit.prevent="submit">
      <template v-if="mode === 'create'"><label>个人账号<input v-model="username" required maxlength="100" :disabled="!!pending"></label><label>工作人员核实依据<input v-model="staffReference" required maxlength="100" :disabled="!!pending"></label><label>关联牙医标识（可选，仅牙医适用）<input v-model="dentist" inputmode="numeric" pattern="[1-9][0-9]*" :disabled="!!pending"></label></template>
      <template v-else><p>操作对象：<strong>{{ target?.username }}</strong></p><p v-if="mode !== 'recover'" class="muted">本次启停会使该账号原有会话失效；账号和业务历史仍保留。</p><label>操作原因<input v-model="reason" required maxlength="255" :disabled="!!pending"></label><label>身份核验记录或工单编号{{ mode === 'recover' ? '' : '（可选）' }}<input v-model="verification" :required="mode === 'recover'" maxlength="200" :disabled="!!pending"></label><label v-if="mode === 'recover'">新密码<input v-model="password" type="password" required autocomplete="new-password" :disabled="!!pending"></label></template>
      <label class="checkbox-label"><input v-model="verified" type="checkbox" required :disabled="!!pending">已核实该员工身份及本次操作依据</label>
      <p v-if="error" role="alert" class="error-message">{{ error }}</p>
      <div v-if="unknown" class="dialog-actions"><button type="button" :disabled="busy" @click="lookup">查询办理进度</button><button type="button" :disabled="busy" @click="execute">重新确认办理结果</button></div>
      <div v-else class="dialog-actions"><button type="button" :disabled="busy" @click="dialog = false">取消</button><button class="compact-primary" type="submit" :disabled="busy || !verified">{{ busy ? '正在提交…' : '确认办理' }}</button></div>
    </form>
  </ElDialog>
</template>


