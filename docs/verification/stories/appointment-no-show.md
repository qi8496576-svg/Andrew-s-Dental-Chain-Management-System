# UC01-S4 登记爽约（T035/T036）

真实MySQL：database/no-show-mysql.log，5项通过；真实HTTPS浏览器→Spring Security/业务服务→MySQL：database/appointment-review-browser-final-wrapper.log及appointment-review-browser.log通过。历史已结束预约是隔离库的合法前置夹具，不以新建过去预约绕过业务规则。

Given授权前台、可信同主体/患者/服务诊所核验引用、正常班次、时隙已结束且仍SCHEDULED，When人工核实未到诊并留因登记，Then保存CANCELLED/NO_SHOW、服务器取消时点、核实人及CANCEL事件。未结束、无依据、患者自报、停诊或已有到诊事实拒绝；到诊/爽约竞争仅一方迁移。原键不重复事件，撤权拒绝重放；审计故障整体回滚。对应AC-UC01-S4-01—03。

Web提供已结束未处理队列、人工核实依据与确认入口；队列只作线索，提交由服务器复核时点及当前状态，成功后刷新队列。不运行自动爽约任务，不增加第六状态；停诊仍转S5。复用既有角色、事务、医生→班次→预约锁及最小回执。相关前端权限、类型/构建见database/appointment-review-web-{tests,types,build}.log。

原Word、Spec、Plan、Constitution、业务数据库和批准契约保持不变；真实微信及生产环境不由本批代验。
