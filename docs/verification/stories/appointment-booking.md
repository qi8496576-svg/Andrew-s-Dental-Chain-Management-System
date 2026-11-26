# UC01-S1 创建预约（T029/T030）

真实MySQL后端：`database/schedules-booking-authorization-final.log`，预约5项、授权回退回归1项及排班浏览器1项全部通过。后续共享事务/绑定回归及预约浏览器：`database/booking-browser-security-final.log`，12项通过。`database/booking-response-loss-final.log`已验证真实提交后丢失响应、查成功回执及原键重试不重复建约；新增拒绝用例的最终记录见`database/booking-negative-and-response-loss.log`。

Given可信本人绑定或前台核验引用，When完整资料、全部已知过敏及服务器当前确认引用提交到有效正常时隙，Then真实保存SCHEDULED、期望治疗及BOOK，无实际治疗和单据。前台代新患者建档/核实/过敏核实后可代预约，建档不会自动绑定。对应AC-UC01-S1-01/02。

Given必需资质缺失、未核验/失效、执业/任职无效、非NORMAL或占位，When筛选或再次提交，Then候选排除或提交拒绝；可选资质缺失不阻断。原始患者资料冲突、缺项、过敏未确认/过时引用或非对齐/结束边界时刻不保存部分预约。对应AC-UC01-S1-03/04。候选有分页，提交在同一牙医父行及班次锁内复核；全部已知过敏与受保护资料保持原样。

Given不同可信主体同时争用一个有效时隙，When实际MySQL并发提交，Then最多一个成功，另一方409；四种非取消状态占位，取消不占位，重叠以原班次粒度计算。审计故障同时回滚预约、期望治疗、BOOK和回执。Given已提交但下游响应丢失，When查回执并原键重试，Then返回同一个预约；同键异内容409。对应AC-UC01-S1-05/06。故障注入只丢弃真实后端响应，没有伪造成功结果。

Vue预约管理与出诊排班入口独立，包含当日时间轴、有效候选、前台本人核验及全部资料/过敏确认；停诊返回真实待处理ID，预约仍SCHEDULED，不自动取消。患者端原生页面共享会话，身份取当前绑定，不发送patient_id或建档人工核验字段；使用批准的ADC-CONTRACT-20261112-04独立资料DTO。小程序业务操作按查询候选→选择时隙→核对资料/全部过敏→确认保存四步组织（资料自动读取，不额外办理建档或过敏更正）。

相关Vue 6项测试、类型/构建通过：`database/booking-web-tests.log`、`booking-web-types.log`、`booking-web-build-final.log`。小程序9项传输/登录/隐私/绑定/预约边界测试与5页资产构建通过：`database/booking-mini-final.log`、`binding-booking-mini-build.log`。真实联调用原生预约payload函数和隔离MySQL的合法Bearer会话，不冒充微信code2Session或真机页面验收；AppID/真实微信凭据与真机联调仍由T051执行。

正式Word、业务ERD/UML、19表/163字段/30业务外键、三物理Schema及已批准业务规则不变。契约修正4有负责人明确批准及真实前后指纹；82操作、91个JSON组件模型，不是数据库表数。
