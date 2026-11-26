<script setup lang="ts">
import { computed } from 'vue'
import { useAuthenticationStore } from '../stores/authentication'
import { managementEntries } from '../management-navigation'
const auth=useAuthenticationStore()
const items=computed(()=>managementEntries(auth.canAccess))
</script>
<template><section class="settings-hub"><div class="page-heading"><div><p class="eyebrow">PRACTICE SETTINGS</p><h1>系统管理与基础配置</h1><p class="muted">配置机构与服务资源、维护员工账号及访问范围。日常就诊操作从左侧业务导航进入。</p></div></div><div v-for="group in ['基础配置','人员与权限']" :key="group" class="settings-section"><h2 v-if="items.some(item=>item.group===group)">{{group}}</h2><div class="management-cards"><RouterLink v-for="item in items.filter(item=>item.group===group)" :key="item.to" :to="item.to" class="management-card"><h3>{{item.label}}</h3><p>{{item.description}}</p><span>进入管理 →</span></RouterLink></div></div><p v-if="!items.length" class="empty-state">当前账号没有可用的管理入口，请联系授权管理人员。</p></section></template>


