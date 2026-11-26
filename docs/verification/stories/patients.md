# UC05 患者资料批次

2026-11-12，ADC-TASKS-20261111-03：T021/T022完成。前台实际诊所服务、本人核验、建档/按编号及生日检索、更正、过敏三态和更正撤销核实链已接入真实后端；小程序仅按服务器当前绑定读取本人档案。无电话自动合并、自助改档、患者诊所所有权或新增业务表/字段。

负责人批准ADC-CONTRACT-20261112-02：补齐lookupPatient及建档核验上下文；原81个操作保留，合计82个。前后指纹及范围在contracts/approved-amendments/20261112-patient-lookup.json，原审批不改写。双端共享DTO同步，当前契约标准/载荷/漂移检查和9项契约测试见patient-contract-*-final.log。

真实证据（docs/verification/database）：

- patients-final.log中的PatientsIT为9项通过，BuildSmokeTest为3项通过；该命令整体最初因浏览器夹具误用了GrantCreate字段而失败，不记为整体通过。修正夹具为原role/clinic_ids后，patients-browser-retry.log真实浏览器通过。后续完整严格JSON回归patient-json-http-browser-final.log记录4项单元/启动检查、1项真实HTTPS浏览器执行器及1项认证HTTP验收通过，BUILD SUCCESS；patients-browser.log记录对应1项真实页面闭环通过。
- patients-lock-order.log记录8项患者和7项共享事务真实MySQL测试通过。最初患者创建额外命名锁与请求锁的排序冲突已在真实运行中复现；现一次声明全部命名锁后按原固定顺序获取，不放宽锁序校验。外层患者事务同时包含资料、可信审计、最小回执及必要返回投影读取。
- patients-page-tests-final.log记录16项Web测试通过；小范围传输修复后patients-transport-and-page-final.log记录6项受影响测试通过。patients-page-types-final.log及patients-page-build-final.log为类型检查/构建通过。对话框改为直接导入所用组件，避免整包动态转换导致的测试启动超时，没有提高超时或放宽断言。
- patients-mini-tests.log记录7项SDK/传输测试通过，其中2项新增本人读取/旧请求隐私回填保护；patients-mini-build-final.log记录3页编译与资产检查通过。真实AppID未配置、微信开发工具及真机未验，留待T051；不以SDK测试宣称真实微信已通过。

Given资料完整且授权前台已核实实际服务，When建档/重复原键提交，Then只建立一次并返回患者编号；同电话不同患者可分别存在，疑似重复必须人工复核留因。Given无服务范围、错误编号/生日、他人/其他患者的核验引用或失效本人绑定，When读取/更正，Then拒绝且不泄露匹配详情。Given尚未核实/询问无已知过敏/有效关联，When保存核实结果，Then分别保留NOT_REVIEWED/NO_KNOWN/RECORDED；空关联不自动推无过敏。Given已有过敏记录，When更正或撤销，Then保留旧新值、可信核验人/时间/原因/引用，最后一项撤销后回到NOT_REVIEWED。对应AC-UC05-01—04。

两个真实连接的同版本更正至多一个成功，另一个412；审计不可写时建档/更正全部回滚。成功回执只存Patient引用及最小结果，不复制完整患者档案/临床备注；HTTP请求摘要使用服务端HMAC。过敏确认引用依据当前风险状态和成功核验审计生成，风险变化后旧引用不再匹配，未核实状态不签发确认引用。

真实浏览器覆盖建档→编号/生日核验→无已知过敏→新增→更正→撤销→资料更正→总部撤权→原会话立刻拒绝并清空患者界面→退出；无API模拟。实际截图docs/verification/patients.png已检查。严格JSON测试真实复现默认标量强制转换，现按既有契约拒绝数字ID、字符串布尔和非法整数转换；未增加或改变接口类型。

为页面选择真实过敏目录，已提前实现T023中既有listAllergy的最小只读部分，真实MySQL验证权限、有效目录及停用后禁止重新新增；T023的其余组织资源工作尚未完成，不勾选T023。Spec、Plan、Constitution、原Word/ERD及19/163/30基线不变。
