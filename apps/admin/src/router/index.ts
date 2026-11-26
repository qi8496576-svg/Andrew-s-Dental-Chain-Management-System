import { createRouter, createWebHistory, type RouterHistory } from 'vue-router'
import { useAuthenticationStore } from '../stores/authentication'
import { resourcePages } from '../management-navigation'

export function createAppRouter(history: RouterHistory = createWebHistory(import.meta.env.BASE_URL), session?: { ensure: () => Promise<boolean>; canAccess?: (role: string, capability: string) => boolean }) {
  const router = createRouter({
    history,
    routes: [
      { path: '/settings', redirect: '/management' },
      { path: '/management', name: 'management', component: () => import('../views/ManagementView.vue'), meta: { title: '系统管理与基础配置', area:'settings', requiresAuth: true, role:'HEADQUARTERS', capabilities:['resource.read','resource.write','account.manage','authorization.manage'] } },
      ...Object.entries(resourcePages).map(([kind,page])=>({path:`/settings/${kind}`,name:`settings-${kind}`,component:()=>import('../views/organization-resources/index.vue'),meta:{title:page.title,area:'settings',resourceKind:kind,requiresAuth:true,role:'HEADQUARTERS',capabilities:['resource.read','resource.write']}})),
      { path: '/', name: 'home', component: () => import('../views/HomeView.vue'), meta: { title: '首页', requiresAuth: true } },
      { path: '/authentication', name: 'authentication', component: () => import('../views/authentication/index.vue'), meta: { title: '工作人员登录', public: true } },
      { path: '/staff-accounts', name: 'staff-accounts', component: () => import('../views/staff-accounts/index.vue'), meta: { title: '员工账号', area:'settings', requiresAuth: true, role: 'HEADQUARTERS', capability: 'account.manage' } },
      { path: '/clinic-grants', name: 'clinic-grants', component: () => import('../views/clinic-grants/index.vue'), meta: { title: '角色、岗位与诊所授权', area:'settings', requiresAuth: true, role: 'HEADQUARTERS', capability: 'authorization.manage' } },
      { path: '/patients', name: 'patients', component: () => import('../views/patients/index.vue'), meta: { title: '患者资料', requiresAuth: true, role: 'RECEPTION', capabilities: ['getPatient','createPatient'] } },
      { path:'/patient-bindings',name:'patient-bindings',component:()=>import('../views/patient-bindings/index.vue'),meta:{title:'患者身份绑定',requiresAuth:true,role:'RECEPTION',capability:'listBindingRequests'} },
      { path:'/schedules',name:'schedules',component:()=>import('../views/schedules/index.vue'),meta:{title:'出诊排班',requiresAuth:true,role:'RECEPTION',capability:'listSchedules'} },
      { path:'/appointment-booking',name:'appointment-booking',component:()=>import('../views/appointment-booking/index.vue'),meta:{title:'预约管理',requiresAuth:true,role:'RECEPTION',capability:'listAppointments'} },
      { path:'/appointment-attendance',name:'appointment-attendance',component:()=>import('../views/appointment-attendance/index.vue'),meta:{title:'确认到诊',requiresAuth:true,role:'RECEPTION',capability:'attendAppointment'} },
      { path:'/appointment-cancellation',name:'appointment-cancellation',component:()=>import('../views/appointment-cancellation/index.vue'),meta:{title:'患者取消',requiresAuth:true,role:'RECEPTION',capability:'cancelAppointment'} },
      { path:'/appointment-no-show',name:'appointment-no-show',component:()=>import('../views/appointment-no-show/index.vue'),meta:{title:'核实爽约',requiresAuth:true,role:'RECEPTION',capability:'markNoShow'} },
      { path:'/appointment-rescheduling',name:'appointment-rescheduling',component:()=>import('../views/appointment-rescheduling/index.vue'),meta:{title:'停诊改约',requiresAuth:true,role:'RECEPTION',capability:'rescheduleAppointment'} },
      {path:'/patient-bills',name:'patient-bills',component:()=>import('../views/patient-bills/index.vue'),meta:{title:'费用与缴费',requiresAuth:true,accessAny:[{role:'CASHIER',capability:'billing.read'},{role:'HEADQUARTERS',capability:'billing.read'}]}},
      { path:'/clinical-treatment',name:'clinical-treatment',component:()=>import('../views/clinical-treatment/index.vue'),meta:{title:'医生工作台',requiresAuth:true,role:'DENTIST',capability:'getClinicalContext'} },
      { path:'/treatment-price-correction',name:'treatment-price-correction',component:()=>import('../views/clinical-treatment/price-correction.vue'),meta:{title:'治疗价格纠错',requiresAuth:true,role:'HEADQUARTERS',capability:'correctTreatmentPrice'} },
      { path:'/invoicing',name:'invoicing',component:()=>import('../views/invoicing/index.vue'),meta:{title:'结算就诊',requiresAuth:true,role:'CASHIER',capabilities:['invoiceAppointment','getInvoice']} },
      { path:'/invoice-sources',name:'invoice-sources',component:()=>import('../views/invoicing/index.vue'),meta:{title:'费用凭据查阅',requiresAuth:true,role:'HEADQUARTERS',capability:'getInvoice',readOnly:true} },
      {path:'/cost-entries',name:'cost-entries',component:()=>import('../views/quarterly-performance/costs.vue'),meta:{title:'季度成本核验',requiresAuth:true,role:'HEADQUARTERS',capability:'cost.verify'}},
      {path:'/analytics',name:'analytics',component:()=>import('../views/analytics/index.vue'),meta:{title:'运营分析',requiresAuth:true,role:'HEADQUARTERS',capability:'analysis.read'}},
      {path:'/quarterly-performance',name:'quarterly-performance',component:()=>import('../views/quarterly-performance/index.vue'),meta:{title:'季度个人绩效',requiresAuth:true,role:'HEADQUARTERS',capabilities:['cost.verify','performance.calculate','performance.publish','analysis.read']}},
      { path: '/organization-resources', name:'organization-resources',component:()=>import('../views/organization-resources/index.vue'),meta:{title:'总部资源',requiresAuth:true,role:'HEADQUARTERS',capabilities:['resource.read','resource.write']} },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue'), meta: { title: '页面不存在' } },
    ],
  })
  router.beforeEach(async to => {
    if (!to.meta.requiresAuth && !to.meta.capability) return true
    const current = session ?? useAuthenticationStore()
    if (to.meta.requiresAuth && !await current.ensure()) return { name: 'authentication', query: { redirect: to.fullPath } }
    if (Array.isArray(to.meta.accessAny) && !to.meta.accessAny.some((entry:{role:string;capability:string})=>current.canAccess?.(entry.role,entry.capability)))return {name:'home'}
    if (typeof to.meta.capability === 'string' && !current.canAccess?.(String(to.meta.role), to.meta.capability)) return { name: 'home' }
    if (Array.isArray(to.meta.capabilities) && !to.meta.capabilities.some(capability => current.canAccess?.(String(to.meta.role), String(capability)))) return { name:'home' }
    return true
  })
  router.afterEach((to) => {
    if (typeof document !== 'undefined') document.title = `${String(to.meta.title)} · 安德鲁牙科连锁管理系统`
  })
  return router
}

