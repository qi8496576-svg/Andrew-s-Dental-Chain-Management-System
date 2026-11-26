import {connect} from './wechat-device.mjs'
const device=await connect()
try{const current=await device.state();console.log(JSON.stringify({page:current.path,busy:current.data.busy,authenticated:current.data.authenticated,new_booking_intents:'commonVisits' in current.data,new_billing_page:'bills' in current.data}));}finally{device.close()}
