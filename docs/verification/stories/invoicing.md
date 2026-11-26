# UC04 结算就诊（T041/T042）

实际完成证据于2026-11-14登记；复用本批已完成测试，不重复运行。真实MySQL见database/invoicing-mysql.log（4项）、invoicing-integrity.log（3项及金额领域测试）、care-fees-read-audit.log（结算损坏合计/失败读取审计1项、临床失败读取审计1项），均BUILD SUCCESS。真实HTTPS浏览器见invoicing-browser-wrapper.log及invoicing-browser.log（1 passed），页面权限测试、类型检查及生产构建见invoicing-web-{tests,types,build}.log。

Given有效COMPLETED且有实际项目的就诊，When当前诊所授权收费核定结算，Then生成唯一Invoice及逐项冻结费用凭据，1.50×10.01=15.02，真实免费项目保留0.00，总额逐项求和；同键重放、不同键重复及两收费并发均返回原单，仅一组费用明细/INVOICE事件。对应AC-UC04-01、02、03。

Given非法阶段、没有实际项目或损坏的跨就诊关联/费用合计，When结算或读取，Then拒绝。Given实际SQL触发器分别令凭据头、第二行、状态及事件失败，或审计写失败，When结算，Then全部回滚，不留下半单。对应AC-UC04-04、05。

Given已生成凭据，When目录改名或调价，Then历史名称/数量/单价/金额不变，临床改价被拒绝。真实浏览器在服务端实际提交后中断响应，验证未知结果可按原键查询和重试取回原单；没有以模拟成功替代真实数据库提交。

读取最小费用投影；收费需当前getInvoice及诊所范围，总部需另授getInvoice来源读取，普通医生不能结算。总部getInvoice能力注册与现有获批操作对齐，未扩大初始化默认授权。撤权后页面清除明细，失败敏感读取留失败审计。INVOICED仅为已结算；未加入付款、支付渠道、税费、折扣或退款。原业务数据库、Spec、Plan、Constitution与API契约未修改。
