<script setup lang="ts">
import { computed,onMounted,ref,watch } from 'vue'
import { useRouter,useRoute,onBeforeRouteUpdate,onBeforeRouteLeave } from 'vue-router'
import { resourceKind,resourcePath,resourcePages } from '../../management-navigation'
import { ElDialog } from 'element-plus/es/components/dialog/index'
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-dialog.css'
import type {components} from '@adc/contracts'
import {createProtectedClient} from '../../api/protected'
import {ApiFailure,prepareCommand,UnknownOutcomeError} from '../../api/http'
import type {PreparedCommand} from '../../api/http'
import {useAuthenticationStore} from '../../stores/authentication'
import DoctorFeePolicy from './DoctorFeePolicy.vue'
import {resourceDefinitions} from './resource-fields'
import type {ResourceName} from './resource-fields'
import {resourceInput,requirementOptions} from './resource-form'
type Catalog=components['schemas']['CatalogItem']&{current_price?:string;address?:string;required_qualifications?:string;clinic_labels?:string;qualification_status?:string}
type Assignment=components['schemas']['DentistAssignmentView']
type Qualification=components['schemas']['DentistQualificationView']
type Requirement=components['schemas']['TreatmentQualificationView']
type Impact=components['schemas']['ResourceFutureImpact']
type Resource=Record<string,unknown>
type Page={items:Catalog[];next_cursor:string|null}
const auth=useAuthenticationStore(),router=useRouter(),route=useRoute(),api=createProtectedClient()
const kind=ref<ResourceName>(resourceKind(route.meta.resourceKind??route.query.kind)),items=ref<Catalog[]>([]),next=ref<string|null>(null),search=ref(''),stateFilter=ref('all'),selected=ref<Resource|null>(null),etag=ref(''),busy=ref(false),error=ref(''),notice=ref(''),impacts=ref<Impact[]>([])
const dialog=ref(false),mode=ref<'create'|'update'|'qualification'|'assignment'|'requirements'>('create'),form=ref<Resource>({}),unknown=ref(false),verified=ref(false)
const clinics=ref<Catalog[]>([]),qualifications=ref<Catalog[]>([]),relations=ref<ReturnType<typeof requirementOptions>>([])
const certificate=ref({qualification_id:'',certificate_number:'',granted_date:'',expiry_date:'',verification_status:'UNVERIFIED',verification_reference:''})
const assignment=ref({assignment_id:'',clinic_id:'',start_date:'',end_date:'',availability_note:'',is_active:true})
const definition=computed(()=>resourceDefinitions[kind.value]),canRead=computed(()=>auth.canAccess('HEADQUARTERS','resource.read')),canWrite=computed(()=>auth.canAccess('HEADQUARTERS','resource.write'))
const loadedSearch=ref('')
const dedicated=computed(()=>!!route.meta.resourceKind)
function returnToList(){if(busy.value||pending)return;selected.value=null;etag.value='';impacts.value=[]}
const visible=computed(()=>items.value.filter(row=>(stateFilter.value==='all'||row.active===(stateFilter.value==='active'))&&`${row.label} ${row.code??''}`.toLocaleLowerCase().includes(search.value.toLocaleLowerCase())))
const title=computed(()=>mode.value==='qualification'?'登记或更新牙医资质':mode.value==='assignment'?'维护牙医执业记录':mode.value==='requirements'?'维护治疗资质要求':`${mode.value==='create'?'新建':'维护'}${definition.value.title}`)
let pending:PreparedCommand|undefined
function currentId(){return String(selected.value?.[definition.value.id]??'')}
function rows<T>(name:string):T[]{const data=selected.value?.[name];return Array.isArray(data)?data as T[]:[]}
function label(catalog:Catalog[],id:string){return catalog.find(item=>item.id===id)?.label??id}
function impactReason(reason:string){return ({ASSIGNMENT_CHANGED:'有效执业范围不再覆盖此安排',QUALIFICATION_CHANGED:'当前必需资质不满足安排要求',TREATMENT_REQUIREMENTS_CHANGED:'治疗所需资质已变化，需核实安排',RESOURCE_AVAILABILITY_CHANGED:'相关基础资料当前不满足安排要求'} as Record<string,string>)[reason]??'需核实相关资源变更的影响'}
function clearPrivate(){selected.value=null;items.value=[];form.value={};etag.value='';impacts.value=[];clinics.value=[];qualifications.value=[]}
async function failed(failure:unknown){
  if(failure instanceof ApiFailure && (failure.status===401 || failure.status===403)){clearPrivate();await auth.ensure();if(!auth.identity || (!auth.canAccess('HEADQUARTERS','resource.read') && !auth.canAccess('HEADQUARTERS','resource.write')))await router.replace(auth.identity?'/':'/authentication')}
  error.value=failure instanceof ApiFailure ? failure.status===412?'资源已被其他人员更新，请重新读取后核实。':failure.status===409?'编码或记录冲突，请核实原记录；不要重复创建。':failure.status===403?'此对象不在当前可操作范围，请刷新列表或联系授权管理人员。':failure.status===422 || failure.status===400?'字段、日期或关联不满足要求，请核实后提交。':'操作暂未完成，请稍后重试。':'连接暂不可用，请稍后重试。'
}
async function load(more=false){
  more=more&&loadedSearch.value===search.value;if(!more){items.value=[];next.value=null}const requestedSearch=search.value
  busy.value=true;error.value=''
  try{const query=new URLSearchParams({limit:'50'});if(search.value&&kind.value!=='allergies')query.set('q',search.value);if(more&&next.value)query.set('cursor',next.value);const page=await api.get<Page>(`/api/v1/${kind.value}?${query}`);items.value=more?[...items.value,...page.items]:page.items;next.value=page.next_cursor;loadedSearch.value=requestedSearch}catch(failure){await failed(failure)}finally{busy.value=false}
}
async function choose(name:ResourceName){if(pending || busy.value)return;if(dedicated.value && resourceKind(route.meta.resourceKind)!==name){await router.push(resourcePath(name));return}kind.value=name;search.value='';stateFilter.value='all';clearPrivate();notice.value='';await load()}
async function detail(id:string){
  if(!canRead.value || pending)return;busy.value=true;error.value=''
  try{const result=await api.getResource<Resource>(`/api/v1/${kind.value}/${encodeURIComponent(id)}`);selected.value=result.data;etag.value=result.etag??'';impacts.value=[];if(kind.value==='dentists' || kind.value==='treatments')qualifications.value=await catalog('qualifications');if(kind.value==='dentists')clinics.value=await catalog('clinics')}catch(failure){await failed(failure)}finally{busy.value=false}
}
async function catalog(name:'clinics'|'qualifications'){
  const all:Catalog[]=[];let cursor:string|null=null
  do{const page:Page=await api.get(`/api/v1/${name}?limit=100${cursor?`&cursor=${encodeURIComponent(cursor)}`:''}`);all.push(...page.items);cursor=page.next_cursor}while(cursor)
  return all
}
async function open(action:typeof mode.value,entry?:Assignment|Qualification){
  if(pending)return;error.value='';mode.value=action;verified.value=false
  if(action==='create' || action==='update'){
    const data:Resource={};for(const field of definition.value.fields)data[field.name]=action==='update'?selected.value?.[field.name]??(field.kind==='boolean'?false:''):(field.kind==='boolean'?true:'');form.value=data
  }else{
    busy.value=true
    try{
      if(action==='assignment'){clinics.value=await catalog('clinics');const row=entry as Assignment|undefined;assignment.value={assignment_id:row?.assignment_id??'',clinic_id:row?.clinic_id??'',start_date:row?.start_date??'',end_date:row?.end_date??'',availability_note:row?.availability_note??'',is_active:row?.is_active??true}}
      else{qualifications.value=await catalog('qualifications');if(action==='requirements')relations.value=requirementOptions(qualifications.value,rows<Requirement>('qualification_requirements'));else{const row=entry as Qualification|undefined;certificate.value={qualification_id:row?.qualification_id??'',certificate_number:row?.certificate_number??'',granted_date:row?.granted_date??'',expiry_date:row?.expiry_date??'',verification_status:row?.verification_status??'UNVERIFIED',verification_reference:''}}}
    }catch(failure){await failed(failure);return}finally{busy.value=false}
  }
  dialog.value=true
}
async function execute(){
  if(!pending)return;busy.value=true;error.value='';const submitted=pending
  try{
    const result=await api.execute<Resource>(submitted);pending=undefined;unknown.value=false;dialog.value=false;notice.value='资源变更已保存，历史引用仍保留。'
    const id=String(result.data[definition.value.id]??'');selected.value=result.data;etag.value=result.etag??'';impacts.value=Array.isArray(result.data.future_impact)?result.data.future_impact as Impact[]:[]
    await load()
    if(submitted.operation.startsWith('create')){
      if(kind.value==='clinics' && !auth.identity?.clinic_scope.includes(id)){selected.value=null;notice.value=`诊所已建立（标识 ${id}）。本次建档不会自动扩展管理范围，请联系授权管理人员配置初始管理范围。`}
      else if(canRead.value)await detail(id)
      else selected.value=null
    }
  }catch(failure){if(failure instanceof UnknownOutcomeError){unknown.value=true;error.value='结果尚未确认，请保留原请求查询或重新确认办理结果。'}else{pending=undefined;unknown.value=false;await failed(failure)}}finally{busy.value=false}
}
async function save(){
  if(pending)return;let body:unknown,path:string,operation:string,method:PreparedCommand['method']='POST',version:string|undefined
  if(mode.value==='create' || mode.value==='update'){body=resourceInput(kind.value,form.value);path=`/api/v1/${kind.value}${mode.value==='update'?`/${currentId()}`:''}`;operation=`${mode.value==='create'?'create':'update'}${kind.value==='clinics'?'Clinic':kind.value==='dentists'?'Dentist':kind.value==='qualifications'?'Qualification':kind.value==='treatments'?'Treatment':'Allergy'}`;if(mode.value==='update'){method='PATCH';version=etag.value}}
  else if(mode.value==='qualification'){if(!verified.value)return;body={...certificate.value,expiry_date:certificate.value.expiry_date||null};path=`/api/v1/dentists/${currentId()}/qualifications`;operation='maintainDentistQualification'}
  else if(mode.value==='assignment'){body={clinic_id:assignment.value.clinic_id,start_date:assignment.value.start_date,end_date:assignment.value.end_date||null,availability_note:assignment.value.availability_note||null,is_active:assignment.value.is_active,...(assignment.value.assignment_id?{assignment_id:assignment.value.assignment_id}:{})};path=`/api/v1/dentists/${currentId()}/clinic-assignments`;operation='maintainDentistAssignment'}
  else{body={requirements:relations.value.filter(row=>row.selected).map(row=>({qualification_id:row.id,is_mandatory:row.mandatory}))};path=`/api/v1/treatments/${currentId()}/qualification-requirements`;operation='setTreatmentRequirements';method='PUT'}
  pending=prepareCommand(operation,method,path,body,version);await execute()
}
async function query(){if(!pending)return;try{const result=await api.requestResult<{status:string}>(pending);if(result.status==='SUCCEEDED')await execute();else error.value=result.status==='PENDING'?'原请求正在处理中。':'尚未确认原请求结果，可重新确认办理结果。'}catch(failure){await failed(failure)}}
onBeforeRouteUpdate(()=>{if(pending || busy.value)return false})
onBeforeRouteLeave(()=>!pending&&!busy.value)
watch(()=>route.meta.resourceKind??route.query.kind,value=>{const nextKind=resourceKind(value);if(nextKind!==kind.value)void choose(nextKind)})
onMounted(()=>load())
</script>
<template>
  <section class="management-page">
    <div class="page-heading"><div><p class="eyebrow">总部管理</p><h1>{{ dedicated ? resourcePages[kind].title : '组织与服务资源' }}</h1><p class="muted">{{resourcePages[kind].description}}</p></div><button v-if="canWrite" class="compact-primary" :disabled="busy || !!pending" @click="open('create')">新建{{ definition.title }}</button></div>
    <div v-if="!dedicated" class="resource-tabs" role="group" aria-label="资源分类"><button v-for="(value,name) in resourceDefinitions" :key="name" :class="{active:kind===name}" :aria-pressed="kind===name" :disabled="busy || !!pending" @click="choose(name)">{{ value.title }}</button></div>
    <p v-if="notice" role="status" class="success-message">{{ notice }}</p><p v-if="error && !dialog" role="alert" class="error-message">{{ error }}</p>
    <p class="loaded-summary">当前已加载 {{items.length}} 条，匹配 {{visible.length}} 条{{next?' · 仍有更多记录可加载':''}}</p><div :class="['resource-columns',{'dedicated-resources':dedicated,'showing-detail':dedicated && !!selected}]"><aside class="resource-list"><div class="table-toolbar"><label>{{kind==='allergies'?'筛选已加载过敏目录':'服务端检索名称或代码'}}<input v-model="search" @keyup.enter="load()" :disabled="!!pending" placeholder="名称或代码"></label><label>状态<select aria-label="状态" v-model="stateFilter" :disabled="!!pending"><option value="all">全部状态</option><option value="active">可用</option><option value="inactive">停用</option></select></label><button :disabled="busy || !!pending" @click="load()">搜索 / 刷新</button></div><ul v-if="!dedicated"><li v-for="item in visible" :key="item.id"><button :disabled="busy || !!pending || !canRead" :class="{chosen:currentId()===item.id}" @click="detail(item.id)"><strong>{{ item.label }}</strong><span>{{ item.code || item.id }}</span><span :class="['status-badge',{inactive:!item.active}]">{{ item.active?'可用':'停用' }}</span></button></li></ul><div v-else class="table-scroll"><table><thead><tr><th>名称</th><th>代码 / 标识</th><th v-if="kind==='treatments'">现价 / 必需资质</th><th v-if="kind==='dentists'">执业诊所 / 资质状态</th><th v-if="kind==='clinics'">地址</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="item in visible" :key="item.id" :class="{'selected-row':currentId()===item.id}"><td><strong>{{item.label}}</strong></td><td class="record-reference">{{item.code || item.id}}</td><td v-if="kind==='treatments'">{{item.current_price??'未取得'}}<small>{{item.required_qualifications}}</small></td><td v-if="kind==='dentists'">{{item.clinic_labels}}<small>{{item.qualification_status}}</small></td><td v-if="kind==='clinics'">{{item.address??'未取得'}}</td><td><span :class="['status-badge',{inactive:!item.active}]">{{item.active?'可用':'停用'}}</span></td><td><button :disabled="busy || !!pending || !canRead" @click="detail(item.id)">查看详情</button></td></tr></tbody></table></div><p v-if="!visible.length" class="muted">当前已加载条目中暂无匹配记录。</p><button v-if="next" :disabled="busy || !!pending" @click="load(true)">加载更多{{ definition.title }}</button></aside>
    <div class="resource-detail" v-show="!dedicated || !!selected"><template v-if="selected"><button v-if="dedicated" class="resource-back" :disabled="busy || !!pending" @click="returnToList">← 返回列表</button><div class="page-heading"><h2>{{ selected[kind==='clinics'?'clinic_code':definition.fields.find(field=>field.name.endsWith('_name'))?.name || 'clinic_code'] || definition.title }}</h2><button v-if="canWrite" :disabled="busy || !!pending" @click="open('update')">维护基本资料</button></div><dl><template v-for="field in definition.fields" :key="field.name"><dt>{{ field.label }}</dt><dd>{{ field.kind==='boolean'?(selected[field.name]?'启用':'停用'):selected[field.name]??'未提供' }}</dd></template></dl>
      <template v-if="kind==='dentists'"><DoctorFeePolicy :dentist-id="currentId()" :clinics="clinics.filter(c=>rows<Assignment>('clinic_assignments').some(a=>a.clinic_id===c.id && a.is_active))" :can-write="canWrite"/><div class="page-heading"><h3>专业资质</h3><button v-if="canWrite" :disabled="busy || !!pending" @click="open('qualification')">登记专业资质</button></div><div class="table-scroll"><table class="data-table"><thead><tr><th>资质标识 / 名称</th><th>证书编号</th><th>授予 / 到期</th><th>核验状态</th><th>操作</th></tr></thead><tbody><tr v-for="item in rows<Qualification>('qualifications')" :key="item.qualification_id"><td>{{ label(qualifications,item.qualification_id) }}</td><td>{{ item.certificate_number }}</td><td>{{ item.granted_date }} / {{ item.expiry_date || '已核实长期有效时方可使用' }}</td><td>{{ item.verification_status==='VERIFIED'?'已核实':item.verification_status }}</td><td><button v-if="canWrite" :disabled="busy || !!pending" @click="open('qualification',item)">更新资质</button></td></tr><tr v-if="!rows('qualifications').length"><td colspan="5">暂无资质关联。</td></tr></tbody></table></div><div class="page-heading"><h3>诊所执业记录</h3><button v-if="canWrite" :disabled="busy || !!pending" @click="open('assignment')">新增执业记录</button></div><div class="table-scroll"><table class="data-table"><thead><tr><th>诊所</th><th>开始 / 结束（含当日）</th><th>可用说明</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="item in rows<Assignment>('clinic_assignments')" :key="item.assignment_id"><td>{{ label(clinics,item.clinic_id) }}</td><td>{{ item.start_date }} / {{ item.end_date || '未设结束' }}</td><td>{{ item.availability_note || '未补充' }}</td><td>{{ item.is_active?'启用':'停用' }}</td><td><button v-if="canWrite" :disabled="busy || !!pending" @click="open('assignment',item)">调整执业记录</button></td></tr><tr v-if="!rows('clinic_assignments').length"><td colspan="5">当前范围内暂无执业记录。</td></tr></tbody></table></div></template>
      <template v-if="kind==='treatments'"><RouterLink v-if="auth.canAccess('HEADQUARTERS','correctTreatmentPrice')" class="button-link" to="/treatment-price-correction">更多操作 · 核实历史治疗价格</RouterLink><div class="page-heading"><h3>治疗所需资质</h3><button v-if="canWrite" :disabled="busy || !!pending" @click="open('requirements')">维护治疗要求</button></div><ul class="requirement-list"><li v-for="item in rows<Requirement>('qualification_requirements')" :key="item.qualification_id">{{ label(qualifications,item.qualification_id) }} · {{ item.is_mandatory?'必需':'可选展示' }}</li><li v-if="!rows('qualification_requirements').length">暂无资质要求关联。</li></ul><p class="muted">全部必需资质都满足才可匹配；修改默认价格仅影响后续新建的实际治疗，历史价格保留。</p></template>
    </template><p v-else class="empty-detail muted">选择当前范围内的资源查看详情，或建立新资源。这里维护业务资料，不会自动授予员工岗位或诊所权限。</p>
    <section v-if="impacts.length" class="impact-panel" aria-label="未来安排影响"><h3>当前授权范围内的未来影响</h3><p>相关安排需由有权人员核实并按原业务流程处理；本次没有自动取消预约或修改班次。</p><ul><li v-for="item in impacts" :key="item.object_kind+item.object_id">{{ item.object_kind==='Appointment'?'预约':'排班' }} {{ item.object_id }} · 诊所 {{ item.clinic_id }} · {{ item.affected_date }} · {{ impactReason(item.reason) }}</li></ul></section>
    </div></div>
  </section>
  <ElDialog v-model="dialog" :title="title" width="760px" :close-on-click-modal="false" :close-on-press-escape="!pending" :show-close="!pending"><form class="management-form" @submit.prevent="save"><fieldset :disabled="busy || !!pending"><div v-if="mode==='create' || mode==='update'" class="resource-fields"><template v-for="field in definition.fields" :key="field.name"><label v-if="field.kind==='boolean'" class="checkbox-label"><input v-model="form[field.name]" type="checkbox">{{ field.label }}</label><label v-else :for="'resource-'+field.name">{{ field.label }}{{ field.required?'':'（可选）' }}<input :id="'resource-'+field.name" v-model="form[field.name]" :type="field.kind==='date'?'date':'text'" :inputmode="field.kind==='decimal'?'decimal':undefined" :required="field.required" :maxlength="field.maximum" :pattern="field.pattern"></label></template></div>
    <template v-else-if="mode==='qualification'"><label for="qualification-directory">专业资质</label><select id="qualification-directory" v-model="certificate.qualification_id" required><option value="" disabled>选择共享目录</option><option v-for="item in qualifications" :key="item.id" :value="item.id">{{ item.label }}{{ item.active?'':'（目录已停用）' }}</option></select><label>证书编号<input v-model="certificate.certificate_number" required maxlength="60"></label><div class="resource-fields"><label>证书授予日期<input v-model="certificate.granted_date" type="date" required></label><label>证书到期日期（核实长期有效可留空）<input v-model="certificate.expiry_date" type="date"></label></div><label for="qualification-status">证书核验状态</label><select id="qualification-status" v-model="certificate.verification_status"><option value="UNVERIFIED">尚未核实，不可满足资质匹配</option><option value="VERIFIED">已完成核实</option><option v-if="!['VERIFIED','UNVERIFIED'].includes(certificate.verification_status)" :value="certificate.verification_status">{{ certificate.verification_status }}</option></select><label>专业资质核验依据<input v-model="certificate.verification_reference" required maxlength="200"></label><label class="checkbox-label"><input v-model="verified" type="checkbox" required>已核对证书及有效期；留空到期日时已核实长期有效</label></template>
    <template v-else-if="mode==='assignment'"><p v-if="assignment.assignment_id" class="muted">正在调整原执业记录 {{ assignment.assignment_id }}，不会按日期组合覆盖其他记录。</p><label for="assignment-clinic">执业诊所</label><select id="assignment-clinic" v-model="assignment.clinic_id" required><option value="" disabled>选择实际执业诊所</option><option v-for="item in clinics" :key="item.id" :value="item.id">{{ item.label }}{{ item.active?'':'（已停用）' }}</option></select><div class="resource-fields"><label>执业开始日期<input v-model="assignment.start_date" type="date" required></label><label>执业结束日期（含当日，可选）<input v-model="assignment.end_date" type="date"></label></div><label>出诊可用说明<input v-model="assignment.availability_note" maxlength="255"></label><label class="checkbox-label"><input v-model="assignment.is_active" type="checkbox">启用此执业记录</label></template>
    <template v-else><p class="muted">未加载目录页的原关联也会保留。仅取消勾选才移除当前要求，历史核验和诊疗证据保留。</p><div v-for="item in relations" :key="item.id" class="requirement-option"><label class="checkbox-label"><input v-model="item.selected" type="checkbox">{{ item.label }}{{ item.active===false?'（目录停用）':'' }}</label><label class="checkbox-label"><input v-model="item.mandatory" type="checkbox" :disabled="!item.selected">作为必需资质</label></div><p v-if="!relations.length">暂无专业资质目录，请先维护目录。</p></template>
    </fieldset><p v-if="error" role="alert" class="error-message">{{ error }}</p><div v-if="unknown" class="dialog-actions"><button type="button" :disabled="busy" @click="query">查询办理进度</button><button type="button" :disabled="busy" @click="execute">重新确认办理结果</button></div><div v-else class="dialog-actions"><button type="button" :disabled="busy" @click="dialog=false">取消</button><button type="submit" class="compact-primary" :disabled="busy || (mode==='qualification' && !verified)">确认保存资源</button></div></form></ElDialog>
</template>
<style scoped>
.resource-tabs{display:flex;gap:8px;border-bottom:1px solid #d8e3ea;padding:0 0 14px;flex-wrap:wrap}.resource-tabs button{padding:10px 18px;border:1px solid #d8e3ea;border-radius:7px;background:white;color:#35566c}.resource-tabs button.active{color:white;background:#14758b;border-color:#14758b}.resource-columns{display:grid;grid-template-columns:minmax(230px,29%) minmax(0,1fr);gap:24px;margin-top:24px}.resource-list{border-right:1px solid #d8e3ea;padding-right:20px}.resource-list ul{list-style:none;padding:0}.resource-list li button{display:grid;gap:9px;text-align:left;width:100%;padding:15px;margin-bottom:8px;background:white;border:1px solid #dbe5ed;border-radius:8px;color:#25485f}.resource-list li button.chosen{border-color:#14758b;background:#eff8fa}.resource-list li button span{font-size:13px;overflow-wrap:anywhere}.resource-detail{min-width:0}.resource-detail dl{display:grid;grid-template-columns:140px 1fr;gap:12px;padding:16px;background:#f5f9fb}.resource-detail dt{color:#4d687a}.resource-detail dd{margin:0;overflow-wrap:anywhere}.resource-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.resource-fields label{display:grid;gap:8px}.resource-fields label.checkbox-label{display:flex}fieldset{border:0;padding:0;margin:0}.resource-detail .data-table{font-size:13px}.impact-panel{padding:16px;background:#fff5dd;border-left:4px solid #c7971c;margin-top:24px}.impact-panel h3{margin-top:0}.impact-panel p,.impact-panel li{font-size:14px}.empty-detail{padding:40px 16px}.requirement-option{display:flex;gap:20px;justify-content:space-between;padding:12px 0;border-bottom:1px solid #e1e9ef}.resource-list .table-toolbar{align-items:end;gap:8px}.resource-list .table-toolbar label{display:grid;gap:7px}.resource-list input{min-width:0;width:100%;box-sizing:border-box}@media(max-width:950px){.resource-columns{grid-template-columns:1fr}.resource-list{border-right:0;border-bottom:1px solid #d8e3ea;padding-right:0;padding-bottom:20px}.resource-fields{grid-template-columns:1fr}}
</style>



