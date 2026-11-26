<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useShellStore } from './stores/shell'
import { useAuthenticationStore } from './stores/authentication'
import { useRoute, useRouter } from 'vue-router'
import { navigationFor } from './navigation'
import { managementEntries } from './management-navigation'
import ResultRecovery from './components/ResultRecovery.vue'
import ManagementMenu from './components/ManagementMenu.vue'
import {useViewScope} from './stores/view-scope'
import {createProtectedClient} from './api/protected'
import NavigationIcon from './components/NavigationIcon.vue'
const shell = useShellStore(), auth = useAuthenticationStore(), route = useRoute(), router = useRouter()
const scope=useViewScope(),navTrigger=ref<HTMLButtonElement>(),sidebar=ref<HTMLElement>(),scopeClinics=ref<{id:string;label:string}[]>([])
let dayTimer:ReturnType<typeof setInterval>
async function closeNavigation(){shell.navigationOpen=false;await nextTick();navTrigger.value?.focus()}
function navKey(event:KeyboardEvent){if(window.innerWidth>=1280||!shell.navigationOpen)return;if(event.key==='Escape')closeNavigation();if(event.key==='Tab'){const items=[...sidebar.value!.querySelectorAll<HTMLElement>('a,button')].filter(e=>e.offsetParent!==null);if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1)?.focus()}else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0]?.focus()}}}
watch(()=>shell.navigationOpen,async value=>{if(value&&window.innerWidth<1280){await nextTick();sidebar.value?.querySelector<HTMLElement>('a')?.focus()}})
watch(()=>route.path,()=>{if(window.innerWidth<1280)shell.navigationOpen=false})
watch(()=>auth.identity,async value=>{scopeClinics.value=[];if(!value){scope.clinic='';return}if(!value.clinic_scope.includes(scope.clinic))scope.clinic='';try{let cursor:string|null=null;do{const page:{items:{id:string;label:string}[];next_cursor:string|null}=await createProtectedClient().get('/api/v1/clinics?limit=100'+(cursor?'&cursor='+encodeURIComponent(cursor):''));scopeClinics.value.push(...page.items.filter(i=>value.clinic_scope.includes(i.id)));cursor=page.next_cursor}while(cursor)}catch{scopeClinics.value=value.clinic_scope.map(id=>({id,label:'诊所 '+id}))}}, {immediate:true})
onMounted(()=>{dayTimer=setInterval(scope.refreshDay,30000);window.addEventListener('focus',scope.refreshDay);document.addEventListener('keydown',navKey)})
onBeforeUnmount(()=>{clearInterval(dayTimer);window.removeEventListener('focus',scope.refreshDay);document.removeEventListener('keydown',navKey)})
const groups = computed(() => navigationFor(auth.canAccess))
const management = computed(() => managementEntries(auth.canAccess).length>0)
const roles: Record<string,string> = {HEADQUARTERS:'总部管理',RECEPTION:'诊所前台',DENTIST:'牙医',CASHIER:'收费人员'}
const roleLabel = computed(() => auth.identity?.roles.map(role=>roles[role] || role).join(' / ') || '待授权')
function active(to:string) { return route.path===to || (to==='/appointment-booking' && ['/appointment-attendance','/appointment-cancellation','/appointment-no-show','/appointment-rescheduling'].includes(route.path)) }
async function logout() { if (await auth.logout()) await router.replace('/authentication') }
</script>
<template>
 <ElConfigProvider :locale="zhCn">
 <a class="skip-link" href="#main">跳转到主要内容</a>
 <div :class="['app-shell',{'public-layout':route.meta.public,'navigation-collapsed':!shell.navigationOpen}]">
 <button v-if="shell.navigationOpen && !route.meta.public" class="navigation-backdrop" aria-label="关闭导航" @click="closeNavigation"></button><aside ref="sidebar" v-if="!route.meta.public" v-show="shell.navigationOpen" class="app-sidebar" id="navigation">
 <RouterLink class="brand" to="/"><span class="brand-symbol">A<span>+</span></span><span>Andrew’s Dental<small>安德鲁牙科连锁</small></span></RouterLink>
 <nav class="sidebar-navigation" aria-label="主导航">
 <RouterLink to="/" class="nav-item" :class="{'is-active':route.path==='/'}"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 11l9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/></svg>首页</RouterLink>
 <div v-for="group in groups" :key="group.label" class="nav-group"><p class="nav-group-label">{{group.label}}</p><RouterLink v-for="item in group.items" :key="item.to" :to="item.to" class="nav-item" :class="{'is-active':active(item.to)}"><NavigationIcon :to="item.to"/>{{item.label}}</RouterLink></div>
 </nav>
 <div class="sidebar-footer"><ManagementMenu v-if="management" /><div v-else class="sidebar-user"><strong>{{roleLabel}}</strong><small>按已授权范围访问</small></div></div>
 </aside>
 <div class="app-workspace">
<header v-if="!route.meta.public" class="app-topbar"><button ref="navTrigger" class="icon-button" aria-label="切换导航" aria-controls="navigation" :aria-expanded="shell.navigationOpen" @click="shell.toggleNavigation"><span aria-hidden="true">☰</span></button><nav class="breadcrumb" aria-label="当前位置"><RouterLink to="/">管理后台</RouterLink><template v-if="route.meta.area==='settings'"><span aria-hidden="true">/</span><RouterLink to="/management">系统管理</RouterLink></template><span aria-hidden="true">/</span><strong aria-current="page">{{route.meta.title}}</strong></nav><label class="shared-scope">查看范围<select v-model="scope.clinic" aria-label="当前查看范围"><option value="">全部授权诊所</option><option v-for="item in scopeClinics" :key="item.id" :value="item.id">{{item.label}}</option></select></label><div class="topbar-account"><span class="scope-label">授权诊所 {{auth.identity?.clinic_scope.length || 0}} 家</span><span class="topbar-role">{{roleLabel}}</span><button :disabled="auth.busy" @click="logout">退出登录</button></div></header>
 <p v-if="auth.error && !route.meta.public" role="alert" class="error-message shell-alert">{{auth.error}}</p>
 <main id="main" tabindex="-1"><ResultRecovery v-if="!route.meta.public"/><RouterView /></main>
 </div></div>
 </ElConfigProvider>
</template>



