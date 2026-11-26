import {patientSession} from '../../services/session'
import {routes,accessMessage} from '../../services/presentation'
import {ApiFailure,UnknownOutcomeError,prepareCommand,type PreparedCommand} from '../../services/http'
import type {components} from '../../types/api'
type Bill=components['schemas']['PatientBill']
const labels:Record<string,string>={PENDING:'待缴费',PAID:'已缴费',CLOSED:'已关闭',REFUNDED:'已退款'}
const display=(b:Bill)=>({...b,amount:(b.amount_fen/100).toFixed(2),statusLabel:labels[b.status],kindLabel:b.kind==='REGISTRATION'?'挂号费':'诊疗费用',expires:b.expires_at?new Date(Date.parse(b.expires_at)+8*3600000).toISOString().slice(0,16).replace('T',' '):''})
let pending:PreparedCommand|undefined,owner='',generation=0
Page({
  ...routes,
  data:{busy:false,error:'',notice:'',unknown:false,authenticated:false,bound:false,filter:'ALL',bills:[] as ReturnType<typeof display>[],visible:[] as ReturnType<typeof display>[],next:null as string|null},
  onShow(){return this.load()},onHide(){generation++;this.setData({bills:[],visible:[],busy:false,bound:false})},onUnload(){generation++},
  async load(more=false){if(this.data.busy)return;const current=++generation;this.setData({busy:true,error:''});try{const service=patientSession(),identity=await service.me();const scope=identity.subject_id+':'+(identity.binding?.patient_id??'');if(scope!==owner){pending=undefined;owner=scope;this.setData({bills:[],visible:[],unknown:false})}this.setData({authenticated:true,bound:!!identity.binding});if(!identity.binding)return;const page=await service.ownBills(more?this.data.next??undefined:undefined);const fresh=await service.me();if(current!==generation)return;if(fresh.subject_id+':'+(fresh.binding?.patient_id??'')!==owner){pending=undefined;owner='';this.setData({authenticated:false,bound:false,bills:[],visible:[],unknown:false});return;}const bills=[...(more?this.data.bills:[]),...page.items.map(display)].sort((a,b)=>b.bill_id.localeCompare(a.bill_id));this.setData({bills,next:page.next_cursor,unknown:!!pending});this.applyFilter()}catch(error){if(current===generation){if(error instanceof ApiFailure&&[401,403].includes(error.status))this.setData({authenticated:false,bound:false,bills:[],visible:[]});this.setData({error:accessMessage(error)})}}finally{if(current===generation)this.setData({busy:false})}},
  chooseFilter(event:WechatMiniprogram.TouchEvent){this.setData({filter:String(event.currentTarget.dataset.filter)});this.applyFilter()},
  applyFilter(){this.setData({visible:this.data.bills.filter(b=>this.data.filter==='ALL'||b.status===this.data.filter)})},
  refresh(){return this.load(false)},more(){return this.load(true)},
  async action(event:WechatMiniprogram.TouchEvent){
    if(this.data.busy||pending)return;const id=String(event.currentTarget.dataset.id),action=String(event.currentTarget.dataset.action),bill=this.data.bills.find(b=>b.bill_id===id);if(!bill)return
    if(action==='pay'&&(!bill.demo_enabled||bill.status!=='PENDING'))return
    const accepted=await new Promise<boolean>(resolve=>wx.showModal({title:action==='pay'?'确认演示缴费':action==='close'?'取消本次待缴挂号':'申请退号退款',content:action==='pay'?`演示支付，不扣真实款。演示金额 ¥${bill.amount}。挂号费支付后才确认预约。`:action==='close'?'关闭待缴挂号并释放保留号源，不生成预约。':'仅办理符合退号条件的演示退款，不扣真实款。',success:r=>resolve(r.confirm),fail:()=>resolve(false)}));if(!accepted)return
    const path=`/api/v1/patient-bills/${encodeURIComponent(id)}/${action==='pay'?'demo-payments':action==='close'?'close':'refunds'}`
    pending=await prepareCommand(action==='pay'?'payDemoBill':action==='close'?'closePatientBill':'refundPatientBill','POST',path,action==='refund'?{reason:'患者申请退号退款'}:{})
    return this.execute()
  },
  async execute(){if(!pending||this.data.busy)return;const current=generation;this.setData({busy:true,error:''});try{const bill=await patientSession().billCommand(pending);pending=undefined;if(current!==generation)return;this.setData({unknown:false,notice:bill.status==='PAID'?(bill.kind==='REGISTRATION'?'演示缴费完成，预约已确认。':'演示诊疗缴费完成。'):bill.status==='REFUNDED'?'演示退款已完成。':'该待缴记录已关闭，未生成预约。'})}catch(error){if(current===generation){if(error instanceof UnknownOutcomeError)this.setData({unknown:true,error:'结果尚未确认，请保留当前请求，查询或原样重试。'});else{pending=undefined;this.setData({unknown:false,error:error instanceof ApiFailure?error.message:'办理失败，请刷新后重试。'})}}}finally{if(current===generation){this.setData({busy:false});await this.load()}}},
  async query(){if(!pending)return;try{const result=await patientSession().commandResult(pending);this.setData({notice:result.status==='SUCCEEDED'?'原请求已处理，请原样确认结果。':'结果尚未确认，请保留原请求。'});}catch{this.setData({error:'暂未取得原请求结果。'})}},
})
