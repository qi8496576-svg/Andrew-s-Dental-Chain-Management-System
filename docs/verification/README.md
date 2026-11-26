# 实施验证与证据约定

本目录保存真实执行结果。每项任务只有在自身验收条件满足后勾选；工具链验证不替代业务、真实微信、性能或恢复验收。历史记录保留原时点结论，最新结果通过独立任务报告追加。

## 测试分层和隔离

- JUnit 单元测试使用 `*Test`，真实 MySQL 集成测试使用 `*IT`，由 Maven Surefire/Failsafe 分别执行。Docker 不可用应失败，不跳过后宣称通过。
- `MySqlFixture` 仅位于 test 源集，创建并拥有随机凭据、随机宿主端口、禁止复用的 MySQL 8.4 容器，不接收外部 JDBC URL，不连接 Compose 持久卷。try-with-resources 确保回收。镜像摘要与 T002 相同；UTC、InnoDB、大小写敏感配置不变。
- `adc-fictional.json` 为测试对象/场景描述，不是完整数据库种子或可直接插入的行。正式迁移及结构验收在 T043；后续故事应先通过真实流程或专用测试装配器建立完整前置事实，再断言数据库后置事实。不能将标着 INVOICED 的视图对象当作已真实开票证据。
- 数据包括虚构患者、独立 STAFF 主体及四岗位、明确诊所范围、三种过敏核验状态、五预约状态及四取消分类。前台/收费/总部不伪造 Dentist 行。fixture 元数据不是新增业务字段。
- Vitest 验证组件和交互；Playwright 每测试使用独立 browser context，禁止共享会话或依赖测试顺序。`tests/e2e/fixtures.ts` 每次返回数据深拷贝，绝不自动登录或向远端注入数据。未提供真实授权会话的夹具不能作为权限测试成功证据。
- 小程序必须另行执行开发工具和真机验证。所有数据为虚构；不保存 AppSecret、session_key、Cookie、Bearer、真实病历或身份凭据；截图/trace 同样检查。

## 单项验收证据格式

每条原 AC 独立记录，字段与 `tests/e2e/fixtures.ts` 的 AcceptanceEvidence 一致：

| 字段 | 记录规则 |
| --- | --- |
| acceptance_id / task_id | 引用既有 AC / T 编号，不另造业务验收编号 |
| given / when / then | 原验收的前置、触发及可检验后置事实 |
| steps | 可复现命令或操作顺序，标明失败注入方式 |
| expected / actual | 分别记录预期与实际，实际必须有证据 |
| result | PASS、FAIL、NOT_RUN、BLOCKED；未运行不得填写通过 |
| environment / versions | 系统、浏览器/微信基础库、工具和镜像摘要、配置版本 |
| fixture_sha256 | 数据集文件指纹，测试变体需一并归档 |
| verified_by / executed_at | 实际核验者与带时区时间；自动执行可写 Codex/脚本，不代签负责人 |
| artifacts | 日志、测试报告、数据库断言或脱敏截图的相对路径和文件指纹 |

校验人不等于审批人。Q03 性能与 Q05 恢复必须满足原环境/数据量和测量条件；本地冒烟不能冒充达标。测试中保留原请求键验证重试，失败或未知结果不得伪记成功。

Windows 的 Node、Maven 缓存、临时目录和容器数据均沿用 D 盘配置。构建生产包后还应检查测试夹具和辅助类不在运行 JAR/前端产物内。
