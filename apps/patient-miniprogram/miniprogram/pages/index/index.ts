import type {components} from '../../types/api'
import {patientSession} from '../../services/session'
import {ApiFailure} from '../../services/http'
import {routes} from '../../services/presentation'
let generation=0
Page({
 data:{busy:false,authenticated:false,bound:false,error:'',clinics:[] as components['schemas']['CatalogItem'][]},
 ...routes,
 onShow(){this.load()},onHide(){generation++;this.setData({busy:false,authenticated:false,bound:false,clinics:[]})},
 onUnload(){generation++},
 async load(){const current=++generation;this.setData({busy:true,error:''});try{const session=patientSession(),me=await session.me();const clinics=await session.clinics();if(current===generation)this.setData({authenticated:true,bound:!!me.binding,clinics:clinics.items})}catch(error){if(current===generation)this.setData({authenticated:false,bound:false,clinics:[],error:error instanceof ApiFailure&&error.status===401?'':'暂未取得门店信息，请稍后重试。'})}finally{if(current===generation)this.setData({busy:false})}},
})
