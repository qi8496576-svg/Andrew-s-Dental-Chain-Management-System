<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthenticationStore } from '../../stores/authentication'
const auth = useAuthenticationStore()
const username = ref('')
const password = ref('')
const route = useRoute()
const router = useRouter()
// Owner-approved public application login; infrastructure credentials stay private.
const demoUsername = (import.meta.env.VITE_PUBLIC_LOGIN_USERNAME ?? 'admin-demo').trim()
const demoPassword = import.meta.env.VITE_PUBLIC_LOGIN_PASSWORD ?? 'adl123456'
const demoVisible = Boolean(demoUsername && demoPassword)
const demoFeedback = ref('')
function fillDemo() {
  username.value = demoUsername
  password.value = demoPassword
  demoFeedback.value = '已填入账号和密码'
}
async function copyDemo(value: string, label: string) {
  try { await navigator.clipboard.writeText(value); demoFeedback.value = `已复制${label}` }
  catch { demoFeedback.value = '请选中文字复制' }
}
async function submit() {
  try {
    if (await auth.login(username.value, password.value)) {
      const target = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
      await router.replace(target.startsWith('/') && !target.startsWith('//') ? target : '/')
    }
  } finally { password.value = '' }
}
</script>
<template>
  <div class="authentication-layout">
    <div class="authentication-intro"><p class="eyebrow">ANDREW’S DENTAL CHAIN</p><h1>让每一次诊疗<br>都有清晰的衔接。</h1><p>安德鲁牙科连锁 · 统一管理入口</p><div class="intro-tags"><span>预约与排班</span><span>患者与诊疗</span><span>连锁管理</span></div></div>
    <section class="authentication-card" aria-labelledby="login-title">
      <p class="eyebrow">工作人员登录</p><h2 id="login-title">欢迎回来</h2><p class="muted">使用经核实的个人账号登录，按已授岗位和诊所范围办理业务。</p>
      <form @submit.prevent="submit">
        <label for="username">个人账号</label><input id="username" v-model="username" name="username" autocomplete="username" maxlength="100" required :disabled="auth.busy">
        <label for="password">密码</label><input id="password" v-model="password" name="password" type="password" autocomplete="current-password" required :disabled="auth.busy">
        <p v-if="auth.error" role="alert" class="error-message">{{ auth.error }}</p>
        <button class="primary-action" type="submit" :disabled="auth.busy">{{ auth.busy ? '正在验证…' : '登录管理后台' }}</button>
      </form>
      <aside v-if="demoVisible" class="demo-access" aria-label="登录账号">
        <dl><div><dt>账号</dt><dd><code>{{ demoUsername }}</code><button type="button" @click="copyDemo(demoUsername, '账号')">复制账号</button></dd></div>
          <div><dt>密码</dt><dd><code>{{ demoPassword }}</code><button type="button" @click="copyDemo(demoPassword, '密码')">复制密码</button></dd></div></dl>
        <button class="demo-fill" type="button" :disabled="auth.busy" @click="fillDemo">填入账号和密码</button>
        <p class="demo-feedback" role="status">{{ demoFeedback }}</p>
      </aside>
      <p v-else class="login-help">使用已授权的工作人员账号登录。忘记密码时请联系账号管理员重置。</p>
    </section>
  </div>
</template>

<style scoped>
.demo-access{margin-top:24px;padding:18px;border:1px solid #d5e3ec;border-radius:12px;background:#f5f9fc}
.demo-access dl{margin:0 0 16px}.demo-access dl>div+div{margin-top:12px}.demo-access dt{font-size:12px;color:#718391;margin-bottom:4px}
.demo-access dd{display:flex;align-items:center;gap:8px;justify-content:space-between;margin:0}.demo-access code{font-size:12px;color:#294b63;overflow-wrap:anywhere;user-select:all}
.demo-access dd button{flex-shrink:0;border:0;background:transparent;color:#246b8a;padding:4px;font-size:12px;cursor:pointer}
.demo-fill{width:100%;border:1px solid #b8cedc;border-radius:7px;background:white;color:#28566f;padding:9px 12px;cursor:pointer}.demo-fill:disabled{opacity:.6;cursor:wait}
.demo-feedback{font-size:12px;min-height:17px;color:#3e7187;margin:8px 0 0}
</style>


