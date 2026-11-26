# ADC 共享传输类型与契约工具

唯一接口源：`specs/001-system-specification/contracts/openapi.json`（OpenAPI 3.1.1）。校验时比对实施授权清单中的 SHA-256；未经批准的源变化直接失败。生成器只写本包 `src/generated.ts`，声明文件输出到 `dist/generated.d.ts`。管理端和原生小程序通过本地 `@adc/contracts` 包使用同一份类型，不复制业务规则。

按顺序运行 `npm ci`、首次 `npm run generate`、`npm run verify`。后续验证不自动覆盖生成文件：`check:drift` 在内存重新生成并逐字比较，差异会失败。需要重新生成时先确认源变更已批准。

校验内容：Swagger Parser 对 OpenAPI 3.1 标准与引用检查；Ajv 2020 对全部组件和 81 个操作的 JSON 请求/响应 Schema 编译；路径/operationId/需求/验收与操作目录对应；写请求声明的 Idempotency-Key、If-Match 校验；错误信封与 api.md 中已明确的 HTTP/错误码对应；ID/DECIMAL 精度边界、额外字段、无效日期反例。工具不将客户端提交的主体或业务状态视为可信，不执行后端状态转换。

错误码在冻结 Schema 中为 string；行为文档未指定 HTTP 状态的代码返回“未映射”，不自创映射或缩窄成新的封闭枚举。Cookie/WECHAT 的条件 CSRF、有效身份、当前授权、事务及幂等行为必须在后续服务端任务实测，不能由当前 Schema 校验代替。

工具版本：Swagger Parser 13.1.0、Ajv 8.20.0、ajv-formats 3.0.1、openapi-typescript 7.13.0、TypeScript 5.9.3；锁文件固定传递依赖。参见 [Swagger Parser 官方实现中的 3.1 支持](https://github.com/APIDevTools/swagger-parser/blob/main/lib/validators/schema.js)、[openapi-typescript Node API](https://openapi-ts.dev/node)。

Windows 可从项目根运行 `tools/verification/Verify-Contracts.ps1`；首次生成可加 `-Generate`。使用已有 D 盘 Node/npm 工具链。该脚本验证共享包，双方消费端的类型检查与构建另记录于 `docs/verification/t005-consumers-result.json`。所有记录是工具/类型验证，不是业务或真实微信验收。
