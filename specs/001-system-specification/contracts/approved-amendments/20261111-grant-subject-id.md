# ADC-CONTRACT-20261111-01

负责人回复：“批准这一处类型修正”。原审批记录保留，追加本修正记录。

唯一源变更：openapi.json中GET /identity/grants查询参数subject_id的schema由业务BIGINT的Id引用改为`{"type":"string"}`，与既有Subject UUID及GrantCreate.subject_id一致。没有改变路径、参数名、数据库、业务规则或其余接口。精确指针及变更前后SHA-256见同名JSON。

双端共享DTO及其构建产物同步；生成工具追加对本批准修正的链式指纹校验，不解除其余冻结输入校验。实际标准校验、7项契约测试、生成/漂移检查及构建均通过，日志见docs/verification/database/contract-amendment-*.log。授权模块的真实数据库及浏览器结果见docs/verification/stories/clinic-grants.md。
