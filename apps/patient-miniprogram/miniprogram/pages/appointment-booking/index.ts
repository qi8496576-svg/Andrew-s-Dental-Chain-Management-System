import {beijingDate,accessMessage,routes,takeClinicChoice} from '../../services/presentation'
import type {components} from '../../types/api'
import {patientSession} from '../../services/session'
import {ApiFailure,prepareCommand,UnknownOutcomeError,type PreparedCommand} from '../../services/http'
import {bookingPayload} from './payload'
import {commonVisits,intentTreatments,type VisitIntent} from './visit-intents'
type Patient=components['schemas']['PatientView'];type Allergy=components['schemas']['AllergyView'];type Candidate=components['schemas']['Candidate'];type Catalog=components['schemas']['CatalogItem'] & {selected?:boolean}
let pending:PreparedCommand|undefined,owner='',ownerPatient='';let generation=0
type ResumeChoice={subject:string;patient:string;clinic:string;date:string;treatments:string[];intent:VisitIntent;slot:string}
let resumeChoice:ResumeChoice|undefined
const today=beijingDate()
function slotTime(slot:Candidate){const begin=new Date(Date.parse(slot.starts_at)+8*3600000).toISOString(),end=new Date(Date.parse(slot.ends_at)+8*3600000).toISOString();return begin.slice(0,10)+' '+begin.slice(11,16)+'–'+end.slice(11,16)+' 北京时间'}
Page({
  ...routes,
  data:{authenticated:false,resultDate:'',resultClinic:'',expanded:false,visitIntent:'CHECKUP' as VisitIntent,commonVisits:commonVisits([]),serviceSummary:'',today,searched:false,doctorId:'',doctors:[] as {id:string;name:string;title:string;specialty:string;introduction:string}[],busy:false,error:'',notice:'',unknown:false,clinics:[] as Catalog[],treatments:[] as Catalog[],clinicIndex:0,treatmentIds:[] as string[],date:today,slots:[] as (Candidate & {time:string;key:string;fee:string})[],selected:-1,patient:null as Patient|null,allergies:[] as Allergy[],confirmed:false,next:null as string|null},
  onShow(){const value=beijingDate();if(value!==this.data.today&&!pending)this.invalidate({today:value,date:this.data.date<=this.data.today?value:this.data.date});this.load()},onHide(){generation++;this.setData({authenticated:false,patient:null,allergies:[],slots:[],selected:-1,confirmed:false,next:null,searched:false,doctorId:'',doctors:[],busy:false})},onUnload(){generation++;this.setData({authenticated:false,patient:null,allergies:[],slots:[],selected:-1,busy:false})},
  async load(){
    const current=++generation;let restore:ResumeChoice|undefined
    this.setData({busy:true,error:'',unknown:!!pending})
    try{
      const session=patientSession(),identity=await session.me()
      if(identity.subject_id!==owner || ownerPatient!==(identity.binding?.patient_id??'')){pending=undefined;owner=identity.subject_id;ownerPatient=identity.binding?.patient_id??'';this.setData({unknown:false})}
      const choice=resumeChoice;resumeChoice=undefined
      if(choice?.subject===identity.subject_id&&(!choice.patient||choice.patient===ownerPatient)&&choice.date>=beijingDate())restore=choice
      const profile=identity.binding?await session.patientProfile():null
      let cursor=profile?.allergies.next_cursor
      while(cursor&&profile){const page=await session.patientProfile(cursor);if(page.patient.patient_id!==profile.patient.patient_id)throw new Error('Binding changed');profile.allergies.items.push(...page.allergies.items);cursor=page.allergies.next_cursor}
      const clinics=await session.clinics(),preferred=restore?.clinic??takeClinicChoice()
      const selectedClinic=preferred?clinics.items.findIndex(c=>c.id===preferred):this.data.clinicIndex
      const treatments:Catalog[]=[];let next:string|null=null
      do{const page=await session.treatments(next??undefined);treatments.push(...page.items);next=page.next_cursor}while(next)
      let intent=restore?.intent??this.data.visitIntent
      let selected=restore?.treatments??this.data.treatmentIds
      selected=selected.filter(id=>treatments.some(t=>t.id===id&&t.active!==false))
      if(intent!=='OTHER')selected=intentTreatments(treatments,intent)
      if(!selected.length&&intent!=='OTHER')intent='OTHER'
      if(current===generation)this.setData({authenticated:true,patient:profile?.patient??null,allergies:profile?.allergies.items.filter(a=>!a.is_retracted)??[],clinics:clinics.items,clinicIndex:selectedClinic>=0&&selectedClinic<clinics.items.length?selectedClinic:0,treatments:treatments.map(t=>({...t,selected:selected.includes(t.id)})),treatmentIds:selected,visitIntent:intent,commonVisits:commonVisits(treatments),serviceSummary:treatments.filter(t=>selected.includes(t.id)).map(t=>t.label).join('、'),expanded:intent==='OTHER',...(restore?{date:restore.date}:{})})
    }catch(error){restore=undefined;if(current===generation)this.setData({patient:null,allergies:[],error:error instanceof ApiFailure?(error.status===401?'请先微信登录，再预约就诊。':error.code==='PATIENT_BINDING_REQUIRED'?'尚未填写本人就诊资料，请先登记或关联已有档案。':'暂未取得预约资料，请刷新或联系诊所。'):'无法读取本人资料，请稍后重试。'})}
    finally{if(current===generation)this.setData({busy:false})}
    if(restore&&current===generation){
      const revision=generation+1;await this.find()
      if(generation!==revision||!this.data.searched)return
      const selected=this.data.slots.findIndex(slot=>slot.key===restore!.slot)
      this.setData({selected,confirmed:false,notice:selected>=0?'已重新核对原时段，请确认就诊安排。':'原时段已不可预约，请选择其他时间。'})
    }
  },
  invalidate(values:Record<string,unknown>={}){generation++;this.setData({...values,slots:[],selected:-1,confirmed:false,next:null,searched:false,doctorId:'',doctors:[],busy:false,error:'',notice:'',resultDate:'',resultClinic:''})},
  clinic(event:WechatMiniprogram.PickerChange){if(!pending)this.invalidate({clinicIndex:Number(event.detail.value)})},
  date(event:WechatMiniprogram.PickerChange){if(!pending)this.invalidate({date:String(event.detail.value)})},
  treatments(event:WechatMiniprogram.CheckboxGroupChange){if(!pending)this.invalidate({visitIntent:'OTHER',treatmentIds:event.detail.value,serviceSummary:this.data.treatments.filter(t=>event.detail.value.includes(t.id)).map(t=>t.label).join('、'),treatments:this.data.treatments.map(t=>({...t,selected:event.detail.value.includes(t.id)}))})},
  chooseIntent(event:WechatMiniprogram.TouchEvent){
    if(pending||this.data.busy)return
    const intent=String(event.currentTarget.dataset.intent)
    if(intent!=='CHECKUP'&&intent!=='CLEANING'&&intent!=='OTHER')return
    const ids=intent==='OTHER'?[]:intentTreatments(this.data.treatments,intent)
    this.invalidate({visitIntent:intent,expanded:intent==='OTHER',treatmentIds:ids,serviceSummary:this.data.treatments.filter(t=>ids.includes(t.id)).map(t=>t.label).join('、'),treatments:this.data.treatments.map(t=>({...t,selected:ids.includes(t.id)}))})
  },
  binding(){
    const slot=this.data.slots[this.data.selected],clinic=this.data.clinics[this.data.clinicIndex]
    if(pending||this.data.busy||!slot||!clinic)return
    resumeChoice={subject:owner,patient:ownerPatient,clinic:clinic.id,date:this.data.date,treatments:[...this.data.treatmentIds],intent:this.data.visitIntent,slot:slot.key}
    wx.navigateTo({url:'/pages/patient-bindings/index?return_to=booking&clinic_id='+encodeURIComponent(clinic.id)})
  },
  confirm(event:WechatMiniprogram.CheckboxGroupChange){if(!pending)this.setData({confirmed:event.detail.value.includes('confirmed')})},
  select(event:WechatMiniprogram.TouchEvent){const index=Number(event.currentTarget.dataset.index);if(!pending&&Number.isInteger(index)&&this.data.slots[index])this.setData({selected:index,confirmed:false},()=>wx.pageScrollTo({selector:'#booking-confirmation',duration:250}))},
  async find(more=false){
    if(this.data.busy||pending)return
    const clinic=this.data.clinics[this.data.clinicIndex],date=this.data.date,treatments=[...this.data.treatmentIds]
    if(!clinic||!date||!treatments.length){this.setData({error:'请选择门店、就诊需求及预约日期。'});return}
    const current=++generation;this.setData({busy:true,error:'',selected:-1,confirmed:false,...(!more?{slots:[],next:null,searched:false,resultDate:'',resultClinic:''}:{})})
    try{
      const end=new Date(date+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+1)
      const query='clinic_id='+encodeURIComponent(clinic.id)+'&start='+encodeURIComponent(date+'T00:00:00+08:00')+'&end='+encodeURIComponent(end.toISOString().slice(0,10)+'T00:00:00+08:00')+'&limit=100&'+treatments.map(id=>'treatment_ids='+encodeURIComponent(id)).join('&')+(more&&this.data.next?'&cursor='+encodeURIComponent(this.data.next):'')
      const session=patientSession(),page=await session.bookingCandidates(query)
      if(current!==generation)return
      const identity=await session.me();if(identity.subject_id!==owner||(identity.binding?.patient_id??'')!==ownerPatient)throw new ApiFailure(403,'PATIENT_BINDING_CHANGED')
      if(current!==generation)return
      const merged=[...(more?this.data.slots:[]),...page.items.map(s=>({...s,key:s.schedule_id+':'+s.starts_at,time:slotTime(s),fee:((s.registration_fee_fen??0)/100).toFixed(2)}))],slots=Array.from(new Map(merged.map(s=>[s.key,s])).values()).sort((a,b)=>a.starts_at.localeCompare(b.starts_at)||a.dentist_id.localeCompare(b.dentist_id))
      this.setData({slots,next:page.next_cursor,searched:true,confirmed:false,resultDate:date,resultClinic:clinic.label,doctors:Array.from(new Map(slots.map(s=>[s.dentist_id,{id:s.dentist_id,name:s.dentist_name,title:s.professional_title||'职称暂未提供',specialty:s.specialty||'主要方向暂未提供',introduction:s.introduction||'简介暂未提供'}])).values())})
    }catch(error){if(current===generation){if(error instanceof ApiFailure&&[401,403].includes(error.status))this.setData({authenticated:false,patient:null,allergies:[],slots:[],selected:-1,confirmed:false,searched:false});this.setData({error:accessMessage(error)})}}
    finally{if(current===generation)this.setData({busy:false})}
  },
  expandServices(){this.setData({expanded:!this.data.expanded})},
  chooseDoctor(event:WechatMiniprogram.TouchEvent){if(!pending && !this.data.busy)this.setData({doctorId:String(event.currentTarget.dataset.id),selected:-1,confirmed:false})},
  search(){this.find(false)},more(){this.find(true)},
  async submit(){if(this.data.busy)return;const patient=this.data.patient,slot=this.data.slots[this.data.selected];if(!pending && (!patient || !slot || !this.data.confirmed || !patient.allergy_confirmation_reference)){this.setData({error:'请确认本人资料及全部已知过敏，并选定有效时隙。'});return}const current=generation;this.setData({busy:true,error:''});try{pending??=await prepareCommand((slot?.registration_fee_fen??0)>0?'createBookingHold':'createAppointment','POST',(slot?.registration_fee_fen??0)>0?'/api/v1/booking-holds':'/api/v1/appointments',bookingPayload(patient!,this.data.allergies,slot!,this.data.treatmentIds,true));if(pending.operation==='createBookingHold'){const bill=await patientSession().billCommand(pending);pending=undefined;if(current===generation){this.setData({unknown:false,notice:'号源已短时保留，请完成演示缴费后确认预约。',slots:[],selected:-1,confirmed:false,searched:false});wx.navigateTo({url:'/pages/patient-bills/index?bill_id='+encodeURIComponent(bill.bill_id)})}return}const result=await patientSession().book(pending);pending=undefined;if(current===generation)this.setData({unknown:false,notice:`预约已保存：${result.appointment_id}`,slots:[],selected:-1,confirmed:false,searched:false,next:null,doctors:[]})}catch(error){if(current===generation){if(error instanceof UnknownOutcomeError)this.setData({unknown:true,error:'结果确认中，请保留当前页面并重新确认办理结果。'});else{pending=undefined;this.setData({unknown:false,error:error instanceof ApiFailure?`预约未保存：${error.message}`:'预约未保存。'})}}}finally{if(current===generation)this.setData({busy:false})}},
  async query(){if(!pending)return;try{const result=await patientSession().commandResult(pending);this.setData({notice:result.status==='SUCCEEDED'?'原预约已成功，请重新确认办理结果。':'尚未确认成功，请保留原请求并重试。'})}catch{this.setData({error:'暂未取得授权回执，请保留原请求。'})}},
})






