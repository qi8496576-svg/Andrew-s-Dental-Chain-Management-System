# T005 共享契约工具验证

2026-11-10，状态 PASS（工具与类型范围）。冻结的 OpenAPI 3.1.1 原文件及其他31项批准输入保持原指纹，没有修改接口或业务定义。

- Swagger Parser 13.1.0 完成标准和引用校验；Ajv 8.20.0/ajv-formats 3.0.1 编译全部81组件Schema与81个操作的请求/响应校验器，并核对操作目录及需求/验收导航。
- openapi-typescript 7.13.0 生成81个操作的共享类型；内存重新生成与提交文件逐字相同，源文件指纹守卫和漂移检查通过。
- 6项Node边界测试通过：超安全整数ID保持字符串、金额/单位数精度、请求键与If-Match、全部操作错误信封及额外字段拒绝、非法日期/字段拒绝、已文档化错误码与HTTP状态区分。TypeScript断言ID/Money/UnitPrice/Units/请求键为string。
- 管理端和小程序均通过本地 @adc/contracts 使用同一份声明，npm ci、类型检查、构建各3步均通过；导入仅类型，不把Node校验工具打包进小程序。

两个前端的 package.json/package-lock.json 及类型入口因本任务增加共享包依赖；T003/T004报告保持其任务完成时点的历史指纹，当前指纹以本任务 t005-validation.json 为准。

工具检查不替代后端条件CSRF、可信身份、对象授权、事务、幂等、金额计算或真实微信验收。冻结Schema的错误code为string；行为文档未给出HTTP状态的代码只记录未映射，不擅加映射或改成封闭枚举。

复现：先执行 tools/verification/Verify-Contracts.ps1，再在两个前端分别 npm ci、npm run typecheck、npm run build（使用D盘工具链、缓存和临时目录）。全部输出见 t005-build-result.json、t005-consumers-result.json、t005-contract-coverage.json 及 t005-*.log。任务共186项，仅新增T005完成标记；内容和依赖不变。
