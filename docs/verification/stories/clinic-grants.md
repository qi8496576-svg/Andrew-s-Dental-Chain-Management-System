# SF04 诊所授权批次

2026-11-12，ADC-TASKS-20261111-03：T019/T020完成。总部按当前authorization.manage授权建立/撤销岗位、能力、诊所及有效期；服务端验证现有员工/诊所、牙医关联及可授期限。列表不暴露超出管理范围的整条授权，撤权保留历史，不自动产生员工或业务记录。

实际证据位于docs/verification/database：clinic-grants-20261112-retry.log记录4项真实MySQL测试通过；新增并发互相管理、审计故障全回滚、恰好过期边界后，clinic-grants-extended-final-20261112.log记录7项真实MySQL测试、0失败/错误/跳过及BUILD SUCCESS。新增过期夹具最初违反原有效期CHECK，已修正为起点早于终点的真实过期区间，保留extended日志，不放宽数据库约束。clinic-grants-final.log记录AuthenticationBrowserIT通过，authentication-browser.log记录对应1项真实HTTPS浏览器闭环通过。后一命令在随后启动另一数据库测试期间中断，没有完整Maven成功结尾；因此另行补跑上述数据库测试，不把中断命令记为整体成功。clinic-grants-20261112.log保留本次Docker未启动的失败，恢复D盘既有Docker后重试通过。

clinic-grants-page-tests.log记录13项Web测试通过；clinic-grants-page-types.log及clinic-grants-label-build.log分别记录类型检查和最终构建通过。浏览器曾发现岗位下拉框可访问名称不明确，已修正label关联，保持原验收断言；最新浏览器闭环通过，截图为docs/verification/clinic-grants.png。此前其他5项浏览器结果复用accounts-browser-and-regression.log中的成功批次，不将旧结果冒充本次新运行。

Given总部当前具有授权管理能力及有效诊所范围，When为现有员工建立合法岗位授权并复用同键，Then仅保存一次且已有会话下一请求立即获得对应能力。Given范围、期限或岗位关联不合法，When提交，Then拒绝且无部分授权。Given授权已撤销，When原会话继续使用该能力，Then立即拒绝；授权历史仍可追踪。Given管理者撤销自己的管理授权，When再次重放，Then按当前权限拒绝。对应AC-SF04-01、AC-SF04-02；UUID筛选另覆盖获批契约修正。

唯一契约变更为ADC-CONTRACT-20261111-01：GET /identity/grants的subject_id查询schema改为string，负责人原回复“批准这一处类型修正”。契约7项测试、81操作标准校验、双端DTO生成/漂移检查及构建通过，见contract-amendment-*.log。原审批登记及其他冻结业务输入不改写；真实员工初始化、微信及生产发布不在本批验收范围。
