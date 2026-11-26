# SF03 员工账号批次

2026-11-11，ADC-TASKS-20261111-03：T017/T018工程验收。创建、启用、停用、凭据恢复和列表均沿用既定API，返回SubjectView最小投影；不添加业务字段或牙医记录，不自动赋权。

实际证据（docs/verification/database）：staff-accounts-bootstrap.log记录账号API与初始化范围/拒绝重复；accounts-browser-and-regression.log记录启动3项、真实MySQL共享事务7项、账号5项及浏览器执行器1项通过；authentication-browser.log记录5项真实HTTPS浏览器测试通过，包括总部建号、设置凭据、普通员工拒绝管理、启停和旧会话拒绝。staff-page-tests-final.log记录11项前端测试通过，staff-page-types-final.log及staff-page-build-final.log记录类型/构建通过。

Given有account.manage的总部且已核实员工身份，When建号，Then只产生独立Subject/StaffAccount，未设置口令前不能登录，没有自动岗位或诊所权限。Given其他岗位或已撤权主体，When管理账号或重放旧键，Then拒绝。Given有效核验与恢复依据，When设置凭据/启停，Then旧会话失效，历史保留，秘密不进入回执或审计。Given两个总部同时建立相同用户名或审计写入失败，When提交，Then至多一个合法结果，失败无孤立主体或部分修改。对应AC-SF03-01、AC-SF03-02。

凭据恢复的回执内容摘要使用服务端HMAC，避免普通快速摘要暴露低熵口令猜测依据。多主体操作在认证前按稳定Subject顺序取锁。满载连接池的并发拒绝审计在audit-pool-red.log真实复现；修复后staff-accounts-and-audit-final.log及accounts-browser-and-regression.log均通过：原业务回滚后，复用已完成连接提交独立短审计事务，成功命令仍保持业务/审计/回执同事务。

初始化入口与条件见ops/runbooks/headquarters-bootstrap.md。实际组织凭据、实际管理员初始化未执行；测试全部使用可丢弃MySQL及虚构员工。本批完成时API、Spec、Plan、Constitution及业务设计保持原样；下一批最初仅提出授权列表subject_id类型问题，后获负责人明确批准，修正记录为ADC-CONTRACT-20261111-01，原审批历史保留。
