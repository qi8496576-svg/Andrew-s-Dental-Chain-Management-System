# UC02 独立出诊排班（T027/T028）

后端真实MySQL：`database/bindings-browser-schedules.log`，SchedulesIT 5项通过，覆盖跨诊所首次排班并发、半开相邻区间、非法粒度、任职/执业日期、权限撤销与审计回滚。

Given授权诊所、有效任职/执业及09:00—10:00的20分钟粒度，When保存，Then原DentistSchedule为NORMAL，完整时隙为09:00、09:20、09:40。Given同牙医跨诊所重叠NORMAL或非法粒度，When并发/普通提交，Then拒绝；相邻允许，SUSPENDED历史不参与NORMAL重叠。对应AC-UC02-01/02。

Given旧班次有SCHEDULED及IN_PROGRESS预约，When前台留因停诊，Then只挂起班次并返回SCHEDULED待处理ID，两份预约状态和原班次归属/日期/时间/粒度保持。没有覆盖已引用班次的更新接口；后续处理属于UC01-S5。对应AC-UC02-03。

Vue具有独立出诊排班入口及医生周视图，支持授权诊所/医生/周筛选、相邻新增、重叠提示、停诊原因及影响列表。5项相关前端单元测试和类型/构建已通过（见database/bindings-schedules-web-final.log及schedules-{types,build}-final.log）。2026-11-13最终真实浏览器验收通过，见database/schedules-booking-authorization-final.log与schedules-browser.log。空可选备注提交已修正为null；前台目录权限回退误标记事务回滚的问题已修复并有独立真实MySQL回归。截图schedules.png来自实际页面，旧失败日志保留，不作为通过证据。
