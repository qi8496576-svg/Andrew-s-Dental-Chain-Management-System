import {routes} from '../../services/presentation'
import type { components } from '../../types/api'
import { patientSession } from '../../services/session'
import { ApiFailure } from '../../services/http'
type Patient=components['schemas']['PatientView']
type Allergy=components['schemas']['AllergyView']
let generation=0
Page({
  ...routes,
  data:{busy:false,error:'',patient:null as Patient|null,allergies:[] as Allergy[],next:null as string|null,statusText:''},
  onShow(){this.load()},
  onHide(){generation++;this.setData({patient:null,allergies:[],next:null,statusText:'',busy:false})},
  onUnload(){generation++;this.setData({patient:null,allergies:[],next:null,statusText:'',busy:false})},
  async load(more=false){
    if(this.data.busy)return
    const request=++generation
    this.setData({busy:true,error:''})
    if(!more)this.setData({patient:null,allergies:[],next:null,statusText:''})
    try{
      const result=await patientSession().patientProfile(more?this.data.next??undefined:undefined)
      if(request!==generation)return
      const samePatient=this.data.patient?.patient_id===result.patient.patient_id
      this.setData({patient:result.patient,allergies:more && samePatient?[...this.data.allergies,...result.allergies.items]:result.allergies.items,next:result.allergies.next_cursor,statusText:{NOT_REVIEWED:'尚未核实',NO_KNOWN:'经询问无已知过敏',RECORDED:'存在已记录过敏'}[result.patient.allergy_review_status]})
    }catch(error){if(request===generation)this.setData({patient:null,allergies:[],next:null,error:error instanceof ApiFailure && error.status===401?'请先登录，再查看本人资料。':error instanceof ApiFailure && error.status===403?'尚无本人就诊资料，请先登记或关联已有档案。':'资料暂未取得，请稍后重试。'})}
    finally{if(request===generation)this.setData({busy:false})}
  },
  refresh(){this.load(false)},
  more(){this.load(true)},
})
