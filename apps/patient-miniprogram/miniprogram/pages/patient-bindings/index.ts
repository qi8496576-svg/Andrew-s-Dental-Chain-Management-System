import {routes} from '../../services/presentation'
import type { components } from '../../types/api'
import { patientSession } from '../../services/session'
import { ApiFailure,prepareCommand,UnknownOutcomeError,type PreparedCommand } from '../../services/http'
let pending:PreparedCommand|undefined
let registration:PreparedCommand|undefined
const blankDetails=()=>({full_name:'',date_of_birth:'',phone:'',billing_address:'',email:'',emergency_contact_name:'',emergency_contact_phone:''})
let generation=0;let owner='';let submittedFor=''
Page({
  ...routes,
  data:{returnToBooking:false,preferredClinic:'',mode:'new',details:blankDetails(),allergyStatement:'',allergyNote:'',consent:false,today:new Date(Date.now()+8*3600000).toISOString().slice(0,10),busy:false,submitting:false,submitted:false,error:'',notice:'',number:'',birth:'',clinicIndex:0,clinics:[] as components['schemas']['CatalogItem'][],binding:null as components['schemas']['Binding']|null,unknown:false},
  onLoad(options:Record<string,string|undefined>){this.setData({returnToBooking:options.return_to==='booking',preferredClinic:/^[1-9]\d*$/.test(options.clinic_id??'')?options.clinic_id:''})},
  selectMode(event:WechatMiniprogram.TouchEvent){if(!this.data.busy&&!pending&&!registration)this.setData({mode:String(event.currentTarget.dataset.mode),error:'',notice:''})},
  inputDetails(event:WechatMiniprogram.Input){if(registration)return;const field=String(event.currentTarget.dataset.field);if(Object.hasOwnProperty.call(this.data.details,field))this.setData({['details.'+field]:event.detail.value})},
  inputRegistrationBirth(event:WechatMiniprogram.PickerChange){if(!registration)this.setData({'details.date_of_birth':String(event.detail.value)})},
  changeAllergy(event:WechatMiniprogram.PickerChange){if(!registration)this.setData({allergyStatement:String(event.detail.value)})},
  inputAllergy(event:WechatMiniprogram.Input){if(!registration)this.setData({allergyNote:event.detail.value})},
  confirmRegistration(event:WechatMiniprogram.CheckboxGroupChange){if(!registration)this.setData({consent:event.detail.value.includes('confirmed')})},
  async register(){
    if(this.data.busy||this.data.binding)return;const current=generation,subject=owner;this.setData({busy:true,error:''});
    try{
      if(!registration){const clinic=this.data.clinics[this.data.clinicIndex],details=this.data.details;
        if(!clinic||!this.data.consent||!this.data.allergyStatement||!details.full_name.trim()||!details.date_of_birth||!details.phone.trim()||(this.data.allergyStatement==='KNOWN'&&!this.data.allergyNote.trim())){this.setData({error:'请完整填写本人资料、过敏情况，并确认信息属实。'});return}
        registration=await prepareCommand('registerSelfPatient','POST','/api/v1/me/patient-registration',{full_name:details.full_name.trim(),date_of_birth:details.date_of_birth,phone:details.phone.trim(),billing_address:null,email:null,emergency_contact_name:null,emergency_contact_phone:null,clinic_id:clinic.id,allergy_statement:this.data.allergyStatement,allergy_note:this.data.allergyNote.trim()||null,consent:true});
      }
      await patientSession().registerPatient(registration);if(subject!==owner)return;registration=undefined;if(current!==generation)return;this.setData({details:blankDetails(),allergyNote:'',consent:false,unknown:false,notice:'本人就诊资料已登记，可直接预约。过敏情况为本人填报，医护将在就诊时复核。'});await this.load();if(this.data.returnToBooking&&this.data.binding)wx.navigateBack({delta:1});
    }catch(error){if(current!==generation)return;if(error instanceof UnknownOutcomeError)this.setData({unknown:true,error:'登记结果尚未确认，请保留当前页面，按原申请重试。'});else{registration=undefined;this.setData({unknown:false,error:error instanceof ApiFailure&&error.code==='PATIENT_DUPLICATE_REVIEW_REQUIRED'?'资料可能与已有档案重复，请联系门店安全关联原档案；不会自动展示已有资料。':error instanceof ApiFailure?error.message:'登记未完成，请稍后重试。'})}}
    finally{if(current===generation)this.setData({busy:false})}
  },
  onShow(){this.load()},onHide(){generation++;this.setData({binding:null,number:'',birth:'',details:blankDetails(),allergyNote:'',consent:false,error:'',busy:false})},onUnload(){generation++;this.setData({binding:null,number:'',birth:'',details:blankDetails(),allergyNote:'',consent:false,error:'',busy:false})},
  async load(){const current=++generation;this.setData({busy:true,submitting:false,error:''});try{const service=patientSession();const identity=await service.me();if(current!==generation)return;if(identity.subject_id!==owner){pending=undefined;registration=undefined;submittedFor='';owner=identity.subject_id;this.setData({details:blankDetails(),allergyNote:'',consent:false,unknown:false,submitted:false,notice:''})}else this.setData({unknown:!!pending||!!registration,submitted:submittedFor===owner});const clinics=await service.clinics();if(current!==generation)return;const chosen=this.data.preferredClinic?clinics.items.findIndex(c=>c.id===this.data.preferredClinic):-1;this.setData({clinics:clinics.items,...(chosen>=0?{clinicIndex:chosen}:{}),preferredClinic:''});try{const binding=await service.binding();if(current===generation){submittedFor='';this.setData({binding,submitted:false,notice:''})}}catch(error){if(!(error instanceof ApiFailure && error.status===404))throw error;if(current===generation)this.setData({binding:null})}}catch(error){if(current===generation)this.setData({binding:null,error:error instanceof ApiFailure && error.status===401?'请先微信登录。':'服务暂未连接，请稍后重试。'})}finally{if(current===generation)this.setData({busy:false})}},
  inputNumber(event:WechatMiniprogram.Input){if(!pending)this.setData({number:event.detail.value})},
  inputBirth(event:WechatMiniprogram.PickerChange){if(!pending)this.setData({birth:String(event.detail.value)})},
  selectClinic(event:WechatMiniprogram.PickerChange){if(!pending)this.setData({clinicIndex:Number(event.detail.value)})},
  async submit(){const submission=generation,subject=owner;if(this.data.busy || this.data.submitted || submittedFor===owner)return;this.setData({busy:true,submitting:true,error:''});try{if(!pending){const clinic=this.data.clinics[this.data.clinicIndex];if(!clinic || !this.data.number || !this.data.birth){this.setData({error:'请填写原患者编号、出生日期并选择本次服务诊所。',busy:false});return}pending=await prepareCommand('requestPatientBinding','POST','/api/v1/me/binding-requests',{patient_number:this.data.number,date_of_birth:this.data.birth,clinic_id:clinic.id})}await patientSession().bindingRequest(pending);if(owner===subject){pending=undefined;submittedFor=subject}if(submission===generation)this.setData({unknown:false,submitted:true,notice:'申请已提交，等待诊所前台核验。提交成功不等于已绑定，请勿重复提交。'})}catch(error){if(submission!==generation)return;if(error instanceof UnknownOutcomeError)this.setData({unknown:true,error:'申请提交结果尚未确认，请查询原申请结果或按原请求重试。'});else{pending=undefined;this.setData({unknown:false,error:error instanceof ApiFailure?`申请未完成：${error.message}`:'申请未完成。'})}}finally{if(submission===generation)this.setData({busy:false,submitting:false})}},
  async query(){if(!pending || this.data.busy)return;const current=generation,subject=owner;this.setData({busy:true,submitting:false});try{const result=await patientSession().commandResult(pending);if(current!==generation || owner!==subject)return;if(result.status==='SUCCEEDED'){pending=undefined;submittedFor=subject;this.setData({unknown:false,submitted:true,error:'',notice:'申请提交已确认，等待前台核验；这不表示档案已绑定。'})}else this.setData({notice:'尚未确认申请提交结果，请保留原请求。'})}catch{if(current===generation)this.setData({error:'暂未查到授权结果，请保留原请求。'})}finally{if(current===generation)this.setData({busy:false})}},
})



