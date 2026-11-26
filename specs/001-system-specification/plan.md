# Implementation Plan: Andrew's Dental Chain 系统级实施规划

**状态**：当前64项任务完成。首次本人登记、微信与云端联调、自动化易用性检查、性能测试及恢复演练均有对应验收证据。

**Branch**: `001-system-specification`（Spec Kit 功能标识；本工作区无 Git 仓库，未创建实际分支） | **Date**: 2026-11-07 | **Spec**: [spec.md](spec.md)

**Input**: 已完成 Clarify 的系统级 Spec、Constitution 3.0.0、当前正式Word 及正式模型；本轮用户确认 Windows 开发，可结合 WSL2/Docker Desktop，最终 Linux 云服务器 + Docker。

**Status**: 已批准并持续实施；当前业务、部署及质量证据见tasks.md。质量验收采用负责人已确认的Q01组织方式、Q03小规模部署标准及TD-01一期不自动删除策略。原审批指纹保留为对应历史版本的记录。

## Summary

ADC 以“预约→到诊→实际诊疗→费用凭据→季度个人绩效”为主链，覆盖 UC01—UC08、UC01 五场景、SF01—SF04、Q01—Q09 和 R1。首版采用模块化单体统一后端，原生微信患者端及 Vue 员工后台共用 REST 契约，所有资质、状态、金额、分摊及对象授权在服务端执行。

技术方案为 Java21 / Spring Boot4.1.2 / MyBatis Starter4.1.0 / MyBatis核心3.5.19 / MySQL8.4。业务库保持获准的24表、209 字段、44 外键；技术存储采用 adc_identity（含请求回执与迁移历史）和 adc_audit 两个 schema，与原 adc_business 同实例；三个 schema 共用事务连接保证规定事实与审计完整提交。原始 Word、正式模型、Constitution 及 Spec 不因本 Plan 被覆盖。

患者端支持首次本人登记免人工核验、已有档案安全关联，以及当前有效关联后的预约/取消；管理后台面向总部、诊所管理员、牙医和其他授权员工。“医生”沿用原牙医语义，“诊所管理员”使用已获授权的岗位能力与诊所范围，不从称谓推导跨诊所、资源维护、成本核验、发布或账号授权权限。结算生成费用凭据和独立诊疗待缴账单，INVOICED不表示已付款；本轮提供受控演示缴费和全额退款，不扣真实款，不改变R1。

研究决定、备选及官方来源见 [research.md](research.md)。本轮没有需要猜测答案的业务或技术决策；C-03保留必要工具验证；真实微信配置/联调、云资源、性能及恢复演练已转后续实施/验收工作。

## Technical Context

| 项目 | 选定方案与约束 |
| --- | --- |
| Language/Version | 后端 Java21 LTS；前端 TypeScript5.9.x；构建 Node24 LTS 且≥24.12；SQL 保持 MySQL8.4 语义。精确补丁及镜像 digest 在首轮实现中锁定并留版本清单。 |
| Primary Dependencies | Spring Boot4.1.2、MyBatis Starter4.1.0（MyBatis-Spring4.1.0、MyBatis核心3.5.19）、Spring Security（随 Boot BOM）、Connector/J（随 BOM）、Flyway及其MySQL模块（同BOM版本）；Vue3.5.x、Vite8.3.x、Vue Router、Pinia、Element Plus2.x；原生微信API类型。Maven3.9.16、npm/package-lock。 |
| Storage | 单主 MySQL8.4 LTS/InnoDB；adc_business 恰24表/209字段/44FK；adc_identity 13张技术表（含 RequestReceipt、flyway_schema_history），adc_audit 1张 AuditEvent；不创建 adc_control/adc_meta 物理库。新增19条纯技术FK，身份技术存储不增加到业务库的物理FK；完整定义见 technical-data-model.md。 |
| Testing | JUnit Jupiter/Testcontainers 随 Boot BOM，MySQL8.4真实集成；Vitest5.x、Playwright1.x、k6 1.x；微信开发者工具及真机；契约/结构及全字段指纹检查。 |
| Target Platform | Linux x86_64 云服务器、Docker Engine+Compose；Windows可用WSL2 engine的Docker Desktop运行Linux数据库与测试容器，微信开发者工具在Windows宿主。 |
| Project Type | 两个前端+一个统一业务后端；身份独立组件在同一部署单元，应用/领域/持久化职责分离，报表为授权只读投影。 |
| Performance Goals | 30诊所、100牙医、1万患者、10万预约、20万治疗。隔离Linux容器合计CPU上限2核、内存上限2GB，独立负载进程；10并发持续20分钟，每用户约2秒一次请求，候选检索/治疗保存/结算占60%/20%/20%。另在现有2核2GB云端执行5并发5分钟只读验证。隔离测试不少于5000次实际成功请求，各类P95≤3秒，非预期错误率<1%，配比误差≤0.5个百分点；云端不少于600次只读请求，P95≤3秒且错误率<1%。保存原始样本、资源和落库核对，不推断100并发或云端大规模写入容量。 |
| Reliability/Security | Q05每日全备/15分钟增量/30天保留，RPO≤15分钟/RTO≤4小时；Q06空闲30分钟/绝对8小时、5错限15分钟、撤权后下一请求拒绝；审计保留1年。 |
| Constraints | 五就诊状态/四取消分类；先到诊再治疗、有有效项目才完成、唯一开票；R1个人净利润非负部分10%；原始数据字典和历史证据不漂移；只用虚构开发数据。 |
| Scale/Scope | 原15家诊所背景、约30家扩张目标；全部八用例和身份支撑，不把系统级规划缩成某个单功能MVP，不预设原文没有的高可用率或多租户产品范围。 |

Java21、Maven、Docker Desktop Linux容器及Testcontainers已实际用于构建和测试；当前依赖版本与运行结果见docs/verification/build-environment.md、任务验证及各专题证据。工具存在不代替对应质量验收通过。

## Constitution Check

下表保留原设计阶段的门禁记录。当前实现和运行结果见tasks.md；最新质量条件及其证据以本文、Spec和现行宪章为准，历史阶段的通过不代替当前实测。

| 原则/门禁 | Phase0 前 | Phase1 后 | 对应设计与验收证据要求 |
| --- | --- | --- | --- |
| I 原始需求与追踪 | PASS：Spec及来源关系完整 | PASS：计划、契约及模型延伸同一追踪链 | [追踪矩阵](traceability.md)、下方覆盖表；新接口操作不重编UC/SF，按明确授权同步当前原件。 |
| II 业务、身份与权限 | PASS：八UC/五场景/R1/SF规则固定 | PASS：命令式接口、每请求对象授权、绑定一对一和独立发布 | [API契约](contracts/api.md)、[身份契约](contracts/identity.md)；非法迁移/越权/缺成本发布皆失败。 |
| III 24表/金额/历史 | PASS：字段索引24/209/44明确 | PASS：完整字段镜像、稳定锁实现条件约束、已批准的三项可空调整、医生三字段和五张费用表 | [数据模型](data-model.md)、[原Word逐项审核](business-baseline-audit.md)、[独立技术模型](technical-data-model.md)；字段表核对一致，MySQL约束及故障结果按对应实施任务证据判定。 |
| IV 双端/分层/Linux部署 | PASS：用户本轮重申 | PASS：小程序+Vue→统一后端，普通领域对象+映射器，Docker部署路径 | 本计划模块及目录、research R-D01/05/06、quickstart；不预建微服务或用前端判业务成功。 |
| V 自动验证/事务/安全 | PASS：Q阈值及必测范围已定义 | PASS：真实MySQL集成、请求回执+行锁、跨schema审计原子性及统一恢复点 | quickstart中并发/故障/权限/恢复步骤；未执行不标为通过。 |
| VI 顺序/Clarify/实施审核 | PASS：Clarify 2026-11-07 1问1答 | PASS：只生成Phase0/1设计，不生成Tasks/业务代码/部署文件 | 下一步Tasks→Analyze→负责人明确审核才Implement；本Plan技术基线已正式批准，后续阶段等待负责人指令。 |

## Project Structure

### Documentation (this feature)

```text
specs/001-system-specification/
├── spec.md                       # 原系统级规约与Clarify记录，本轮保持
├── traceability.md               # 需求追踪，补充本轮设计定位
├── plan.md                       # 本文件，已批准技术基线
├── plan-approval.md              # 批准记录与后续工作承接
├── plan-approval.json            # 批准前/状态修正后的文件指纹
├── research.md                   # Phase0研究/备选/来源/决策
├── data-model.md                 # 24表全字段和约束/独立组件边界
├── quickstart.md                 # 环境及端到端验证指南
├── business-baseline-audit.md     # 原Word逐表/209字段/44FK与唯一约束审核
├── business-baseline-audit.json   # 直接读取原Word的机器核对结果
├── technical-data-model.md       # 14张实际技术表、键、引用、独立技术ERD
├── technical-schema.json         # 技术表字段/键/19技术FK/应用引用
├── plan-supplement-review.md      # 本次审核问题、处理结果和门禁
├── diagrams/                     # 独立技术ERD及存储边界图
├── contracts/
│   ├── api.md                    # 行为/权限/事务/错误/数据传输契约
│   ├── identity.md               # 微信/员工会话、绑定、授权和审计
│   ├── operations.md             # 全部HTTP操作及需求/验收导航
│   └── openapi.json              # OpenAPI3.1.1机器可读HTTP契约
└── checklists/requirements.md     # 原Spec质量清单，本轮不改写
```

当前任务及依赖见tasks.md，完成状态以真实证据为准。

### Source Code (repository root)

以下为当前实现布局，构建文件、源码与Compose入口已建立；实际运行与验收按tasks.md及对应证据判定。

```text
backend/
├── pom.xml                       # 当前构建/锁版本入口
├── mvnw / mvnw.cmd
└── src/
    ├── main/java/com/adc/
    │   ├── interfaces/           # HTTP、DTO、角色投影，不能直接改业务状态
    │   ├── application/          # 用例、授权、事务和幂等编排
    │   ├── domain/               # 患者/资源/排班/预约/诊疗/开票/成本/绩效规则
    │   ├── infrastructure/       # MyBatis映射器、时钟、微信适配、存储实现
    │   ├── identity/             # 独立身份/会话/本人绑定/授权模块
    │   └── audit/                # 可信审计接口及同事务持久化
    ├── main/resources/
    │   ├── mappers/
    │   └── db/migration/         # 未来迁移，历史表落adc_identity.flyway_schema_history
    └── test/                    # unit、contract、integration分层验证
apps/
├── admin/                       # Vue管理后台，按已授岗位/诊所呈现
└── patient-miniprogram/          # 原生微信TypeScript小程序
packages/contracts/              # DTO/枚举类型；无领域计价或授权实现
tests/
├── e2e/
└── performance/
ops/
├── compose/                     # 未来dev/prod Compose及秘密挂载说明
├── backup/                      # 未来全备、日志归档、隔离恢复工具
└── runbooks/
```

**Structure Decision**：一个后端应用组织业务模块，前端独立构建。独立 schema 表达身份/审计职责，不要求独立服务；后续源码可在独立开发检出中创建，不能为了WSL便利移动或覆盖当前原始资料目录。

## 业务模块、事务与依赖

| 模块/边界 | 服务端职责及数据 | 必须先具备 |
| --- | --- | --- |
| 身份及可信上下文 | SF01—04；会话、当前绑定、账号、角色/诊所/期限，每请求复核 | 初始化受控账号，配置微信适配器和独立存储 |
| 资源/患者 | UC06组织/资质/执业/治疗/过敏；UC05患者与过敏核实链 | SF角色/对象权限、审计；目录/患者分工不混同 |
| 排班 | UC02正常时段/完整粒度/跨诊所冲突/挂起及影响清单 | 有效执业/资质与稳定Dentist锁 |
| 预约 | UC01-S1—S5；候选、BOOK/ATTEND/CANCEL、停诊来源链 | 正常班次、核实患者/本人绑定、幂等/事件事务 |
| 诊疗 | UC03实际实施者/治疗日资格、历史价/小计、完成事件 | 到诊、目录、授权及至少一项有效诊疗 |
| 费用凭据 | UC04唯一单、逐项历史快照、INVOICE | COMPLETED、有效诊疗/金额/同就诊归属；不等付款 |
| 成本及绩效 | UC07成本来源/冲销/封账和零成本证据、R1来源冻结/计算/独立发布 | 当季收入、成本核验、人员/有效分钟；不足存INCOMPLETE |
| 只读分析 | UC08队列/期间/截止/版本/分子分母及敏感下钻 | 原业务事实；绩效仅当前PUBLISHED；不写统计新业务表 |

### 事务与锁协议

1. 每个写请求先按可信主体/操作/Idempotency-Key取得技术互斥，再在单连接显式事务内复核当前身份和授权、读取回执、核对规范化请求摘要。相同输入返回原对象，异内容409；回执返回前同样验证当下访问权。成功回执重放先于首次执行的If-Match/业务前置检查，原If-Match纳入请求摘要；不能让已提交的同键重试因ETag改变误报412。
2. 先按subject_id升序锁可信身份主体及相关授权/会话记录；SF02再锁Patient稳定行和当前映射，完整规则见technical-data-model.md。业务对象锁在身份锁之后：锁需要的稳定 Dentist（升序），再锁班次（升序），再锁就诊（升序），最后明细/结果。UC02/资质/执业变更也必须遵循；UC03实际牙医不同于预约牙医时先取齐牙医锁再锁就诊。新增锁需求发现后重启事务，禁止临时反向取锁。
3. 创建预约锁目标班次重新查当前有效占位，保存Appointment、期望治疗、BOOK及审计/回执。NORMAL起点条件唯一及不重叠在稳定牙医锁范围检查，不借新增列或错误全局唯一实现。
4. 到诊/取消/爽约锁定就诊并复核班次、旧状态及服务端时点；停诊改约锁新旧班次和旧就诊，原子旧取消、新预约、来源及两端事件，失败保留待处理。不同请求并发到诊与爽约保留先提交合法结果。
5. UC03只在IN_PROGRESS追加实际项目；完成检查有效项目并原子COMPLETE。UC04锁就诊，已有单据返回原单，否则原子Invoice/Item/INVOICED/INVOICE/审计，任一失败全回滚。
6. 成本确认凭证不可覆盖，冲销同归属/类型、等额负值、唯一原凭证引用。冲销必须有经核验的发生时点及新来源编号/批次，不能静默复制原发生时点或以当前时间代替；按原成本发生时点归季规则处理。季度封账/零成本/人员及分摊确认保存在原QuarterlyPerformance.source_snapshot，不另外建季度封账业务表；原CostEntry允许的零额凭证注明确认范围。
7. 季度资料准备、计算、发布是独立操作。准备形成DRAFT的冻结证据；计算按相同输入摘要复用版本或新输入新版本。没有准备/封账时也可形成INCOMPLETE并说明原因，不能假造全零。定时触发按Asia/Shanghai前一自然季度，确定性请求键防多实例重复；停机补触发复用同键，不做自动爽约。
8. 首次和替换发布均先锁稳定Dentist再锁季度结果，检查R1、人员、来源/守恒/金额及发布权限，同事务旧SUPERSEDED/新PUBLISHED/审计；不能只锁尚不存在的旧发布结果。
9. 写入READ COMMITTED，关键条件当前读；所有异常回滚，避免自调用绕过事务。命名锁必须在afterCompletion或显式提交/回滚后释放、再归还同连接；连接断开或锁释放异常时不复用污染连接。

资料截止使用服务端支持的一致来源快照或已冻结版本；不能把当前状态冒充任意历史cutoff。无法按请求截止重建所需证据时拒绝该比较或标记来源不足，不静默换现值。工作日计算采用经核对的年度法定节假日日历配置并记录版本/来源，不建立新的日历业务表，不在本轮编造具体节假日。

### 接口及客户端边界

[api.md](contracts/api.md) 定义用例操作、请求字段、角色投影、错误及精确金额；[openapi.json](contracts/openapi.json) 为机器可读形式，[identity.md](contracts/identity.md) 约束真实登录、会话与授权。入口统一 `/api/v1`；不提供任意状态或任意表更新接口。所有业务命令用Idempotency-Key，关键资源修订可用由现有字段计算的ETag/If-Match防并发覆盖，不新增version字段。

小程序patient_id来自当前绑定；前台代办必须有当前授权和可校验核实依据。牙医实施者来自可信员工身份，不接受客户端任意指定收入归属者。治疗价格来自目录，只有单独授权的开票前纠错命令可处理历史价；普通诊疗请求不收单价。收费只返回结算必要字段，总部汇总不默认披露临床全文。

### 部署、配置、备份及观测

开发使用Linux MySQL容器以避免表名大小写差异；Windows原生JDK21/Maven或WSL均可连接。生产反向代理暴露HTTPS，后端/MySQL内网，迁移以单次受控作业执行、校验原字典，不由应用启动自动改表。镜像非特权运行、持久化目录显式、健康检查区分存活与依赖就绪；秘密注入及日志脱敏见research，配置错误/身份不可验证时拒绝受保护操作。

当前云端使用2核2GB主机运行联调服务。Q03以合计2核2GB上限的隔离容器测试完整数据规模及真实写入，再验证实际云端低负载只读访问；不挤占云端业务库执行大规模写入，不购买或升级资源。资源分配、网络路径、存储及工具版本在实测报告中逐项记录。

应用记录可信request_id、用例/动作、结果码、耗时、冲突/回滚/幂等复用及版本；不记录密码/token/AppSecret或无关完整临床资料。审计是持久化业务证据，不以普通服务日志替代；健康/指标端点只向运维网络开放。告警覆盖服务错误、数据库空间/连接、备份失败/日志归档滞后及恢复链缺口。

备份同实例所有相关schema共用一致快照+binlog坐标，归档跨度≤15分钟，保留30天可恢复链，审计在线保留1年。配置/秘密的恢复包独立加密保管，按共同版本恢复；不把30天备份策略解释成删除1年前审计。恢复隔离演练记录真实丢失跨度和恢复耗时，逐项核对金额、绑定旧失效/新唯一、账号/授权、状态事件及发布版本。恢复后生产会话可统一撤销并重新登录，不让旧失效凭据因回档重新获得访问。

## 验证与需求覆盖

| 需求 | 设计定位 | 后续验证必须覆盖 |
| --- | --- | --- |
| FR-001—005 / UC01五场景 | 预约模块、API预约/到诊/取消/爽约/改约命令 | AC-UC01全部；全部非法迁移、竞态、同键异内容、停诊失败全回滚；原分类/来源链不变 |
| FR-006 / UC02 | 排班/稳定Dentist锁、NORMAL谓词 | 跨诊所重叠与相邻、首次并发班次、被引用不可变、挂起不自动取消 |
| FR-007 / UC03 | 诊疗实体及资质/目录映射 | 本人实施、不同预约牙医、零价/无服务、历史价、逐项HALF_UP、完成后不追加 |
| FR-008 / UC04 | 唯一开票聚合与事务 | 多请求唯一单/每治疗一行、故障注入、原单重返、非付款语义 |
| FR-009—010 / UC05—06 | 患者/资源、历史证据及ETag | 必填/过敏三态/撤销核实链、电话不合并、目录调价历史不变/未来影响 |
| FR-011、023 / UC07、R1 | 原成本/绩效表、冻结快照、独立发布 | 全人员、跨季开票、实际实施者、直接/公共费用、分摊尾差守恒、负零利润、不完整禁发、首次/替换并发唯一 |
| FR-012、024 / UC08 | 只读统计、统一cutoff/rule_version | 队列剔除/未处理暂定、零分母、加权价、技能时隙非空闲比、当前发布版及敏感下钻 |
| FR-013—016 / SF01—04 | 独立身份及identity.md | 30分/8小时/5错15分、退出停用撤权下一请求、双向当前绑定唯一/旧会话失权、分权管理 |
| FR-017—022、025 | 数据模型、锁/回执/审计/金额/时间契约 | AC-G01—08；24/209/44逐字段/约束、历史/UTC/精确金额、边界保护 |
| Q01 易用性 | 页面入口清楚，登录与本人资料状态明确；完成预约不超过4次业务提交或确认，保存治疗不超过3次。 | 通过组件交互、接口及实际页面自动化检查，验证导航、表单提示、预约、治疗保存及结果读回。保留模拟接口与真实环境的验证边界；负责人日常使用确认体验，不强制招募参与者、培训或提交人工记录。自动化指定场景通过，业务提交与确认次数符合目标，成功及错误提示明确；结果与后台一致，无权限绕过。不将自动化结果描述为人工实验。 |
| Q02、Q09 | 资源配置、数据目录/回归 | 各新增1目录及合法班次可用、历史不变、新诊所资料齐备≤1工作日 |
| Q03 | k6隔离真实业务负载及现有云端只读验证 | 完整数据规模；10并发20分钟、60/20/20、5000次成功；云端5并发5分钟、600次只读；P95≤3秒、错误<1% |
| Q04 | MySQL容器并发/故障注入 | 真实事务行锁及唯一键，不用mock或界面演示替代 |
| Q05 | 同位点恢复演练 | 每日/15分/30天，RPO≤15分、RTO≤4小时及跨存储一致性 |
| Q06—08 | 会话/权限/审计 | 原全部安全场景、敏感字段最小披露、1年可信审计、普通账号不可改删 |
| SC-001—010 | Spec与quickstart | 业务时间/100%覆盖及七项追溯、工作日及资料等待分列；所有87个AC均需可执行证据 |

所有运行证据必须保存环境、虚构数据集、版本、步骤、期望/实际、结果及核验人。质量文档校验和业务测试分别报告，不把本轮结构检查当已达性能/恢复目标。

## 技术设计与实施验证

技术选择和备选见research.md，数据及技术存储见data-model.md和technical-data-model.md，91项HTTP操作、身份及错误行为见contracts/。当前64项任务完成，逐项验收证据见tasks.md及task-traceability.md。

业务D1覆盖既定24表；Word字段表D3—D21、schema.json和本Plan字典采用相同209字段和44外键。独立技术存储为adc_identity的13张技术表及adc_audit的AuditEvent，业务数据在adc_business。RequestReceipt及Flyway历史属于identity，技术到业务的应用引用由统一服务验证，不给原ERD增加外键。

真实身份链路为微信code2Session→ExternalIdentity→Subject→ADC会话。首次本人登记在同事务新建Patient、自动建立SELF_DECLARED本人关联、保存声明及审计，免人工批准；本人声明保持NOT_REVIEWED，以SD1服务端快照确认本人预约，不替代医护核实。已有档案由前台核实申请、生成关联依据，换号使用新主体申请并原子替换，旧会话立即失去原本人档案权限。身份声明中历史reviewed_by/verified_by字段记录实际办理主体，不能从字段名称推断人工核验。

当前Word、检索副本、24份字段表、22幅正式图片及共享契约按本轮验证记录核对。真实微信与两端联调结果见docs/verification/cloud-integration-20261124/summary.md及docs/verification/patient-onboarding-20261124/README.md；T052—T056按各自实测条件验收，不以静态校验代替完整易用性、负载、恢复或正式发布。TD-01已由负责人确认：一期不启用自动删除，保留审计、绑定、授权和回执历史。

## Complexity Tracking

本轮无需要宪章例外的复杂性偏离。选择同一后端及同一MySQL实例的三个schema以保住原结构、事务和恢复一致性，以表级授权替代control/meta各自独立schema；未引入微服务、独立SSO、分布式消息、缓存集群或新的业务数据库表。
