import type {components} from '../../types/api'
import {patientSession} from '../../services/session'
import {ApiFailure} from '../../services/http'
import {routes} from '../../services/presentation'
let generation=0
Page({
 data:{busy:false,authenticated:false,bound:false,patient:null as components['schemas']['PatientView']|null,error:''},...routes,
 onShow(){this.load()},onHide(){generation++;this.setData({busy:false,authenticated:false,bound:false,patient:null})},onUnload(){generation++},
 async load(){const current=++generation;this.setData({busy:true,error:'',patient:null});try{const session=patientSession(),me=await session.me();if(current!==generation)return;this.setData({authenticated:true,bound:!!me.binding});if(me.binding){const profile=await session.patientProfile();if(current===generation)this.setData({patient:profile.patient})}}catch(error){if(current===generation)this.setData({patient:null,authenticated:!(error instanceof ApiFailure&&error.status===401)&&this.data.authenticated,bound:error instanceof ApiFailure&&[401,403].includes(error.status)?false:this.data.bound,error:error instanceof ApiFailure&&error.status===401?'':'暂未取得本人档案，请刷新重试。'})}finally{if(current===generation)this.setData({busy:false})}},
 account(){wx.navigateTo({url:'/pages/authentication/index'})},
})

