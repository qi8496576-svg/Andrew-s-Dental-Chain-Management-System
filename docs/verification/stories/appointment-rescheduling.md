# UC01-S5 停诊改约（T037/T038）

真实MySQL：database/rescheduling-atomicity.log，5项通过，含新约INSERT、来源关联UPDATE、BOOK事件及审计故障整体回滚；database/rescheduling-race-and-http.log，2项通过，覆盖不同旧约/前台竞争同一新位及CLINIC_CANCEL禁止显式null目标字段。真实浏览器见database/appointment-review-browser-final-wrapper.log、appointment-review-browser.log，通过待处理、改约、来源链、原键复用及诊所取消闭环。

Given停诊班次上的SCHEDULED旧约、当前前台权限及核实患者处理意向的可信依据，When选择满足当前任职/执业、全部原期望项目必需资质、有效时隙及占位的NORMAL目标，Then旧约CANCELLED/CLINIC_RESCHEDULE，新约同患者SCHEDULED且rescheduled_from_id指旧约。新建ID由服务器产生，来源唯一，无客户端跨患者/环入口。以原CANCEL和BOOK记录两端事实，不新增RESCHEDULE事件类型。对应AC-UC01-S5-01/04。

Given暂无合适新位，When保留待处理，Then旧约不变，不创建新预约；患者核实不再安排时，CLINIC_CANCEL分支保存原因且无新约/目标字段。Given目标冲突、资格失效或任一步写入失败，When提交，Then旧取消、新建立、期望项目与备注复制、来源链、两端事件、审计和回执整体回滚。并发最多一个目标有效占位，失败方旧约仍待处理。对应AC-UC01-S5-02/03。

锁前确定新旧医生/班次/旧预约的完整集合并升序取得，锁后复核；患者锁先于治疗目录锁，与预约提交保持一致。目标排除本次替换的旧占位，其他有效历史占位保留。提交使用当前受保护患者资料与当前服务器过敏核验依据，不复用过期自助声明。

Web独立停诊处理页面、待办队列、候选筛选、患者意向及新旧来源展示；候选筛选项目由前台按原约确认，实际保存沿用并复核原预约全部期望项目。诊所取消不混为PATIENT_CANCEL/NO_SHOW。相关前端证据见database/appointment-review-web-{tests,types,build}.log。最初失败日志保留：夹具清理中的自引用RESTRICT已按隔离库清理顺序修正，没有关闭或改变正式外键。

原Word、Spec、Plan、Constitution、19表/163字段/30业务外键和全部批准契约保持不变。
