<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthenticationStore } from '../../stores/authentication'
const auth = useAuthenticationStore()
const username = ref('')
const password = ref('')
const route = useRoute()
const router = useRouter()
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
      <p class="login-help">教师演示与日常办公使用同一入口，请使用已授权的个人账号。忘记密码时请联系账号管理员核验重置。</p>
    </section>
  </div>
</template>


