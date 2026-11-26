# SF02 患者本人绑定（T025/T026）

2026-11-12 实施，2026-11-13接续核对；没有使用真实微信凭据。

真实MySQL：`database/bindings-final.log`，4项通过。真实Vue→HTTPS测试网关→Spring Security/业务服务→MySQL：`database/bindings-browser-schedules.log` BUILD SUCCESS，绑定浏览器用例见`database/patient-bindings-browser.log`。两个患者主体及Bearer会话是隔离数据库前置条件，不冒充真实微信登录。

Given本人仅提交患者编号、出生日期和本次服务诊所，When提交申请，Then仅生成PENDING线索，不匹配并自动披露档案。Given授权前台核实原编号、生日、本人及服务依据，When批准，Then真实保存申请、唯一当前绑定、BindingEvent、审计和最小回执。缺核验/错误编号生日/范围外诊所拒绝。对应AC-SF02-01。

Given两个不同主体争用同一患者，When不同前台并发批准，Then只有一个成功，另一方409。Given同患者的新主体PENDING申请，When核验换号重绑，Then旧绑定失效、新绑定有效、旧会话立即不能读取档案；解绑保留申请及事件历史。审计不可写时绑定、申请处理及事件全部回滚；重放原批准不能绕过当前绑定状态。对应AC-SF02-02。

Web页面支持实际档案定位、批准、换号重绑、解绑留因及原键查询/重试，历史已批准申请明确不代表当前有效绑定。小程序页面使用共享内存会话提交线索并查询当前绑定；不接受伪造主体头、不存明文令牌到持久存储。SDK边界测试`database/bindings-mini-tests.log`通过；微信真机/真实凭据联调仍属T051。

相关前端5项测试、类型及构建证据见`database/bindings-schedules-web-final.log`、`database/schedules-types-final.log`、`database/schedules-build-final.log`（含本页）。数据库19/163/30及原正式模型保持不变。
