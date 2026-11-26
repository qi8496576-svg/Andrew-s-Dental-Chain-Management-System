<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {useUnsaved} from '../../composables/useUnsaved'
import { ElDialog } from 'element-plus/es/components/dialog/index'
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-dialog.css'
import type { components } from '@adc/contracts'
import { createProtectedClient } from '../../api/protected'
import { ApiFailure, prepareCommand, UnknownOutcomeError } from '../../api/http'
import type { PreparedCommand } from '../../api/http'
import { useAuthenticationStore } from '../../stores/authentication'
type Patient=components['schemas']['PatientView']
type Allergy=components['schemas']['AllergyView']
type Catalog=components['schemas']['CatalogItem']
type Page<T>={items:T[];next_cursor:string|null}
const auth=useAuthenticationStore(),router=useRouter(),api=createProtectedClient()
const patient=ref<Patient|null>(null),allergies=ref<Allergy[]>([]),catalog=ref<Catalog[]>([]),catalogNext=ref<string|null>(null),allergyNext=ref<string|null>(null)
const busy=ref(false),error=ref(''),notice=ref(''),clinic=ref(''),service=ref(''),confirmed=ref(false),number=ref(''),birth=ref(''),verification=ref(''),etag=ref(''),unknown=ref(false)
const creating=ref(!auth.canAccess('RECEPTION','getPatient')),editing=ref(false),duplicate=ref(false),reviewReason=ref('')
const details=ref({full_name:'',date_of_birth:'',phone:'',billing_address:'',email:'',emergency_contact_name:'',emergency_contact_phone:''})
const dialog=ref(false),action=ref<'review'|'add'|'correct'|'retract'>('review'),status=ref('NO_KNOWN'),reason=ref(''),selected=ref<Allergy|null>(null),allergyId=ref(''),severity=ref(''),clinical=ref('')
useUnsaved(()=>((creating.value||editing.value)&&Object.entries(details.value).some(([key,value])=>value!==String((patient.value as unknown as Record<string,unknown>|null)?.[key]??'')))||(dialog.value&&!!reason.value),()=>unknown.value)
let pending:PreparedCommand|undefined
watch([clinic,service,confirmed],()=>{verification.value=''})
const can=(capability:string)=>auth.canAccess('RECEPTION',capability)
function resetPrivate(){patient.value=null;allergies.value=[];verification.value='';etag.value='';details.value={full_name:'',date_of_birth:'',phone:'',billing_address:'',email:'',emergency_contact_name:'',emergency_contact_phone:''}}
async function failed(failure:unknown){
  if(failure instanceof ApiFailure && (failure.status===401 || failure.status===403)){resetPrivate();await auth.ensure();await router.replace(auth.identity?'/':'/authentication')}
  error.value=failure instanceof ApiFailure ? ({PATIENT_DUPLICATE_REVIEW_REQUIRED:'存在疑似重复资料。请先人工核实，确认是不同患者后记录复核理由再提交。',PRECONDITION_FAILED:'资料已被其他人员更新，请重新读取并核实后再修改。',OBJECT_NOT_ACCESSIBLE:'无法取得该档案，请核实患者编号、出生日期及本次服务依据。',ALLERGY_REVIEW_CONFLICT:'过敏确认与当前有效记录不一致，请先核对现有过敏项。',IDENTITY_VERIFICATION_REQUIRED:'请完成人工身份核验。'}[failure.code]??'操作未完成，请核实资料及当前权限。'):'连接暂不可用，请稍后重试。'
}
function fillDetails(value:Patient){details.value={full_name:value.full_name,date_of_birth:value.date_of_birth??'',phone:value.phone??'',billing_address:value.billing_address??'',email:value.email??'',emergency_contact_name:value.emergency_contact_name??'',emergency_contact_phone:value.emergency_contact_phone??''}}
async function loadAllergies(more=false){
  if(!patient.value || !can('listPatientAllergies'))return
  try{const page=await api.get<Page<Allergy>>(`/api/v1/patients/${patient.value.patient_id}/allergy-records${more && allergyNext.value?`?cursor=${encodeURIComponent(allergyNext.value)}`:''}`);allergies.value=more?[...allergies.value,...page.items]:page.items;allergyNext.value=page.next_cursor}catch(failure){await failed(failure)}
}
async function loadCatalog(more=false){
  if(!can('addPatientAllergy'))return
  try{const page=await api.get<Page<Catalog>>(`/api/v1/allergies${more && catalogNext.value?`?cursor=${encodeURIComponent(catalogNext.value)}`:''}`);catalog.value=more?[...catalog.value,...page.items]:page.items;catalogNext.value=page.next_cursor}catch(failure){await failed(failure)}
}
async function refresh(){
  if(!patient.value || !can('getPatient'))return
  busy.value=true;error.value=''
  try{const result=await api.getResource<Patient>(`/api/v1/patients/${patient.value.patient_id}`);patient.value=result.data;etag.value=result.etag??'';fillDetails(result.data);editing.value=false;await loadAllergies()}catch(failure){await failed(failure)}finally{busy.value=false}
}
async function execute(){
  if(!pending)return;busy.value=true;error.value=''
  const operation=pending.operation
  try{
    const result=await api.execute<Patient|components['schemas']['PatientLookupResult']>(pending)
    if('patient' in result.data){patient.value=result.data.patient;verification.value=result.data.verification_reference}else{patient.value=result.data;verification.value=operation==='createPatient'?'':verification.value}
    etag.value=result.etag??'';fillDetails(patient.value);pending=undefined;unknown.value=false;creating.value=false;editing.value=false;dialog.value=false;notice.value=operation==='lookupPatient'?'本人资料及本次服务依据已核验。':'资料已保存。';duplicate.value=false;reviewReason.value='';await loadAllergies()
  }catch(failure){if(failure instanceof UnknownOutcomeError){unknown.value=true;error.value='结果确认中，请保留当前页面并重新确认办理结果。';}else{pending=undefined;unknown.value=false;await failed(failure)}}finally{busy.value=false}
}
function basis(){return {clinic_id:clinic.value,person_confirmed:confirmed.value,service_basis:service.value}}
async function lookup(){if(pending || !confirmed.value)return;pending=prepareCommand('lookupPatient','POST','/api/v1/patients/lookup',{patient_number:number.value,date_of_birth:birth.value,verification_basis:basis()});await execute()}
async function save(){
  if(pending || !confirmed.value)return
  if(!creating.value && !verification.value){error.value='请先按患者编号和出生日期核验本次服务，再更正资料。';return}
  const body={...details.value,email:details.value.email||null,billing_address:details.value.billing_address||null,emergency_contact_name:details.value.emergency_contact_name||null,emergency_contact_phone:details.value.emergency_contact_phone||null}
  if(creating.value)pending=prepareCommand('createPatient','POST','/api/v1/patients',{...body,verification_basis:{...basis(),duplicate_reviewed:duplicate.value,...(reviewReason.value?{review_reason:reviewReason.value}:{})}})
  else if(patient.value && etag.value)pending=prepareCommand('updatePatient','PATCH',`/api/v1/patients/${patient.value.patient_id}`,body,etag.value)
  await execute()
}
function startCreate(){if(pending)return;resetPrivate();creating.value=true;editing.value=false;notice.value='';error.value=''}
function open(kind:typeof action.value,item:Allergy|null=null){
  if(pending)return
  if(!verification.value){error.value='请先使用患者编号和出生日期完成本次人工核验，再维护过敏记录。';return}
  action.value=kind;selected.value=item;reason.value='';severity.value=item?.severity_note??'';clinical.value=item?.clinical_note??'';allergyId.value='';status.value='NO_KNOWN';dialog.value=true;error.value=''
}
async function submitAllergy(){
  if(pending || !patient.value)return
  const root=`/api/v1/patients/${patient.value.patient_id}`,common={verification_reference:verification.value,reason:reason.value}
  if(action.value==='review')pending=prepareCommand('reviewPatientAllergies','POST',`${root}/allergy-reviews`,{...common,allergy_review_status:status.value})
  else if(action.value==='add')pending=prepareCommand('addPatientAllergy','POST',`${root}/allergy-records`,{...common,allergy_id:allergyId.value,severity_note:severity.value||null,clinical_note:clinical.value||null})
  else if(selected.value?.etag){const correcting=action.value==='correct';pending=prepareCommand(correcting?'correctPatientAllergy':'retractPatientAllergy','POST',`${root}/allergy-records/${selected.value.allergy_id}/${correcting?'correct':'retract'}`,correcting?{...common,severity_note:severity.value||null,clinical_note:clinical.value||null}:common,selected.value.etag)}
  await execute()
}
async function query(){if(!pending)return;busy.value=true;try{const result=await api.requestResult<{status:string}>(pending);if(result.status==='SUCCEEDED')await execute();else error.value=result.status==='PENDING'?'原请求正在处理中。':'尚无已确认结果，可重新确认办理结果。'}catch(failure){await failed(failure)}finally{busy.value=false}}
onMounted(()=>{const clinics=auth.identity?.clinic_scope??[];if(clinics.length===1)clinic.value=clinics[0]!;loadCatalog()})
</script>
<template>
  <section class="management-page">
    <div class="page-heading"><div><p class="eyebrow">诊所业务</p><h1>患者资料</h1><p class="muted">先核对本人及本次服务，再维护资料与过敏确认。患者档案可跨诊所合法复用。</p></div><button v-if="can('createPatient')" class="compact-primary" :disabled="busy || !!pending" @click="startCreate">新患者建档</button></div>
    <p v-if="notice" class="success-message" role="status">{{ notice }}</p><p v-if="error && !dialog" class="error-message" role="alert">{{ error }}</p>
    <fieldset class="management-form" :disabled="busy || !!pending"><legend>本次服务与本人核验</legend><label for="patient-clinic">本次服务诊所</label><select id="patient-clinic" v-model="clinic" required><option value="" disabled>请选择实际接待诊所</option><option v-for="id in auth.identity?.clinic_scope" :key="id" :value="id">诊所 {{ id }}</option></select><label>服务依据<input v-model="service" required maxlength="255" placeholder="填写本次接待及人工核验依据"></label><label class="checkbox-label"><input v-model="confirmed" type="checkbox" required>已核实患者本人及原资料</label></fieldset>
    <form v-if="can('getPatient')" class="patient-lookup" @submit.prevent="lookup"><label>患者编号<input v-model="number" required maxlength="30" :disabled="busy || !!pending"></label><label>出生日期<input v-model="birth" type="date" required :disabled="busy || !!pending"></label><button type="submit" class="compact-primary" :disabled="busy || !!pending || !confirmed || !clinic || !service">核验并查找档案</button></form>
    <p v-if="!patient && !creating" class="muted">输入患者编号与出生日期核实档案；未查到时先核实是否曾建档。电话相同不表示同一个人。</p>
    <template v-if="patient"><div class="page-heading"><div><h2>{{ patient.full_name }}</h2><p>患者编号：<strong>{{ patient.patient_number }}</strong></p></div><div class="row-actions"><button v-if="can('getPatient')" :disabled="busy || !!pending" @click="refresh">重新读取资料</button><button v-if="can('updatePatient')" :disabled="busy || !!pending" @click="editing=true;creating=false">更正基本资料</button></div></div><p class="risk-banner">过敏状态：<strong>{{ {NOT_REVIEWED:'尚未核实',NO_KNOWN:'经询问无已知过敏',RECORDED:'存在已记录过敏'}[patient.allergy_review_status] }}</strong></p><p v-if="patient.self_reported_allergies" class="risk-banner">{{patient.self_reported_allergies}} · 本人声明，非医护核实</p></template>
    <form v-if="creating || editing" class="management-form patient-details-form" @submit.prevent="save"><h2>{{ creating?'新患者建档':'更正基本资料' }}</h2><fieldset :disabled="busy || !!pending"><div class="patient-fields"><label>姓名<input v-model="details.full_name" required maxlength="100"></label><label>档案出生日期<input v-model="details.date_of_birth" type="date" required></label><label>联系电话<input v-model="details.phone" required maxlength="30"></label><label>账单地址<input v-model="details.billing_address" required maxlength="255"></label><label>邮箱（可选）<input v-model="details.email" maxlength="254"></label><label>紧急联系人<input v-model="details.emergency_contact_name" required maxlength="100"></label><label>紧急联系电话<input v-model="details.emergency_contact_phone" required maxlength="30"></label></div><template v-if="creating"><label class="checkbox-label"><input v-model="duplicate" type="checkbox">出现疑似重复时，已人工确认是不同患者</label><label v-if="duplicate">重复线索复核理由<input v-model="reviewReason" required maxlength="255"></label></template></fieldset><button type="submit" class="compact-primary" :disabled="busy || !!pending || !confirmed || !clinic || !service">保存患者资料</button></form>
    <dl v-else-if="patient" class="patient-summary"><dt>出生日期</dt><dd>{{ patient.date_of_birth }}</dd><dt>电话</dt><dd>{{ patient.phone }}</dd><dt>账单地址</dt><dd>{{ patient.billing_address }}</dd><dt>邮箱</dt><dd>{{ patient.email || '未提供' }}</dd><dt>紧急联系人</dt><dd>{{ patient.emergency_contact_name }} · {{ patient.emergency_contact_phone }}</dd></dl>
    <section v-if="patient && can('listPatientAllergies')" aria-label="过敏核实记录"><div class="page-heading"><h2>过敏核实记录</h2><div class="row-actions"><button v-if="can('reviewPatientAllergies')" :disabled="busy || !!pending" @click="open('review')">核实过敏状态</button><button v-if="can('addPatientAllergy')" :disabled="busy || !!pending" @click="open('add')">新增过敏记录</button></div></div><p class="muted">撤销仅标记误记，原记录和核实链保留；没有记录不代表无过敏。</p><div class="table-scroll"><table class="data-table"><thead><tr><th>过敏症</th><th>程度</th><th>临床备注</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="item in allergies" :key="item.allergy_id"><td>{{ item.allergy_name }}</td><td>{{ item.severity_note || '未补充' }}</td><td>{{ item.clinical_note || '未补充' }}</td><td>{{ item.is_retracted?'已撤销误记':'当前记录' }}</td><td class="row-actions"><button v-if="!item.is_retracted && can('correctPatientAllergy')" :disabled="busy || !!pending" @click="open('correct',item)">更正</button><button v-if="!item.is_retracted && can('retractPatientAllergy')" :disabled="busy || !!pending" @click="open('retract',item)">撤销误记</button></td></tr><tr v-if="!allergies.length"><td colspan="5">暂无过敏关联，请按实际询问结果核实。</td></tr></tbody></table></div><button v-if="allergyNext" :disabled="busy" @click="loadAllergies(true)">加载更多记录</button></section>
    <div v-if="unknown && !dialog" class="dialog-actions"><button :disabled="busy" @click="query">查询办理进度</button><button :disabled="busy" @click="execute">重新确认办理结果</button></div>
  </section>
  <ElDialog v-model="dialog" :title="{review:'核实过敏状态',add:'新增过敏记录',correct:'更正过敏记录',retract:'撤销过敏误记'}[action]" width="560px" :close-on-click-modal="false" :close-on-press-escape="!pending" :show-close="!pending"><form class="management-form" @submit.prevent="submitAllergy"><fieldset :disabled="busy || !!pending"><template v-if="action==='review'"><label for="allergy-status">询问核实结果</label><select id="allergy-status" v-model="status"><option value="NOT_REVIEWED">尚未完成核实</option><option value="NO_KNOWN">经询问无已知过敏</option><option value="RECORDED">存在已记录过敏</option></select></template><template v-else-if="action==='add'"><label for="allergy-catalog">过敏目录</label><select id="allergy-catalog" v-model="allergyId" required><option value="" disabled>请选择共享目录中的过敏症</option><option v-for="item in catalog" :key="item.id" :value="item.id">{{ item.label }}</option></select><button v-if="catalogNext" type="button" @click="loadCatalog(true)">加载更多目录</button><p v-if="!catalog.length" class="muted">暂无可用目录项，请联系总部维护。</p></template><p v-else>{{ selected?.allergy_name }}</p><template v-if="action==='add' || action==='correct'"><label>过敏程度<input v-model="severity" maxlength="100"></label><label>临床备注<input v-model="clinical" maxlength="255"></label></template><label>核实及操作原因<input v-model="reason" required maxlength="255"></label></fieldset><p v-if="error" role="alert" class="error-message">{{ error }}</p><div v-if="unknown" class="dialog-actions"><button type="button" :disabled="busy" @click="query">查询办理进度</button><button type="button" :disabled="busy" @click="execute">重新确认办理结果</button></div><div v-else class="dialog-actions"><button type="button" @click="dialog=false">取消</button><button type="submit" class="compact-primary" :disabled="busy">确认保存核实结果</button></div></form></ElDialog>
</template>
<style scoped>
fieldset{border:1px solid #d7e3eb;border-radius:8px;padding:16px;margin:18px 0}legend{color:#426077;padding:0 6px}.patient-lookup{display:flex;gap:16px;align-items:end;flex-wrap:wrap;margin:24px 0}.patient-lookup label{display:grid;gap:8px}.patient-lookup input,.patient-fields input{min-height:36px}.patient-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.patient-summary{display:grid;grid-template-columns:130px 1fr;gap:12px;padding:18px;background:#f6fafc;border-radius:8px}.patient-summary dt{color:#4b667c}.patient-summary dd{margin:0;overflow-wrap:anywhere}.risk-banner{background:#fff5dc;color:#62470e;border-left:4px solid #cf981e;padding:14px 18px}@media(max-width:700px){.patient-fields{grid-template-columns:1fr}.patient-summary{grid-template-columns:1fr}}
</style>
