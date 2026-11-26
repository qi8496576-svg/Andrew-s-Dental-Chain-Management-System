# UC01-S2 确认到诊（T031/T032）

复用现有真实预约、身份/诊所授权、核验审计、稳定医生→班次→预约锁、AtomicCommandExecutor及最小回执。只开放原POST /appointments/{appointmentId}/attend；没有修改契约、数据库或批准规则。

Given当前授权前台、同主体/患者/诊所的可信核验引用、NORMAL且SCHEDULED，When确认到诊，Then保存服务器attended_at及SCHEDULED→IN_PROGRESS的单一ATTEND事件。Given错误核验引用、患者自助、停诊、已取消或非SCHEDULED，When提交，Then拒绝而不覆盖原事实。Given原键成功且仍有当前权限，When重试，Then返回当前授权结果且不重复事件；撤权拒绝重放。对应AC-UC01-S2-01/02/03。

真实MySQL正常/越权/回滚见database/transitions-mysql.log（最初6项）；增加到诊与取消、停诊竞争及既有预约投影回归后，database/transitions-races-and-projections.log 13项通过。竞争只允许一次状态迁移；停诊不自动取消已到诊就诊；审计不可写时状态、时点、事件和回执同时回滚。

Web操作从预约管理进入独立到诊操作页，当前状态及事实时点可重新读取，核验只使用原患者定位接口；网络未知保留原键。真实HTTPS测试网关→Spring Security/业务服务→MySQL的浏览器证据见database/transitions-browser-final.log；追加旧页面状态冲突刷新后的最终结果见database/transitions-boundary-and-browser-final.log及appointment-transitions-browser.log。测试辅助程序跟随浏览器实际轮换的CSRF头，不降低CSRF检查。

相关Vue路由权限、类型及构建见database/transitions-web-{tests,types,build}-final.log。AppointmentView只返回契约已经定义的可空事实字段；取消时点留在原数据库/事件，不擅自在响应中增加cancelled_at。真实微信/生产环境不由此批代验，后续爽约竞争由T035及完整系统门禁继续验证。
