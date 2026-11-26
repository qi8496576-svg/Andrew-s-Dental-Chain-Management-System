# ADC 系统级规划研究与技术决策

**2026-11-09 依赖版本补充批准**：负责人已批准 [ADC-PLAN-20261109-DEP01](plan-dependency-amendment.md)。当前组合为 Java 21 LTS、Spring Boot 4.1.2、MyBatis Starter 4.1.0、MyBatis-Spring 4.1.0、MyBatis 核心 3.5.19、Maven 3.9.16。原批准记录保留；本次只批准该依赖变更，最终 Implement 授权审核仍待负责人指令。此前 Analyze 结论对应当时版本，本次未重新执行 Analyze，未进行构建或运行验证。

日期：2026-11-07。依据：[Spec](spec.md)、[Constitution](../../.specify/memory/constitution.md)、最终 Word 表 D3—D26；用户本轮确定微信小程序、员工 Web、统一后端、24/209/44 数据基线、Linux 云服务器 + Docker，开发电脑为 Windows。当前Plan技术基线已由项目负责人于2026-11-07正式批准，见[plan-approval.md](plan-approval.md)。本轮仅修正文档状态，不宣称软件已通过测试。

## 研究范围与完成结论

研究分别检查后端/数据、身份/安全、前端/Windows及部署，随后统一决策。技术上下文中的语言、框架、数据库、身份实现、测试及开发/部署路径已形成具体方案，无尚待回答的技术决策标记。真实 AppID、域名、云资源、备份介质和课程举证是后续环境输入，按下方 C 项登记，不冒充已取得或已验证。

## R-D01 统一后端及数据映射

**Decision**：Java 21 LTS、Spring Boot 4.1.2、MyBatis Spring Boot Starter 4.1.0（MyBatis-Spring 4.1.0、MyBatis 核心 3.5.19）、Maven 3.9.16（沿用3.9版本线）；普通 Java 领域对象和 BigDecimal 实现规则，应用服务编排授权与事务，MyBatis 显式 SQL/映射器持久化。单一模块化后端部署，模块按患者、资源、排班、预约、诊疗、开票、季度绩效、分析、身份和审计划分。

**Rationale**：原模型已规定领域职责及映射器；显式映射可原样保留复合主键、PascalCase 表名、精确金额及锁定查询。当前官方仓库将 Starter 4.0.x 对应 Boot 4.0、MyBatis-Spring 4.0，将4.1主线对应 Boot 4.1、MyBatis-Spring 4.1；4.1.0正式发布POM指定 MyBatis-Spring 4.1.0、MyBatis 3.5.19，构建基准为 Boot 4.1.0。保留 Boot 4.1.2 并采用 Starter 4.1.0 有版本线依据，但本项目的具体组合尚未运行验证；旧站点表中“4.0+”不足以支撑原 Starter 4.0.0 搭配 Boot 4.1.2 已充分验证的结论。本机发现 JDK21、Maven 命令入口，仅是工具存在检查，未运行构建或依赖解析。

**Alternatives considered**：Python + FastAPI/SQLAlchemy 可行，但会换一套实现/工具约定；.NET 10 同样可行，但需再处理 MySQL ORM provider 主版本兼容；Spring Data JPA 的自动模型生成不适合把既有物理结构作为不可漂移基线。微服务、消息队列、独立报表库、Redis 和 Kubernetes 对当前规模没有已确认必要性，首版不引入。

依据：[Spring Boot 系统要求](https://docs.spring.io/spring-boot/system-requirements.html)、[MyBatis 兼容矩阵](https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/)、[.NET 支持策略](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core)、[SQLAlchemy 发布线](https://www.sqlalchemy.org/download.html)。网页状态随时间变化，以上是本次查询记录，不声明其永远为最新版本。


### R-D01 依赖版本修订依据（2026-11-09）

官方依据：[MyBatis仓库兼容说明](https://github.com/mybatis/spring-boot-starter#requirements)、[Starter 4.1.0正式发布说明](https://github.com/mybatis/spring-boot-starter/releases/tag/mybatis-spring-boot-4.1.0)、[4.1.0发布标签POM](https://raw.githubusercontent.com/mybatis/spring-boot-starter/mybatis-spring-boot-4.1.0/pom.xml)、[Spring Boot系统要求](https://docs.spring.io/spring-boot/system-requirements.html)、[Maven版本记录](https://maven.apache.org/docs/history.html)。核实日期为2026-11-09，优先使用正式发布标签固定依赖事实，不把主分支快照作为生产版本。

应用明确采用 Boot 4.1.2 parent/BOM；Starter 4.1.0 传递引入 MyBatis-Spring 4.1.0 与 MyBatis 3.5.19，Spring Framework及其他Boot管理依赖随4.1.2 BOM，不单独覆盖。若使用MyBatis测试starter，同样采用4.1.0。Maven锁3.9.16；JDK保持21 LTS，其发行版补丁/镜像摘要由T001锁定。

原R-D01“官方兼容矩阵支持该组合”属于历史结论，现修正为“官方版本线及正式依赖依据支持推荐组合，项目兼容性需实测”。本次不认定旧组合必然失败，也不声称新组合已构建通过。T001应核对依赖解析、effective POM、dependency tree、最小启动及Mapper加载；既有MySQL映射/事务集成验证继续由T043—T050及相应故事承担，验收标准保持。

## R-D02 数据库、条件规则与迁移隔离

**Decision**：沿用原设计背景，采用 MySQL 8.4 LTS / InnoDB、单主实例。`adc_business` 严格仅 24 表、209 字段、44 外键；`adc_identity` 存身份/会话/绑定/授权、RequestReceipt 与 flyway_schema_history 共13张技术表，`adc_audit` 仅 AuditEvent；本次补充审核取消 adc_control、adc_meta 独立物理schema，职责保留于对应模块。所有 schema 同一实例，关键写入共用一个事务连接。Flyway 版本由 Boot BOM 管理，MySQL 支持模块同版本引入，迁移历史不落业务 schema。

**Rationale**：延续 MySQL 可避免改换类型、JSON、时间与约束语义。普通唯一键和外键照原定义建立；NORMAL 条件唯一、跨诊所不重叠、占位和当前发布唯一使用稳定父行锁及原业务谓词保障。MySQL 表达式索引内部使用隐藏生成列，故本轮不用它绕过 209 字段限制，不增加生成列、软删除字段或通用 version 列。

**Alternatives considered**：PostgreSQL 部分唯一索引表达自然，但换库属于更大兼容性与批准工作；全局 UNIQUE 会错误限制 SUSPENDED 历史多版，不能采用；在业务库新增锁表或迁移历史表会破坏表数边界。可在既有字段上提出普通查询索引，需说明用途、写入开销及 EXPLAIN 证据，不改变字段/唯一含义。

依据：[MySQL CREATE INDEX](https://dev.mysql.com/doc/refman/8.4/en/create-index.html)、[InnoDB 锁定读](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html)、[标识符大小写](https://dev.mysql.com/doc/refman/8.4/en/identifier-case-sensitivity.html)。开发/集成/生产均用 Linux MySQL，初始化时统一 `lower_case_table_names=0`；禁止在已经初始化的数据目录上改该参数。

## R-D03 原子性、幂等与金额时间

**Decision**：写命令使用 READ COMMITTED 和明确父行锁；跨牙医/班次/就诊的统一顺序为 Dentist 编号升序 → DentistSchedule 编号升序 → Appointment 编号升序 → 明细/结果，先确定所需对象再按序取锁，发现集合变化时回滚重试。首次排班/首次绩效发布都锁稳定 Dentist；开票锁 Appointment。季度一致来源读取采用单独只读 REPEATABLE READ 快照，随后保存其冻结输入和结果。

所有受保护写命令在 `adc_identity.RequestReceipt` 以可信主体、操作及请求键唯一标识；保留内容摘要和结果对象引用。先以同一连接取得请求命名锁，事务内复核身份/授权、回执及内容；成功回执与业务/审计同事务提交，失败不留下成功回执。命名锁在提交/回滚真正完成后、连接归池前释放，释放失败逐出连接；不得在 Spring 代理尚未提交前从方法 finally 释放。预约 BOOK 事件及摘要仍保存，并与回执交叉核对，不把事件组合唯一键当作创建幂等的全部。

**Rationale**：控制记录是技术防重，不是第 20 张业务表；相同主体同键不同内容拒绝，超时未知沿用原键查询/重试。命名锁是单 mysqld 连接级锁，不随事务结束自动释放，因此部署限单主；不把 JVM 锁当跨实例保证。Spring 写事务统一所有异常回滚，事务入口经代理调用；临床和金额计算不委托前端。

金额以 BigDecimal/原 DECIMAL 存储、十进制字符串传输；逐项 HALF_UP 到分后累加；R1 分摊按绝对净额先截分、余数降序及 dentist_id 升序补分再恢复符号。日期区间按 Asia/Shanghai；时间点以 UTC 存取，日期/时段不误当 UTC 日期。BIGINT 标识也以字符串传输，避免 JavaScript 整数失真。

**Alternatives considered**：离线令牌/进程内锁、先查再写无互斥、浮点金额或先汇总后舍入均不满足已确认规则；分布式事务和异步补记关键审计增加无必要复杂性。

依据：[MySQL 命名锁](https://dev.mysql.com/doc/refman/8.4/en/locking-functions.html)、[Spring 声明式事务](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)、[Java BigDecimal](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html)。命名锁生命周期及跨 schema 原子性必须以真实 MySQL 集成试验证明。

## R-D04 身份与审计组件

**Decision**：同后端部署中的独立身份/授权模块，采用服务端不透明会话，每次受保护请求查询权威会话、账号、当前绑定和有效授权。患者经微信 `wx.login` / 服务端 `code2Session` 映射 `(provider, appid, openid)` 至内部主体；员工个人账号使用成熟密码散列库的 Argon2id，初始管理账号经受控运维初始化，不开放公开总部注册。

Web 为同源 Secure/HttpOnly/SameSite=Lax Cookie，写请求有 CSRF 校验；小程序携带 ADC 的 Bearer 会话。会话令牌采用32字节密码学随机值、只存摘要，微信 AppSecret/session_key 不作为 ADC 凭据下发。员工Argon2id初始参数为内存19456KiB、迭代2、并行1、盐16字节、输出32字节，依成熟库实现并在目标环境校准；这不是已通过性能测试的声明。严格先检查空闲≥30分钟、绝对≥8小时再更新活动；第5次连续认证失败限制15分钟；不通过刷新延长绝对寿命。注销/停用/撤权/重绑后下次请求读取最新事实，不使用有正向失效窗口的授权缓存。

当前患者绑定以主体/患者各自唯一，追加历史保留核验人/时间/依据；核验重绑同事务旧失效、新生效及审计，旧会话不能凭旧绑定继续访问。岗位能力、诊所范围及具体对象都检查；成本核验、发布、敏感下钻、账号管理、授权管理分别校验。“医生”对应牙医；“诊所管理员”只是员工入口称谓，不因名称取得总部能力。

**Rationale**：满足 Q06 精确失效及 SF02 一对一；身份独立不等于另建身份微服务。成功写操作与规定审计同事务，敏感读先持久化审计再返回；拒绝/失败审计可在原事务回滚后单独记载。普通应用凭据不得改删审计，审计查询须总部单独授权，保留1年。

**Alternatives considered**：Keycloak/OIDC 可用于将来统一身份，但不会替代 ADC 本人绑定、诊所对象授权和业务审计；其一般会话/令牌失效机制不能直接等同本项目下一请求拒绝。首版不增加额外服务，不增加短信、邮箱、支付或家属代管功能。

依据：[Keycloak 会话管理](https://www.keycloak.org/docs/latest/server_admin/index.html)、[OWASP 会话管理](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)、[密码存储](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)、[MySQL 事务](https://dev.mysql.com/doc/refman/8.4/en/commit.html)、[跨数据库限定名](https://dev.mysql.com/doc/refman/8.4/en/identifier-qualifiers.html)。Argon2id 参数由成熟库、官方建议及目标环境测量确定，不自造算法或宣称已达性能目标。

## R-D05 两个前端与契约

**Decision**：患者端为原生 TypeScript + WXML/WXSS；管理端 Vue 3.5.x + TypeScript 5.9.x + Vite 8.3.x、Vue Router、Pinia、Element Plus 2.x。构建 Node 24 LTS，满足 Vue 当前 `>=24.12` 的该主版本入口。统一 REST/JSON 接口，OpenAPI 3.1.1 文档；本轮用稳定可解析契约版本，不宣称它是最新规范。

**Rationale**：只有微信患者平台需求，原生小程序避免额外跨端兼容层；Vue 管理表单/表格组合足够，前端只展示后端权威状态和金额。两端共享 DTO 定义/枚举而非复制领域计算，角色页面隐藏只是体验，服务端授权才是安全边界。

**Alternatives considered**：React 可行，不以性能优劣作无证据结论；Taro/uni-app 当前没有已确认多端复用收益。接口不暴露通用状态 PATCH，不采信患者 patient_id、自报角色/范围或治疗单价。

依据：[Vue 快速开始](https://vuejs.org/guide/quick-start)、[Vite 支持线](https://vite.dev/releases)、[Node 发布状态](https://nodejs.org/en/about/previous-releases)、[TypeScript 5.9](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html)、[微信官方 API 类型](https://github.com/wechat-miniprogram/api-typings)、[OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html)。实现时锁定完整补丁、锁文件、镜像 digest，先跑兼容检查；本轮没有安装依赖。

## R-D06 开发、部署与恢复

**Decision**：Windows 保留现有文档原位；微信开发者工具运行在 Windows。Java/Maven 可在 Windows 编辑编译，数据库及集成验证用 Docker Desktop 的 WSL2 engine + Linux containers；WSL2 作为可选环境，不以已安装 wsl.exe 推定已有发行版/虚拟化。生产 Linux x86_64 云服务器、Docker Engine + Compose、反向代理提供 HTTPS 和管理端静态资源，后端及 MySQL 位于私有网络。具体镜像及 Compose 清单在 Implement 生成，本轮只规划。

MySQL named volume 用于持久性，不能替代备份；秘密用受控文件/云秘密注入，不写仓库、镜像或前端。每日对业务/身份技术（含控制与迁移历史）/审计三个schema作一次一致全备并保存 binlog 位点；归档 binlog 的实际最长未归档跨度≤15分钟，保留至少可恢复30天的全备+连续日志链。恢复到同一个共同日志位点，不拼接不同库的不同恢复时点。隔离演练计 RPO≤15分钟、RTO≤4小时并核对金额、状态事件、绑定及授权、审计。

**Rationale**：同实例跨 schema 可以统一事务、统一快照及日志恢复，降低关键审计丢失和身份引用错位风险。首版单后端、单主数据库，没有原需求的高可用率指标，不因此虚构 SLA；健康检查、重启和备份失败报警需落实。

**Alternatives considered**：生产不运行 Docker Desktop；不打包正在写入的裸数据卷作为一致全备；不把单机 volume 当异机备份；不提前采购云资源或编造恢复时长。

依据：[Docker WSL2](https://docs.docker.com/desktop/features/wsl/)、[WSL 文件系统实践](https://docs.docker.com/desktop/features/wsl/best-practices/)、[Compose 生产配置](https://docs.docker.com/compose/how-tos/production/)、[Compose secrets](https://docs.docker.com/compose/how-tos/use-secrets/)、[MySQL PITR](https://dev.mysql.com/doc/refman/8.4/en/point-in-time-recovery.html)。

## R-D07 验证工具与证据

**Decision**：后端测试随 Boot BOM 的 JUnit Jupiter/Testcontainers（本次官方坐标为6.0.3/2.0.5），使用真实 MySQL8.4容器；前端 Vitest5.x、Playwright1.x稳定线；性能 k6 1.x，契约文档及双方 DTO 做结构/授权反例校验。工具精确补丁锁定属于实现准备，不在本轮伪造安装结果。

领域测试覆盖状态、资质、历史价、舍入、人员范围、R1、负/零利润及尾差；集成测试覆盖真实行锁、唯一键、并发、故障回滚、跨 schema 审计/绑定及发布。小程序须开发者工具和实际微信端验证，浏览器 E2E 不能代替。

Q03保留30诊所、100牙医、1万患者、10万预约及20万治疗。隔离Linux容器合计CPU上限2核、内存上限2GB，独立负载进程；10并发持续20分钟，每用户约2秒一次请求，候选检索/治疗保存/结算占60%/20%/20%。另在现有2核2GB云端执行5并发5分钟只读验证。隔离测试不少于5000次实际成功请求，各类P95≤3秒，非预期错误率<1%，配比误差≤0.5个百分点；云端不少于600次只读请求，P95≤3秒且错误率<1%。保存原始样本、资源和落库核对，不推断100并发或云端大规模写入容量。

依据：[Boot 测试依赖坐标](https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html)、[Vitest](https://vitest.dev/guide/)、[Playwright CI](https://playwright.dev/docs/ci)、[k6 度量](https://grafana.com/docs/k6/latest/using-k6/metrics/)。

## 来源可访问性及 C 项处理

微信开发者站的 code2Session、wx.login、网络要求页面本次研究工具返回无法读取，不能声称成功核验其全文。微信官方 GitHub 类型包及 miniprogram-ci 可读取；腾讯官方资料也描述代码交换与自定义登录态链路。生产使用真实平台流程，联调时复核当前平台规则：[code2Session 配置入口](https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html)、[网络配置入口](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html)、[官方 miniprogram-ci](https://github.com/wechat-miniprogram/miniprogram-ci-dist/blob/master/README.md)。未把测试适配器当正式微信验证。


### 后续必要工具验证

| 编号 | 当前状态 | 后续工作 |
| --- | --- | --- |
| C-03 | 保留必要工具验证 | 采用重建源前完成专用解析/渲染和语义核对；不是负责人未决定业务想法 |

### 已批准决策与实施、验收承接

| 编号 | 当前状态 | 后续工作 |
| --- | --- | --- |
| C-02 | 当前Plan的MySQL8.4及约束实现已批准 | 实施时锁版本并逐字段/约束核验，维持原设计 |
| C-04 | 身份架构设计已批准 | 真实AppID、域名/TLS、初始化、秘密注入与实际联调转后续实施任务 |
| C-05 | 部署、性能及恢复方案已批准 | 云资源、备份介质、Q03测试和Q05恢复演练转后续实施及验收任务 |

事项关闭/移出范围、文件指纹和明确批准依据见[plan-approval.md](plan-approval.md)。
未执行的真实配置或验证不填假值、不写通过，也不再作为Plan尚未定案的证据。

## R-D08 技术表落地与 Schema 精简（补充审核）

**Decision**：首版为 adc_business、adc_identity、adc_audit 三个物理 schema；control/meta 是逻辑职责。
adc_control 原回执落 adc_identity.RequestReceipt，adc_meta 原元数据落 adc_identity.flyway_schema_history。
全部14张技术表及19条技术FK、12项应用引用见 [technical-data-model.md](technical-data-model.md)；
原Word逐字段/键/关系证据见 [business-baseline-audit.md](business-baseline-audit.md)。
原ERD是业务ERD，其24/209/44没有包含技术存储；原D1不添加表或线。

**Rationale**：首版只有一个后端/单主MySQL；回执与主体同事务，迁移历史由独立migrator管理。
为一张回执表和一张工具表分别建库没有已确认必要性，表级授权足以阻止运行账号写工具历史。
保留audit独立schema有助于追加权限/查询/保留策略管理；跨schema仍必须同一事务连接。

**Alternatives considered**：

| 方案 | 收益 | 成本/边界 | 决策 |
| --- | --- | --- | --- |
| 五schema | 五类职责按物理库区分 | control/meta各一表，增加初始化、授权、迁移和恢复清单 | 由本次修订替代 |
| 三schema | 原业务独立，审计独立，身份/控制/历史表级隔离 | 运行账号必须逐表授权；迁移历史只给migrator | 采用 |
| 两schema：业务+全部技术 | 更少建库项 | 审计保留/写入权限全落表级，不利于独立运营审计边界 | 可行，本轮不选 |

Flyway明确配置defaultSchema=adc_identity，工具历史表不进business；createSchemas=false、cleanDisabled=true，
运行程序关闭自动迁移，migrator执行显式全名DDL。Session等不重复生成隐藏框架表。
技术库到Patient/Clinic/Dentist无物理FK；统一应用当前读、权限、固定锁序、同事务写入及恢复巡检保证逻辑引用。
技术表内部及AuditEvent→Subject有明确数据库FK；两类关联不能混称“已由数据库保证”。

依据：[MySQL CREATE DATABASE](https://dev.mysql.com/doc/refman/8.4/en/create-database.html)
确认SCHEMA与DATABASE同义；[Flyway defaultSchema](https://documentation.red-gate.com/flyway/reference/configuration/flyway-namespace/flyway-default-schema-setting)
确认历史表落点可配置。原业务的条件唯一由D22认可的领域事务实现，不静默新增列/全局唯一。

## R-D09 真实身份与核验依据闭环（补充审核）

**Decision**：wx.login代码仅由后端用受控AppID/AppSecret交换可信OpenID，精确映射ExternalIdentity和Subject，
随后签发ADC自有会话；OpenID从不等于Patient。不同真实微信账号不合并到同一患者主体，
以ExternalIdentity.subject_id UNIQUE及CurrentPatientBinding双向唯一共同保持Clarify Q1。
患者绑定申请只提供患者编号、出生日期和请求服务点；不要求不存在的“已批准核验引用”。
前台比对原Patient并核实本人、服务依据，形成结构化核验记录；
批准/换绑将申请批准、当前映射、历史、审计和回执同事务保存。失败不授访问权。
具体字段及证据落点见[身份契约](contracts/identity.md)。

**Rationale**：把平台账号真实性、患者本人核验、工作人员账号和对象授权逐层验证；
保证申请可实际发起，而非引用系统从未生成的凭证。患者所选诊所仅为待办路由，不是授权。
员工初建无密码时不能登录，通过已授权凭据设置/恢复路径完成，不预置共享总部密码。

**Alternatives considered**：客户端自报OpenID、姓名/电话自动合并、患者勾选“本人”直接绑定、
预先插入新绑定再撤旧绑定均违背可信身份/核验或Q1；生产使用模拟适配器不得启动。
C-04身份架构已批准；真实AppID、域名/TLS、微信后台权限、首个管理员输入及实际联调已转后续实施工作，本轮未执行。
微信官方站可访问性限制与前文相同，不编造已核验全文记录。

**新增待确认 TD-01**：绑定申请线索及非审计技术历史的生产清理/保留期限，由负责人在
生产数据治理与清理策略启用前确定；不影响当前表与流程设计，不降低审计至少1年或业务历史保全。
不将该项混入宪章C-03（原重建模型工具验证）。

## 2026-11-09 物理 Schema 核对

当前有效方案仅为 adc_business（原24张业务表）、adc_identity（13张技术表，含 RequestReceipt、flyway_schema_history）、adc_audit（AuditEvent 1张表）。回执落 adc_identity.RequestReceipt，Flyway历史落 adc_identity.flyway_schema_history；旧control/meta名称只用于解释合并历史，不初始化为物理schema。本次核对前上述有效配置已为三Schema，未发现需要改回执落点的有效旧版指令。
