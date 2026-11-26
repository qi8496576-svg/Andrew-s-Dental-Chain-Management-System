import {businessMessage} from './business-messages'
import {ApiFailure} from './http'
export function accessMessage(error:unknown){
  if(error instanceof ApiFailure){
    if(error.status===401)return '请先微信登录，继续使用本人服务。'
    return businessMessage(error.code)
  }
  return '服务暂未连接，请检查网络后重试。'
}
export function beijingDate(){return new Date(Date.now()+8*3600000).toISOString().slice(0,10)}
let clinicChoice:string|undefined
let recordChoice:string|undefined
export function takeClinicChoice(){const value=clinicChoice;clinicChoice=undefined;return value}
export function takeRecordChoice(){const value=recordChoice;recordChoice=undefined;return value}
export const routes={
  fees(){wx.navigateTo({url:'/pages/patient-bills/index'})},
  home(){wx.switchTab({url:'/pages/index/index'})},
  booking(event?:WechatMiniprogram.TouchEvent){if(event?.currentTarget?.dataset.clinic)clinicChoice=String(event.currentTarget.dataset.clinic);wx.switchTab({url:'/pages/appointment-booking/index'})},
  records(event?:WechatMiniprogram.TouchEvent){recordChoice=String(event?.currentTarget?.dataset.filter??'ALL');wx.switchTab({url:'/pages/appointment-cancellation/index'})},
  mine(){wx.switchTab({url:'/pages/personal/index'})},
  login(){wx.navigateTo({url:'/pages/authentication/index'})},
  binding(){wx.navigateTo({url:'/pages/patient-bindings/index'})},
  profile(){wx.navigateTo({url:'/pages/patients/index'})},
}
