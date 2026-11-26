<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthenticationStore } from '../stores/authentication'
import { managementEntries } from '../management-navigation'
const auth=useAuthenticationStore(),route=useRoute(),open=ref(false),root=ref<HTMLElement|null>(null),trigger=ref<HTMLButtonElement|null>(null)
const items=computed(()=>managementEntries(auth.canAccess))
function escape(event:KeyboardEvent){if(event.key==='Escape'&&open.value){open.value=false;trigger.value?.focus()}}
function outside(event:PointerEvent){if(root.value&&!root.value.contains(event.target as Node))open.value=false}
watch(()=>route.fullPath,()=>{open.value=false})
onMounted(()=>{document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape)})
onBeforeUnmount(()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)})
</script>
<template>
 <div v-if="items.length" ref="root" class="management-account">
  <div v-if="open" id="management-popover" class="management-popover" role="dialog" aria-label="系统管理与基础配置"><div class="settings-popover-heading"><div><strong>系统管理与基础配置</strong><small>维护资源、人员与访问权限</small></div><button class="settings-close" aria-label="收起系统管理" @click="open=false;trigger?.focus()">×</button></div><nav aria-label="系统配置导航"><template v-for="(item,index) in items" :key="item.to"><p v-if="index===0 || items[index-1]?.group!==item.group" class="settings-group">{{item.group}}</p><RouterLink :to="item.to" :class="{'settings-active':route.path===item.to}" @click="open=false"><span>{{item.label}}</span><span aria-hidden="true">›</span></RouterLink></template></nav><RouterLink class="settings-overview" to="/management" @click="open=false">配置总览 <span aria-hidden="true">↗</span></RouterLink></div>
  <div class="account-avatar" aria-hidden="true">A</div><div class="sidebar-user"><strong>{{auth.identity?.roles.includes('HEADQUARTERS')?'机构管理人员':'已授权员工'}}</strong><small>系统设置与基础资料</small></div>
  <button ref="trigger" class="settings-gear-button" aria-label="打开管理中心" aria-controls="management-popover" aria-haspopup="dialog" :aria-expanded="open" :class="{'gear-active':open || route.meta.area==='settings'}" @click="open=!open">
    <svg class="management-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="m9 3 1-2h4l1 2 2 1 2-1 3 3-1 2 1 2 2 1v4l-2 1-1 2 1 2-3 3-2-1-2 1-1 2h-4l-1-2-2-1-2 1-3-3 1-2-1-2-2-1v-4l2-1 1-2-1-2 3-3 2 1Z" transform="translate(2 2) scale(.82)"/><circle cx="12" cy="12" r="3.5"/></svg>
  </button>
 </div>
</template>
