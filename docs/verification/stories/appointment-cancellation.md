# UC01-S3 患者取消（T033/T034）

复用原POST /appointments/{appointmentId}/cancel及共享身份/锁/事务、核验审计和回执。未增加取消分类或恢复操作，没有将取消与诊所停诊混用。

Given当前本人绑定、SCHEDULED及正常班次，When服务器时间早于预约开始且本人留因取消，Then保存CANCELLED、PATIENT_CANCEL、服务器取消时点和CANCEL事件，释放占位。Given恰好开始或结束前最后一秒，When患者自助及授权前台核实代办，Then自助拒绝而前台可办；恰好结束转爽约核实，停诊转停诊处理，不静默登记患者取消。Given已到诊、已取消或无本人当前绑定/权限，When取消或重放，Then拒绝且保留原事实。对应AC-UC01-S3-01/02/03/04。

真实MySQL权限、开始/结束边界、幂等、撤绑定及审计回滚：database/transitions-mysql.log；到诊/取消竞争与既有预约回归：database/transitions-races-and-projections.log（13项通过）；结束前最后一秒及最后浏览器验收：database/transitions-boundary-and-browser-final.log。

真实Vue→HTTPS测试网关→后端→MySQL与患者Bearer协议闭环验证前台代办、本人自助、拒绝他人/已到诊/患者自助到诊，以及真实提交后丢弃响应、查询成功回执和原键重试。前台旧页面遇到别人已取消的状态，拒绝后读取当前事实并禁用再次办理；没有伪造成功响应。见appointment-transitions-browser.log。微信主体和Bearer是隔离数据库前置条件，不冒充真实code2Session或真机验收。

小程序独立本人预约/取消页按当前绑定读取本人预约，不接受patient_id筛选；开始/结束判断最终在服务器执行。隐藏/卸载清空敏感显示，迟到响应不得恢复旧资料；主体/绑定变化清空旧列表和未决命令。SDK边界测试见database/transitions-mini-tests-final.log（3项，含读取期间绑定变化的拒绝），类型及6页原生产物见transitions-mini-types.log、transitions-mini-build.log。真实微信与真机仍由T051完成。

原Word、Spec、Plan、Constitution、19表/163字段/30业务外键及所有批准契约保持不变。

