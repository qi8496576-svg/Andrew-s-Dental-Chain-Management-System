const messages:Record<string,string>={
  REGISTRATION_PAYMENT_REQUIRED:'此时段需先办理挂号缴费，请刷新后重新选择。',DEMO_PAYMENT_DISABLED:'此门店未启用演示支付，请联系门店。',FREE_BOOKING_REQUIRED:'此时段无需挂号费，请刷新后直接确认预约。',PAID_BILL_REQUIRED:'此账单尚未成功缴费，不能办理退款。',CANCEL_APPOINTMENT_FIRST:'请先按规则取消预约，挂号费会同时办理演示退款。',INVALID_AMOUNT:'请输入范围内的正确金额。',PAID_BILL_CANNOT_CLOSE:'此账单已缴费，请通过取消预约或退款流程办理。',TREATMENT_BILL_CANNOT_CLOSE:'诊疗账单不能直接关闭，请联系收费人员。',

 AUTH_REQUIRED:'请先微信登录，再继续使用本人服务。',PATIENT_BINDING_REQUIRED:'请先填写本人就诊资料，已有档案可申请安全关联。',PATIENT_BINDING_CHANGED:'本人档案绑定已变化，请刷新后重新核对。',ACCESS_DENIED:'当前资料不在本人授权范围，请核对登录与绑定状态。',SLOT_OCCUPIED:'该时段已被预约，请刷新可约时段后重新选择。',SCHEDULE_UNAVAILABLE:'当前排班已变化，请重新查询可约时段。',DENTIST_QUALIFICATION_UNAVAILABLE:'医生的必需资质当前不满足要求，请重新查询可约时段。',PATIENT_DETAILS_CONFLICT:'本人档案已更新，请重新读取并核对后预约。',ALLERGY_CONFIRMATION_REQUIRED:'请先核对全部过敏记录并确认。',APPOINTMENT_STATE_CONFLICT:'预约状态已变化，请刷新后按当前状态办理。',CONTACT_RECEPTION_FOR_CANCELLATION:'已到预约开始时刻，请联系前台核实代办。',USE_NO_SHOW_REVIEW:'时隙已结束，请联系前台核实未到诊事实。',USE_CLINIC_RESCHEDULING:'诊所已停诊，请联系前台办理停诊安排。',INVALID_REQUEST:'填写内容不完整或格式不正确，请核对后提交。'
}
export function businessMessage(code:string){return messages[code]??'办理未完成，请刷新资料后重试；如仍无法办理，请联系诊所。'}
export function appointmentStatusLabel(status:string){return ({SCHEDULED:'待就诊',IN_PROGRESS:'诊疗中',COMPLETED:'已完成治疗',INVOICED:'已生成费用凭据',CANCELLED:'已取消'} as Record<string,string>)[status]??'状态待确认'}
