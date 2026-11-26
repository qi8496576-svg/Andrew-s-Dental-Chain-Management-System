# 安德鲁牙科连锁管理系统实施任务

当前64项任务已按系统业务规约与课程演示验收口径完成，具体证据见tasks-catalog.json。缴费与退款使用演示模式，不扣真实款。

## 执行与完成规则

按tasks-catalog.json中的拓扑顺序执行，同一功能的后端、页面与实际验收连续推进，不逐Task等待审批。先完成剩余数据库和共享安全事务基础，即进入登录→账号授权→患者/组织资源→绑定→独立排班→预约→诊疗结算→季度绩效→分析。各故事优先级沿用Spec；患者/资源提前只为提供真实输入。

- 每项包含必要测试与实现，先写测试再实现；勾选须取得该项真实完成证据，文件存在或静态通过不能代替运行验收。只重测受影响范围；跨模块及发布门禁仍必须执行。
- 全部26项FR、87个AC、91个operationId及Q01—Q09均保留。每项继承映射中旧任务的规则、文件与验收；执行依据优先是已批准Spec、Plan、数据字典和contracts，而非历史任务生成话术。精简不改变Given/When/Then或接口。
- 24业务表/209字段/44FK；adc_identity 13技术表、adc_audit 1技术表，共14/110/19及12项APP引用。业务变更以负责人已批准的24表字典及V201范围为准；Flyway历史由工具管理，技术→业务不加物理FK。
- 五状态、四取消分类、UC01-S1—S5、先预约/到诊/治疗/费用凭据再季度绩效、R1个人正净利润10%、历史保护、双向唯一的本人关联、既有档案人工核验及历史保护；INVOICED不表示付款，演示缴费及全额退款使用独立账单和订单，始终标识不扣真实款。
- 每请求当前功能/对象/本人/诊所权限、金额精度、幂等/并发/回滚、审计及最小披露均随业务交付，不能推迟成上线后补做。
- 正式批量开发Vue业务页面前先向负责人展示导航及关键页面方案；预约与排班独立入口且联动。参考docs/ui/reference-brief.md，只采用观察到的产品组织/交互，不复制参考产品的额外范围。
- C-01/C-02已关闭，C-03由T007实际证据关闭；C-04真实微信、C-05云资源/性能/恢复留在相应批次；C-06非产品事项不纳入；TD-01已确认一期不启用自动删除。真实凭据/云资源不阻止本地已具备条件的业务开发；模拟不等于真实验收。购买资源、生产发布及破坏性操作仍须对应授权。
- 删除的是重复的逐层任务壳、逐表重复构建和重复报告要求，不删除测试种类、规则或验收。开发与验收可共用一份批次结果，不要求每个类/SQL/中间步骤单独长报告。历史实现输入指纹及审批记录不改写。



## A. 保留既有T001—T010记录

- [X] T001 锁定 Java 21、Spring Boot 4.1.2、MyBatis Starter 4.1.0（传递依赖 MyBatis-Spring 4.1.0、MyBatis 核心 3.5.19）、Maven 3.9.16；配置 Wrapper 与 BOM 管理的 Security、Connector/J、Flyway、JUnit、Testcontainers，执行依赖解析和最小构建，保存准确版本及兼容证据；失败记录问题，不静默替换获批技术栈。 按 ADC-PLAN-20261109-DEP01，使用 Spring Boot 4.1.2 parent/BOM 管理 Spring 依赖；核对 effective POM、dependency tree 中 MyBatis-Spring 4.1.0/MyBatis 3.5.19 及 Spring 依赖无版本混配，记录依赖解析、最小启动和映射器加载结果。Java 21 的发行版补丁及镜像摘要在本任务锁定。官方版本线支持不代替本项目实测。 文件：`backend/pom.xml`、`backend/mvnw`、`backend/mvnw.cmd`、`docs/verification/build-environment.md`。

- [X] T002 配置 Windows/JDK 或 WSL2 与 Docker Desktop Linux 容器开发入口；验证 Docker 服务端、Testcontainers 连通性，初始化 MySQL 8.4/InnoDB、lower_case_table_names=0、UTC，隔离持久卷和虚构数据；不得把仅发现客户端当作可运行。 文件：`ops/compose/compose.dev.yaml`、`ops/runbooks/local-development.md`。 依赖：T001。

- [X] T003 [P] 初始化 Vue 3.5、TypeScript 5.9、Vite 8.3、Node 24 LTS（≥24.12）、Router、Pinia、Element Plus 2、Vitest 5/Playwright 1；锁文件、类型检查、构建及路由壳可运行。 文件：`apps/admin/package.json`、`apps/admin/package-lock.json`、`apps/admin/src/main.ts`。 依赖：T001。

- [X] T004 [P] 初始化原生微信 TypeScript/WXML/WXSS 小程序、开发工具配置和类型检查；环境配置只含公开标识，AppSecret 始终在服务端。 文件：`apps/patient-miniprogram/project.config.json`、`apps/patient-miniprogram/miniprogram/app.ts`、`apps/patient-miniprogram/tsconfig.json`。 依赖：T001。

- [X] T005 为已批准 OpenAPI 3.1.1 建立标准验证器、引用/载荷/错误语义校验与双端 DTO 生成及漂移检查，覆盖全部 83 operations；ID/DECIMAL 用字符串，If-Match/请求键/错误码严格继承契约；输出到 packages/contracts，不修改冻结的契约源。 文件：`packages/contracts/package.json`、`packages/contracts/src/generated.ts`、`packages/contracts/scripts/validate.mjs`。 依赖：T003, T004。

- [X] T006 建立 JUnit/Testcontainers MySQL 8.4、前端测试与证据约定；虚构患者、独立员工身份/岗位/诊所及各状态夹具，夹具仅在隔离测试使用；定义 AC→步骤→预期/实际→环境/版本/核验人记录格式。 文件：`backend/src/test/resources/fixtures/adc-fictional.json`、`backend/src/test/java/com/adc/support/MySqlFixture.java`、`tests/e2e/fixtures.ts`、`docs/verification/README.md`。 依赖：T002, T005。

- [X] T007 完成 C-03：用专用工具解析/渲染既有 PlantUML、Mermaid、DBML 及技术模型，检查图面和语义并与正式 Word 嵌图核对；保存工具版本、差异和采用结论；输出到独立证据目录，不覆盖正式图或据重建图改需求。 文件：`docs/verification/models/c03-validation.md`、`tools/verification/check-models.ps1`。 依赖：T006。

- [X] T008 先建立真实 MySQL 结构与权限验收：逐字段比较原 Word 审核清单/schema.json、PK/UK/44 FK/CHECK 及 24/209 基线；技术 14 表/110 字段/19 FK/12 APP 引用逐项核对；检查无隐式框架表、业务隐藏列、adc_control/adc_meta schema；迁移历史按 Flyway 版本核验。 本任务只编写结构/权限测试、基线断言和测试夹具定义；数据库尚未建立时不要求运行测试通过，未建表的预期失败不构成实现阻塞。完成条件为测试准备就绪；实际迁移与结构/权限运行验收在 T043 执行。 文件：`backend/src/test/java/com/adc/infrastructure/SchemaBaselineIT.java`、`backend/src/test/java/com/adc/infrastructure/DatabasePrivilegesIT.java`。 依赖：T007。 验收：AC-G04。

- [X] T009 实现独立迁移容器入口、三个 schema 初始化与最小权限；defaultSchema=adc_identity、createSchemas=false、cleanDisabled=true，业务 DDL 全限定表名，运行时禁自动 DDL/Flyway；runtime 审计仅 INSERT/SELECT，迁移历史只读；说明 MySQL DDL 非事务回滚及失败恢复。 文件：`ops/compose/compose.migrate.yaml`、`ops/compose/mysql/bootstrap.sql`、`ops/runbooks/database-migrations.md`、`backend/src/main/resources/application.yaml`。 依赖：T008。

- [X] T010 建立 adc_business.Patient 的原样建表迁移及显式 Java/MyBatis 字段映射和只读仓储；外键统一在所有目标表创建后由后续任务添加。原字段六元组（字段/类型/PK/FK/可空/唯一）逐字引用：`| patient_id | BIGINT | Yes | No | NOT NULL | UNIQUE |`；`| patient_number | VARCHAR(30) | No | No | NOT NULL | UNIQUE |`；`| full_name | VARCHAR(100) | No | No | NOT NULL | - |`；`| date_of_birth | DATE | No | No | NOT NULL | - |`；`| billing_address | VARCHAR(255) | No | No | NOT NULL | - |`；`| phone | VARCHAR(30) | No | No | NOT NULL | - |`；`| email | VARCHAR(254) | No | No | NULL | - |`；`| emergency_contact_name | VARCHAR(100) | No | No | NOT NULL | - |`；`| emergency_contact_phone | VARCHAR(30) | No | No | NOT NULL | - |`；`| created_at | TIMESTAMP | No | No | NOT NULL | - |`；`| updated_at | TIMESTAMP | No | No | NOT NULL | - |`；`| allergy_review_status | VARCHAR(20) | No | No | NOT NULL | - |`。原模型规则引用：适用：UC01、UC05；SF02 首次本人登记创建新档案，已有档案安全核实关联。长期患者身份、联系资料及过敏确认。patient_number 为业务编号，patient_id 为存储主键；phone 不是唯一身份键。姓名、出生日期、账单地址、电话及紧急联系人姓名/电话必填，邮箱可空。 文件：`backend/src/main/resources/db/migration/V001__create_Patient.sql`、`backend/src/main/java/com/adc/domain/model/Patient.java`、`backend/src/main/resources/mappers/PatientMapper.xml`。 依赖：T009。

## B. 数据库与共享基础（完成后立即进入业务）

- [X] T011 **批量完成剩余建表与显式映射**。复用已经生成的迁移、32份记录/映射及映射加载测试；一次补齐剩余业务/技术表，逐字段继承原字典，显式只读仓储。Flyway历史必须由获批工具创建，核对真实字段/索引；出现结构差异则停止相应验收并报告，不手写替代表。技术→业务12项APP引用由服务校验。 文件：`backend/src/main/java/com/adc/domain/model/Allergy.java`、`backend/src/main/java/com/adc/domain/model/AppliedTreatment.java`、`backend/src/main/java/com/adc/domain/model/Appointment.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T009。验收：本项工程完成条件。

- [X] T012 **一次运行完整数据库结构及权限验收**。在可丢弃MySQL执行全部迁移，再添加30条业务FK、19条技术FK、普通/组合UK与单行CHECK；落实D22—D24，NORMAL条件唯一/不重叠及当前发布唯一交领域锁验证，不加业务列或全局条件键。运行T008测试及非法数据对照，保存INFORMATION_SCHEMA/SHOW CREATE TABLE差异；迁移、权限或结构失败不得通过。 文件：`backend/src/main/resources/db/migration/V200__add_constraints.sql`、`docs/verification/database/baseline-comparison.json`。依赖：T010, T011。验收：AC-G04。

- [X] T013 **共享金额、身份、审计、事务及API基础**。合并原共享基础步骤；先写核心规则和真实MySQL多连接测试，再实现精确金额/ID/UTC与上海业务时间、当前身份/范围授权、统一锁序、幂等/If-Match及超时原键查询、审计与业务/回执同连接原子提交、异常回滚与锁释放/坏连接逐出、统一错误与最小投影。searchAuditEvents及getRequestResult按原契约实现。审计1年、敏感读先审计、拒绝审计独立短事务；不能预提交PENDING或用旧会话授权快照。 文件：`apps/admin/src/api/http.ts`、`apps/patient-miniprogram/miniprogram/services/http.ts`、`backend/src/main/java/com/adc/application/AtomicCommandExecutor.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T012。验收：AC-G02, AC-G03, AC-G06, AC-G07, AC-Q04, AC-Q08。

- [X] T014 **基础门禁（一次汇总）**。运行本批受影响构建、真实数据库结构/映射/权限/事务测试，核实24/209/44和14/110/19，生产配置没有测试身份或通用SQL写入口。复用T001—T007未变化证据，不逐表重复全套构建；数据库结构冲突和原子性失败必须先修正。 文件：`docs/verification/foundation-gate.md`。依赖：T013。验收：AC-G04。

## C. 可运行业务模块（每模块后端→页面→验收）

- [X] T015 **SF01 登录与退出：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。真实 wx.login code 由服务端 code2Session 换取受信 provider/appid/openid，VARBINARY 精确匹配；同账号换设备同 Subject，首次不取得患者档案。代码交换在业务事务外，失败不降级。32 随机字节 ADC 令牌只存 SHA-256；员工成熟 Argon2id，禁止明文和共享口令。WEB Secure/HttpOnly/SameSite=Lax Cookie，预认证签名 CSRF Cookie/Origin，认证后轮换；小程序 opaque token。先检查空闲 30 分钟/绝对 8 小时再刷新，第 5 次失败限制 15 分钟，未知账号不枚举且不信任客户端来源 IP；退出/停用/撤权下次请求立即拒绝。 实现真实微信适配器、员工认证、限流、令牌签发/失效和当前身份投影；不信客户端 OpenID、UnionID/手机号自动合并或角色，不保存/回传 session_key；生产缺配置或使用测试适配器启动失败。 文件：`backend/src/main/java/com/adc/application/AuthenticationService.java`、`backend/src/main/java/com/adc/domain/authentication/AuthenticationRules.java`、`backend/src/main/java/com/adc/interfaces/AuthenticationController.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014。验收：AC-SF01-01, AC-SF01-02。

- [X] T016 **SF01 登录与退出：页面及闭环验收**。实现 Web 个人登录/退出及小程序 wx.login/退出，超时重新认证，安全处理 CSRF 与网络未知结果，页面不泄露认证秘密。  运行页面/E2E与对应Given/When/Then验收：真实提供方边界用可控测试适配器覆盖成功/拒绝/超时，生产配置拒绝模拟；虚构员工与患者会话验证全部时限、5 错限流、旧令牌注销及无越权。真实微信证据另由 C-04 联调任务完成。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/authentication/index.spec.ts`、`apps/admin/src/views/authentication/index.vue`、`apps/patient-miniprogram/miniprogram/pages/authentication/index.ts`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T015。验收：AC-SF01-01, AC-SF01-02。

- [X] T017 **SF03 管理员工账号：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。仅总部 account.manage 核实员工身份后办理；独立 StaffAccount/Subject，非牙医不写 Dentist，dentist_id 不擅加 UNIQUE。新账号不自动有岗位或总部权限，空凭据不能登录；用户名精确比较。受控首个总部初始化不提供公开注册或内置共享密码。 实现账号列表/建立/启用/停用及经核验 credential-recovery；旧会话按协议撤销，口令不进入日志、审计或幂等回执；引入受控 bootstrap 命令从秘密输入创建首位经负责人核实的管理员并留下依据。 文件：`backend/src/main/java/com/adc/application/StaffAccountService.java`、`backend/src/main/java/com/adc/domain/staffaccounts/StaffAccountRules.java`、`backend/src/main/java/com/adc/identity/bootstrap/HeadquartersBootstrap.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014, T016。验收：AC-SF03-01, AC-SF03-02。

- [X] T018 **SF03 管理员工账号：页面及闭环验收**。实现总部账号维护、身份核验、停启用及安全恢复页面；无 account.manage 不展示操作且后端拒绝，账号与牙医资源分离显示。  运行页面/E2E与对应Given/When/Then验收：总部合法账号可办理，其他岗位及未核实身份均拒绝；新账号无业务权限，停用/恢复后旧会话不可复用，不生成虚假 Dentist。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/staff-accounts/index.spec.ts`、`apps/admin/src/views/staff-accounts/index.vue`、`docs/verification/stories/staff-accounts.md`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T017。验收：AC-SF03-01, AC-SF03-02。

- [X] T019 **SF04 分配诊所权限：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。仅总部 authorization.manage 在自身可授范围内配置 RECEPTION/DENTIST/CASHIER/HEADQUARTERS、诊所、有效期及能力；诊所管理员是授权员工使用场景，不新增角色。资源、成本核验、绩效发布、敏感下钻、账号、授权、审计能力分别校验；当前数据库授权每次复核，不能用历史会话快照放行。 实现授权建立、查询及撤销，验证 Clinic 存在和调用者可授范围/期限；撤权与当前命令按主体锁序串行化，撤销后下次受保护请求拒绝旧范围，保留历史授权和审计。 文件：`backend/src/main/java/com/adc/application/ClinicGrantService.java`、`backend/src/main/java/com/adc/domain/clinicgrants/ClinicGrantRules.java`、`backend/src/main/java/com/adc/interfaces/ClinicGrantController.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014, T018。验收：AC-SF04-01, AC-SF04-02。

- [X] T020 **SF04 分配诊所权限：页面及闭环验收**。实现总部角色/诊所/能力/期限授权页面，明确可授范围和独立能力，撤销后更新页面投影。  运行页面/E2E与对应Given/When/Then验收：跨诊所、越可授范围、过期、撤销及敏感能力不足均拒绝；合法范围通过；不能借客户端修改角色或 scope。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/clinic-grants/index.spec.ts`、`apps/admin/src/views/clinic-grants/index.vue`、`docs/verification/stories/clinic-grants.md`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T019。验收：AC-SF04-01, AC-SF04-02。

- [X] T021 **UC05 维护患者资料：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。姓名、出生日期、账单地址、电话、紧急联系人及电话必填，邮箱可空；patient_number 唯一、phone 不唯一，不按电话自动合并。过敏状态 NOT_REVIEWED/NO_KNOWN/RECORDED，空关联不能自动断言无过敏；确认、更正/撤回须核实并追加 audit_history，不抹除旧证据。 实现授权前台核实建档/更正、本人及合法服务范围查询、过敏核实/新增/更正/撤回；跨诊所复用需服务依据；字段长度、过敏关联复合键及 audit_history 语义按原字典，核实留痕同事务。 文件：`backend/src/main/java/com/adc/application/PatientService.java`、`backend/src/main/java/com/adc/domain/patients/PatientRules.java`、`backend/src/main/java/com/adc/interfaces/PatientController.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014, T020。验收：AC-UC05-01, AC-UC05-02, AC-UC05-03, AC-UC05-04。

- [X] T022 **UC05 维护患者资料：页面及闭环验收**。实现 Web 患者建档/查重线索/资料和过敏核验页面，小程序本人只读资料；不提供患者自改或电话自动合并。 服务器生成PatientView过敏确认引用后才交给预约页面，不能让客户端自造引用。 运行页面/E2E与对应Given/When/Then验收：完整建档可用、必填错误拒绝、同电话不同患者合法；本人外或无服务依据拒绝，过敏三状态与更正历史完整。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/patients/index.spec.ts`、`apps/admin/src/views/patients/index.vue`、`apps/patient-miniprogram/miniprogram/pages/patients/index.ts`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T021。验收：AC-UC05-01, AC-UC05-02, AC-UC05-03, AC-UC05-04。

- [X] T023 **UC06 维护组织资源：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。总部资源能力维护共享目录/牙医任职/资质及执业；资质经核实且日期有效，空到期日仅核实长期有效；start/end 日期原语义、is_active 不覆盖历史；全部必需资质要求保留。引用中的目录/班次及历史价不删除或覆盖，调价只影响未来，变更列出未来预约影响。 实现诊所/牙医、资质/执业、治疗/过敏及治疗资质关联维护；统一父行锁与预约/排班当前读互斥，受保护资料纠错保留原值及核实依据。 文件：`backend/src/main/java/com/adc/application/OrganizationResourceService.java`、`backend/src/main/java/com/adc/application/resources/ClinicDentistService.java`、`backend/src/main/java/com/adc/application/resources/QualificationsService.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014, T020。验收：AC-UC06-01, AC-UC06-02, AC-UC06-03, AC-UC06-04。

- [X] T024 **UC06 维护组织资源：页面及闭环验收**。实现总部资源维护页面，区分任职/资质核验/执业/授权账号；历史引用保护、调价生效边界、未来预约影响可见。  运行页面/E2E与对应Given/When/Then验收：各目录新增可被正常排班/预约使用，失效或未核验资质不能放行；被引用对象保护、调价后历史单价不变。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/organization-resources/index.spec.ts`、`apps/admin/src/views/organization-resources/index.vue`、`docs/verification/stories/organization-resources.md`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T023。验收：AC-UC06-01, AC-UC06-02, AC-UC06-03, AC-UC06-04。

- [X] T025 **SF02 登记与关联本人档案：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。首次本人登记核验微信会话与必填资料，服务器生成患者编号、新建Patient并自动建立SELF_DECLARED关联，无需人工批准；过敏保持NOT_REVIEWED，声明记录在关联依据JSON，SD1确认允许本人预约。patient_number/date_of_birth/clinic_id仅用于已有档案关联申请，由授权前台核实；禁止猜测姓名或电话认领历史档案。主体和患者双向唯一、并发互斥、事务回滚、当前授权、重放及旧会话失效均验收。 实现申请/本人查询/授权前台待办、批准、换号重绑、撤销；重绑必须引用新 Subject 的 PENDING request 与同一 Patient；Subject 升序后 Patient 锁，旧失效/新有效/申请处理/历史/审计/回执原子提交。核验依据验证不信任客户端完成标志；verification_reference 按 APP 关联校验，不擅改 FK。旧会话仍存在也失去本人访问依据。 文件：`backend/src/main/java/com/adc/application/PatientBindingService.java`、`backend/src/main/java/com/adc/domain/patientbindings/PatientBindingRules.java`、`backend/src/main/java/com/adc/interfaces/PatientBindingController.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014, T020。验收：AC-SF02-01, AC-SF02-02, AC-SF02-03。

- [X] T026 **SF02 登记与关联本人档案：页面及闭环验收**。小程序提供首次本人登记及已有档案关联两个真实入口，首次无编号、免人工批准即可预约；明确本人过敏声明与医护核实；Web前台安全关联、冲突提示、重绑/解绑留因，核验诊所是实际服务上下文而非患者永久归属。  运行页面/E2E与对应Given/When/Then验收：用两个微信主体/同一患者并发批准仅一有效；双向冲突、错误核验、跨诊所和缺依据拒绝；故障完整回滚，重绑后旧会话访问立即拒绝且历史保留。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/patient-bindings/index.spec.ts`、`apps/admin/src/views/patient-bindings/index.vue`、`apps/patient-miniprogram/miniprogram/pages/patient-bindings/index.ts`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T025。验收：AC-SF02-01, AC-SF02-02, AC-SF02-03。

- [X] T027 **UC02 管理出诊排班：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。班次 [start_time,end_time)，开始早于结束，slot_minutes>0 且整除长度；稳定 Dentist 父行锁内核对同牙医跨诊所 NORMAL 不重叠及条件唯一，允许相邻半开边界和 SUSPENDED 历史版本；已引用班次归属、日期、时间及粒度冻结。 实现授权前台范围内排班创建/列表及挂起，核验任职/执业和原字典约束；挂起只改变班次并列出受影响预约，不取消预约，后续处理指向 UC01-S5。相关变更与预约提交遵守同一锁协议。 文件：`backend/src/main/java/com/adc/application/ScheduleService.java`、`backend/src/main/java/com/adc/domain/schedules/ScheduleRules.java`、`backend/src/main/java/com/adc/interfaces/ScheduleController.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014, T020。验收：AC-UC02-01, AC-UC02-02, AC-UC02-03。

- [X] T028 **UC02 管理出诊排班：页面及闭环验收**。实现授权诊所排班创建、冲突定位、停诊和影响列表，提示待处理预约，禁止以页面隐藏代替服务端守卫。 排班和预约必须有独立页面及导航；预约时段来自有效排班，调整提示已存在预约冲突。 运行页面/E2E与对应Given/When/Then验收：跨诊所并发创建冲突仅一成功，空集合首次排班也受父锁保护；相邻正常班次成功，已引用资料冻结，停诊不改变预约状态。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/schedules/index.spec.ts`、`apps/admin/src/views/schedules/index.vue`、`docs/verification/stories/schedules.md`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T027。验收：AC-UC02-01, AC-UC02-02, AC-UC02-03。

- [X] T029 **UC01-S1 创建预约：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。首次本人登记自动关联／既有档案安全关联／合法前台代办，且 patient_details 原必填资料、allergy_declaration 全部已知过敏及本次确认齐全；SELF_DECLARED 且 NOT_REVIEWED 的新档案可使用 SD1 声明快照预约，不伪造 AR1 医护核实；使用 PatientView 的服务器生成过敏确认引用，受保护档案冲突转前台，不用自助声明覆盖。候选满足全部必需资质的 VERIFIED/日期有效、执业关系、NORMAL、对齐时隙及未占位；SCHEDULED/IN_PROGRESS/COMPLETED/INVOICED 保留占位，CANCELLED 不占位。可选资质只展示；预约期望治疗不生成实际治疗。预约使用 appointment_id，不添加 appointment_number；BOOK 和初始 SCHEDULED 保留原定义。 实现候选、授权预约列表/明细和创建；提交再锁牙医/班次复核资格、占位/过敏/授权，Appointment/期望治疗/BOOK/审计/回执原子提交；同键不同内容拒绝、未知结果原键查重试，有效占位并发最多一份。 文件：`backend/src/main/java/com/adc/application/AppointmentBookingService.java`、`backend/src/main/java/com/adc/domain/appointmentbooking/AppointmentBookingRules.java`、`backend/src/main/java/com/adc/interfaces/AppointmentBookingController.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014, T026, T028。验收：AC-UC01-S1-01, AC-UC01-S1-02, AC-UC01-S1-03, AC-UC01-S1-04, AC-UC01-S1-05, AC-UC01-S1-06。

- [X] T030 **UC01-S1 创建预约：页面及闭环验收**。小程序本人预约及 Web 前台代办流程，返回可定位的资格/过敏/占位冲突；原键保存与查询；按 Q01 预约≤4 次业务操作设计并记录前端测试。  运行页面/E2E与对应Given/When/Then验收：有合法患者和排班夹具，且已接入 T140 真实 PatientView 后可完成预约端到端验证，分别覆盖缺资料/过敏未确认/资质失效/占位/同键重试/超时；保存后仅预约和期望项目，无治疗或单据。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/appointment-booking/index.spec.ts`、`apps/admin/src/views/appointment-booking/index.vue`、`apps/patient-miniprogram/miniprogram/pages/appointment-booking/index.ts`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T021, T029。验收：AC-UC01-S1-01, AC-UC01-S1-02, AC-UC01-S1-03, AC-UC01-S1-04, AC-UC01-S1-05, AC-UC01-S1-06。

- [X] T031 **UC01-S2 确认到诊：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。仅授权前台核实本人，NORMAL 且 SCHEDULED；写 attended_at 和 ATTEND，转 IN_PROGRESS；患者不能自助确认，不允许停诊/取消/已开始对象重复迁移。 实现到诊命令的当前状态/班次/身份校验、原子事件与审计回执；与取消、爽约和停诊并发时串行复核，失败不部分写入。 文件：`backend/src/main/java/com/adc/application/AppointmentAttendanceService.java`、`backend/src/main/java/com/adc/domain/appointmentattendance/AppointmentAttendanceRules.java`、`backend/src/main/java/com/adc/interfaces/AppointmentAttendanceController.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014, T030。验收：AC-UC01-S2-01, AC-UC01-S2-02, AC-UC01-S2-03。

- [X] T032 **UC01-S2 确认到诊：页面及闭环验收**。实现 Web 前台到诊核验及当前状态提示，重复提交显示原结果，状态冲突后刷新。  运行页面/E2E与对应Given/When/Then验收：合法核验只产生一次 ATTEND；错误身份、停诊及非法旧状态拒绝，与取消/爽约并发无互相覆盖。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/appointment-attendance/index.spec.ts`、`apps/admin/src/views/appointment-attendance/index.vue`、`docs/verification/stories/appointment-attendance.md`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T031。验收：AC-UC01-S2-01, AC-UC01-S2-02, AC-UC01-S2-03。

- [X] T033 **UC01-S3 取消预约：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。仅 SCHEDULED 可取消；患者本人 NORMAL 且早于开始，开始≤now<结束仅前台核实代办；达到结束按 S4，停诊按 S5；到诊/完成/开票后不可取消。使用 PATIENT_CANCEL，CANCELLED 不恢复。 实现当前服务端时间及身份驱动的取消守卫、取消原因/事实时点/事件原子保存；拒绝客户端时间绕过，与到诊并发无双迁移。 文件：`backend/src/main/java/com/adc/application/AppointmentCancellationService.java`、`backend/src/main/java/com/adc/domain/appointmentcancellation/AppointmentCancellationRules.java`、`backend/src/main/java/com/adc/interfaces/AppointmentCancellationController.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014, T030。验收：AC-UC01-S3-01, AC-UC01-S3-02, AC-UC01-S3-03, AC-UC01-S3-04。

- [X] T034 **UC01-S3 取消预约：页面及闭环验收**。小程序自助取消和 Web 核验代办，按边界解释拒绝及正确后续流程，网络未知保持原键。  运行页面/E2E与对应Given/When/Then验收：开始前、恰好开始、结束前、恰好结束及停诊样本分别验证权限；到诊后及他人预约不能取消。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/appointment-cancellation/index.spec.ts`、`apps/admin/src/views/appointment-cancellation/index.vue`、`apps/patient-miniprogram/miniprogram/pages/appointment-cancellation/index.ts`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T033。验收：AC-UC01-S3-01, AC-UC01-S3-02, AC-UC01-S3-03, AC-UC01-S3-04。

- [X] T035 **UC01-S4 登记爽约：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。时隙结束后由授权前台核实未到诊，当前仍 SCHEDULED 才登记；NO_SHOW 为取消分类，最终 CANCELLED，不新增第六状态，不运行自动爽约任务。 实现结束边界、未到诊核实及状态锁内复核；与 ATTEND 并发已有到诊不得覆盖，原键重试不重复事件。 文件：`backend/src/main/java/com/adc/application/AppointmentNoShowService.java`、`backend/src/main/java/com/adc/domain/appointmentnoshow/AppointmentNoShowRules.java`、`backend/src/main/java/com/adc/interfaces/AppointmentNoShowController.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014, T032, T034。验收：AC-UC01-S4-01, AC-UC01-S4-02, AC-UC01-S4-03。

- [X] T036 **UC01-S4 登记爽约：页面及闭环验收**。实现 Web 前台结束时隙的未处理列表/核实爽约入口；未处理不默认计爽约。  运行页面/E2E与对应Given/When/Then验收：未结束拒绝、结束后核实成功；到诊竞争后不覆盖，未处理仍保留原状态，没有定时自动 NO_SHOW。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/appointment-no-show/index.spec.ts`、`apps/admin/src/views/appointment-no-show/index.vue`、`docs/verification/stories/appointment-no-show.md`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T035。验收：AC-UC01-S4-01, AC-UC01-S4-02, AC-UC01-S4-03。

- [X] T037 **UC01-S5 停诊改约：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。停诊旧约由授权前台处理，目标正常且全部预约资格满足；新旧同患者、rescheduled_from_id 至多一个直接后继、无环。成功旧约 CLINIC_RESCHEDULE 取消并新建预约；无可用时等待或核实 CLINIC_CANCEL，不能伪造患者取消。 实现 rescheduleAppointment 的 RESCHEDULE/CLINIC_CANCEL 两分支：RESCHEDULE 必须全部 new_*，CLINIC_CANCEL 禁止 new_*；患者意向及核验引用可查。预先确定新旧牙医/班次/旧预约锁集合；改约的旧取消、新预约/期望治疗/来源链、两端事件/审计/回执整体提交，目标竞争或故障保留旧待处理事实。 文件：`backend/src/main/java/com/adc/application/AppointmentReschedulingService.java`、`backend/src/main/java/com/adc/domain/appointmentrescheduling/AppointmentReschedulingRules.java`、`backend/src/main/java/com/adc/interfaces/AppointmentReschedulingController.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014, T028, T030。验收：AC-UC01-S5-01, AC-UC01-S5-02, AC-UC01-S5-03, AC-UC01-S5-04。

- [X] T038 **UC01-S5 停诊改约：页面及闭环验收**。实现 Web 停诊待办、候选重选、等待及核实诊所取消，显示来源链；失败明确旧预约仍待处理。  运行页面/E2E与对应Given/When/Then验收：合法改约同患者唯一后继；目标失效/已占/并发重试失败原子回滚；无可用不自动删除或误计 PATIENT_CANCEL。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/appointment-rescheduling/index.spec.ts`、`apps/admin/src/views/appointment-rescheduling/index.vue`、`docs/verification/stories/appointment-rescheduling.md`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T037。验收：AC-UC01-S5-01, AC-UC01-S5-02, AC-UC01-S5-03, AC-UC01-S5-04。

- [X] T039 **UC03 记录治疗：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。仅 IN_PROGRESS 登记本人实际实施治疗；实施者可以不同于预约牙医，治疗日有效且经核验必需资质及执业关系；standard_units>0、unit_price>=0、小计 HALF_UP 到分，记录时目录价冻结。至少一个真实有效项目才可完成，实际零价咨询允许但不得虚构。牙医不可自行改价；另授 price.correct 只在开票前核验留旧新价。 实现临床最小风险上下文/实际治疗读取、问题备注、项目保存、授权价格纠错及完成命令；完成/新增在锁内互斥，完成后不新增，开票后只读；实际项目/状态/COMPLETE/审计回执按对应命令原子保存。 文件：`backend/src/main/java/com/adc/application/ClinicalTreatmentService.java`、`backend/src/main/java/com/adc/domain/clinicaltreatment/ClinicalTreatmentRules.java`、`backend/src/main/java/com/adc/interfaces/ClinicalTreatmentController.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014, T032。验收：AC-UC03-01, AC-UC03-02, AC-UC03-03, AC-UC03-04, AC-UC03-05。

- [X] T040 **UC03 记录治疗：页面及闭环验收**。实现 Web 医生工作台的风险提示、备注、本人实施项目与完成；保存一项≤3 次业务操作，另授改价入口独立且保留原因。  运行页面/E2E与对应Given/When/Then验收：替代实施牙医、半分金额/历史调价、无项目完成、资质无效、完成竞态及无改价权限分别验收；治疗不自动开票。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/clinical-treatment/index.spec.ts`、`apps/admin/src/views/clinical-treatment/index.vue`、`docs/verification/stories/clinical-treatment.md`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T039。验收：AC-UC03-01, AC-UC03-02, AC-UC03-03, AC-UC03-04, AC-UC03-05。

- [X] T041 **UC04 结算就诊：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。仅授权收费在 COMPLETED 且有有效实际项目时开票；一就诊一 Invoice，每 AppliedTreatment 至多一 InvoiceItem，名称/单位/历史价/小计冻结、总价逐项求和，跨就诊关联拒绝；重复返回原单。INVOICED 是已结算，不是已付款；形成独立诊疗待缴账单；演示支付及退款由独立费用服务处理，不增加税费或折扣。 实现锁 Appointment 后复用旧单或形成全部费用快照，Invoice/InvoiceItem/INVOICED/INVOICE/审计/回执原子提交；查询仅授权最小结算投影，不披露无关临床资料。 文件：`backend/src/main/java/com/adc/application/InvoiceService.java`、`backend/src/main/java/com/adc/domain/invoicing/InvoiceRules.java`、`backend/src/main/java/com/adc/interfaces/InvoiceController.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014, T040。验收：AC-UC04-01, AC-UC04-02, AC-UC04-03, AC-UC04-04, AC-UC04-05。

- [X] T042 **UC04 结算就诊：页面及闭环验收**。实现 Web 收费核定/生成唯一费用凭据和只读明细，网络未知沿原键查询，费用凭据与缴费记录分开显示，通过独立费用页面办理受控演示缴费。  运行页面/E2E与对应Given/When/Then验收：有效已完成就诊正确逐项开票；并发重复仅一单、故障无半单，后续目录调价不改历史金额，非法状态/关联拒绝。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/invoicing/index.spec.ts`、`apps/admin/src/views/invoicing/index.vue`、`docs/verification/stories/invoicing.md`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T041。验收：AC-UC04-01, AC-UC04-02, AC-UC04-03, AC-UC04-04, AC-UC04-05。

- [X] T043 **UC07 核算季度绩效：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。R1：按 Invoice.issued_at 和实际实施者计收入，CostEntry.incurred_at 计成本；Asia/Shanghai 半开季度，名单含任职相交、离职、零收入及其他有收入/成本者，离职日计入。公共 OPERATING 净额按有效任职/执业 NORMAL 分钟分摊，绝对值截分、余数降序/同余 dentist_id 升序补分后恢复符号，逐凭证及批次守恒。净利润=收入−医疗用品−运营费用，率 0.1000，激励 ROUND(MAX(净利润,0)×0.10,2)。 实现成本准备→一致来源读取→确定性核算→独立复核发布编排，缺封账/零成本范围/用品实施者归属/非零待分摊无分钟保存 INCOMPLETE 及原因，金额未定可空，禁止发布；完整零/负利润可发布零激励。 成本source_reference唯一，已确认凭证不可覆盖；同类型/归属唯一等额反号冲销后补记，零成本保留核实范围。用既有字段保存封账/人员/来源证据，不造牙医0或版本0；REPEATABLE READ冻结统一截止快照及规范input_hash，缺项INCOMPLETE。首次和替换发布均锁稳定Dentist，同事务旧版SUPERSEDED/新版PUBLISHED，保留历史且当前发布唯一；季后作业只计算不自动发布。 文件：`backend/src/main/java/com/adc/application/QuarterlyPerformanceService.java`、`backend/src/main/java/com/adc/application/performance/CostEntryService.java`、`backend/src/main/java/com/adc/application/performance/PerformancePublicationService.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014, T024, T042。验收：AC-UC07-01, AC-UC07-02, AC-UC07-03, AC-UC07-04, AC-UC07-05, AC-UC07-06, AC-UC07-07, AC-UC07-08, AC-UC07-09。

- [X] T044 **UC07 核算季度绩效：页面及闭环验收**。实现总部成本核验/冲销、季度准备缺项、来源分摊、计算及独立复核发布页面；分离计算/发布能力及步骤，记录可信操作主体，旧版本只读可追溯。  运行页面/E2E与对应Given/When/Then验收：独立虚构季度覆盖 1000−100−200=700/激励70、100.01 等分钟尾差、负净额、跨季、离职名单、缺项、零/负利润、重复来源/冲销及并发首次/替换发布全部九场景。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/quarterly-performance/index.spec.ts`、`apps/admin/src/views/quarterly-performance/index.vue`、`docs/verification/stories/quarterly-performance.md`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T043。验收：AC-UC07-01, AC-UC07-02, AC-UC07-03, AC-UC07-04, AC-UC07-05, AC-UC07-06, AC-UC07-07, AC-UC07-08, AC-UC07-09。

- [X] T045 **UC08 运营分析：后端与规则测试**。先写本模块契约/领域/真实MySQL正常、边界、越权、并发和回滚测试，再实现领域规则、应用编排及已批准API；同批运行对应测试。按 A1a/B13 相同期间/可复现截止及口径版本，不能重建历史则返回不可用；结束时隙队列排除 CLINIC_CANCEL/CLINIC_RESCHEDULE，未处理单列并暂定；零分母/缺项不可算，不补0。治疗按 performed_at 同单位加权，技能覆盖为有效全部必需资质 NORMAL 时隙/全部 NORMAL 时隙，不是空闲比例；绩效只用当前 PUBLISHED，历史/敏感另授权。 实现取消三指标、治疗比较、技能覆盖、当前绩效对比、统一资料覆盖及有效治疗七要素追溯查询；一致只读快照，列明分子分母/排除/缺失/版本/截止，敏感查询审计、无来源写入。 文件：`backend/src/main/java/com/adc/application/AnalyticsService.java`、`backend/src/main/java/com/adc/domain/analytics/AnalyticsRules.java`、`backend/src/main/java/com/adc/interfaces/AnalyticsController.java`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T014, T022, T036, T038, T044。验收：AC-UC08-01, AC-UC08-02, AC-UC08-03, AC-UC08-04, AC-UC08-05, AC-UC08-06。

- [X] T046 **UC08 运营分析：页面及闭环验收**。实现总部分析筛选、暂定/不可算说明、样本分母和授权来源下钻；聚合默认最小披露，不能以图表掩盖缺项。  运行页面/E2E与对应Given/When/Then验收：验证 12→排除2→分母10 的20%/10%/30%，10/60 金额与1/3单位得17.50，技能6/10=60%不受4占用影响；当前发布、零分母、缺七要素及不可复现截止拒绝伪结果。 未取得真实环境的项目明确未执行，不能用模拟宣称真实微信已通过。 文件：`apps/admin/src/views/analytics/index.spec.ts`、`apps/admin/src/views/analytics/index.vue`、`docs/verification/stories/analytics.md`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T045。验收：AC-UC08-01, AC-UC08-02, AC-UC08-03, AC-UC08-04, AC-UC08-05, AC-UC08-06。

## D. 系统实测、部署及运行期验收

- [X] T047 **贯通完整系统业务链**。贯通总部组织资源→前台建档/过敏→真实绑定→排班→UC01 五场景→本人实施诊疗→费用凭据→成本/季度计算/独立发布→只读分析。复验全部允许/拒绝状态迁移、历史保护及职责分离；检查只有原 UC/SF、五状态与四取消分类，Appointment及Invoice不增加已付款状态，演示缴费退款使用独立账单及订单并明确不扣真实款。 文件：`backend/src/test/java/com/adc/application/LifecycleHistoryIT.java`、`docs/verification/system-journey.md`、`tests/e2e/system-journey.spec.ts`。依赖：T016, T018, T020, T022, T024, T026, T028, T030, T032, T034, T036, T038, T040, T042, T044, T046。验收：AC-G01, AC-G05, AC-G08。

- [X] T048 **系统权限与真实并发故障验收**。直接调用所有操作执行患者甲/乙、诊所A/B前台、医生/收费/分权总部的允许及拒绝矩阵，含字段级敏感披露、会话到期/退出/停用/撤权、绑定替换；验证 csrf/Origin、真实可信来源限流、注入输入、日志无秘密及审计完整。 跨连接/多应用实例真实 MySQL 并发及逐步故障注入：排班首次/跨诊所、预约抢占、到诊取消爽约、停诊改约、治疗完成、同就诊开票、绑定双向唯一、成本冲销、绩效首次/替换发布；包含审计/回执失败、断连/回滚、命名锁释放失败及重试，不用 SQLite/Mock 替代。 文件：`backend/src/test/java/com/adc/identity/AuthorizationMatrixIT.java`、`backend/src/test/java/com/adc/system/ConcurrencyFailureIT.java`、`docs/verification/concurrency-faults.md`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T047。验收：AC-G02, AC-G03, AC-Q04, AC-Q06, AC-Q07, AC-Q08。

- [X] T049 **配置扩展及历史保护验收**。执行 Q02/Q09：通过正常授权功能各新增诊所/治疗/过敏/资质和合法班次，验证可选可录入及历史不变；从新诊所资料齐备计时至可排班预约≤1工作日；回归历史价、占位、个人提成及发布，新增核算公式须走规则变更流程。 文件：`docs/verification/quality/q02-q09-results.md`、`tests/e2e/resource-extension.spec.ts`。依赖：T047。验收：AC-Q02, AC-Q09。

- [X] T050 **Linux/Docker隔离部署与HTTPS就绪**。落实 C-05 Linux x86_64 云资源、应用/数据库、独立备份介质、域名和 HTTPS 输入；编写后端/前端 Docker 构建、Compose、反向代理、非 root、健康检查/日志脱敏/秘密挂载及独立 migrator 顺序；准备发布/回滚手册并在隔离目标验证，不将本任务清单当作发布生产授权。 为 T051 交付隔离联调后端及可从微信访问的 HTTPS 地址，验证证书、代理转发与健康检查并记录就绪证据；此步骤不执行生产发布。 文件：`apps/admin/Dockerfile`、`backend/Dockerfile`、`ops/compose/compose.prod.yaml`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T047。验收：本项工程完成条件。

- [X] T051 **真实微信与身份联调**。执行 C-04 后续实施：通过受控配置取得真实 AppID/AppSecret、合法域名/HTTPS和微信开发工具环境，联调 wx.login→code2Session→ADC Session、人工绑定/换号/旧会话拒绝及失败路径。核实首位总部初始化和独立员工登录，保存脱敏步骤/期望/实际；真实配置缺失则标待实施，不重新选择身份架构。 使用 T050 已部署验证的隔离联调环境；开始前检查可从微信访问的合法 HTTPS 域名、证书、反向代理和健康检查均就绪，不以开发工具跳过域名校验作为通过证据。 文件：`docs/verification/identity/pv-id01-05.md`、`ops/runbooks/wechat-integration.md`。依赖：T048, T050。验收：AC-Q06, AC-SF01-01, AC-SF02-01, AC-SF02-02。

- [X] T052 **页面与业务流程体验检查**。页面入口清楚，登录与本人资料状态明确；完成预约不超过4次业务提交或确认，保存治疗不超过3次。通过组件交互、接口及实际页面自动化检查，验证导航、表单提示、预约、治疗保存及结果读回。保留模拟接口与真实环境的验证边界；负责人日常使用确认体验，不强制招募参与者、培训或提交人工记录。自动化指定场景通过，业务提交与确认次数符合目标，成功及错误提示明确；结果与后台一致，无权限绕过。不将自动化结果描述为人工实验。 文件：`docs/verification/quality/q01-results.md`、`tests/usability/q01-protocol.md`。依赖：T051。验收：AC-Q01。

- [X] T053 **当前小规模部署Q03实测**。30诊所、100牙医、1万患者、10万预约、20万治疗。隔离Linux容器合计CPU上限2核、内存上限2GB，独立负载进程；10并发持续20分钟，每用户约2秒一次请求，候选检索/治疗保存/结算占60%/20%/20%。另在现有2核2GB云端执行5并发5分钟只读验证。隔离测试不少于5000次实际成功请求，各类P95≤3秒，非预期错误率<1%，配比误差≤0.5个百分点；云端不少于600次只读请求，P95≤3秒且错误率<1%。保存原始样本、资源和落库核对，不推断100并发或云端大规模写入容量。 运行真实岗位授权与独立库存，验证实际新增治疗、唯一费用凭据/明细、INVOICED/事件、金额、审计和回执一致，保存资源限制、采样、原始结果和版本。文件：`docs/verification/performance/q03-results.md`、`tests/performance/q03.js`、`tools/verification/run-q03-small.mjs`。依赖：T048, T050。验收：AC-Q03。

- [X] T054 **备份实现与隔离恢复实测**。实现一致全备、连续binlog归档和清单校验：每天全量、最长未归档跨度≤15分钟、可恢复30天完整链，独立介质；覆盖三个schema含身份/回执/迁移历史/审计及同一位点、版本/摘要/配置秘密恢复途径。提供 verify-manifest.sh MANIFEST、restore-to-position.sh MANIFEST POSITION、verify-consistency.sh CONFIG 入口及告警，禁止打包活卷假冒备份。 执行 C-05/Q05 全新隔离目标恢复演练，运行清单校验→指定共同位点恢复→一致性核验；从取得备份开始计时RTO≤4小时、实际丢失跨度RPO≤15分钟，核对24/209/44、金额/分摊、状态事件、唯一开单/发布、绑定/授权/审计/回执及原键重试；恢复秘密配置并使恢复前会话受控失效，不覆盖原环境。失败保留证据修正后重演。 量化依据：原始Word第二章表B12的Q05、Spec的AC-Q05/SC-008及Plan的Reliability/Security；binlog共同位点、独立介质和计时方式沿用获批Plan/quickstart，不新增指标。备份/恢复工具随系统准备，完整隔离演练在T048/T050之后执行；缺环境记未执行，不阻塞前序功能开发与课程演示，最终Q05仍须按原标准取得实测证据。不得将额外生产SLA或更严恢复目标默认为交付门禁。 文件：`docs/verification/recovery/q05-drill.md`、`ops/backup/archive-binlog.sh`、`ops/backup/full-backup.sh`（其余精确路径见本任务catalog.paths，不增新的文件要求）。依赖：T048, T050。验收：AC-Q05。

- [X] T055 **TD-01确认与发布就绪审核**。核对已批准的一期不自动删除策略，保留账号、绑定、授权、限流及回执历史；审计至少1年、备份可恢复30天。运行全量构建/契约/领域/MySQL/E2E及适用质量检查，冻结具体候选及源码指纹，核对微信、云资源、秘密、备份监测及恢复；形成工程审核及正式发布前条件清单。工程审核完成不代表正式发布获批，季度验收按T056受控虚构演练执行，不声称真实营业事实。文件：`docs/verification/release-readiness.md`、`ops/runbooks/release-checklist.md`、`ops/runbooks/technical-record-retention.md`、`docs/verification/release-engineering-review.json`。依赖：T049, T051, T052, T053, T054。验收：本项工程完成条件。

- [X] T056 **受控虚构完整季度演练**。按AC-SC-01/02在隔离真实MySQL中准备完整虚构季度及全部演练诊所资料，实际执行R1核算和独立身份复核发布。统一资料覆盖和有效治疗七项追溯均100%，缺成本拒绝发布、缺诊所使用记录不伪报完整；模拟工作日耗时≤1，实际墙钟耗时另列。初始历史为明确标记的虚构夹具，不声称真实营业结果，不改变生产业务时钟或在线资料。文件：`backend/src/test/java/com/adc/infrastructure/CourseQuarterAcceptanceIT.java`、`docs/verification/business/first-complete-quarter.md`、`docs/verification/business/coverage-traceability.md`。依赖：T055。验收：AC-SC-01, AC-SC-02。

## 历史依赖与本次调整

旧T092/T093→T140变为新T030→T021（PatientView服务器引用）；旧T175→T178变为新T051→T050（隔离HTTPS先就绪）。原2026-11-09 Analyze的I1/I2关闭记录保留，不能把它作为本次修订已Analyze的证明。

T008只准备测试→T009迁移入口→T010及T011建表/映射准备→T012实际迁移与结构/权限验收→T013共享事务安全基础→T014基础门禁。后续不得因精简而跳过真实数据库验收。

当前任务与已批准的精简预约、医生资料及演示费用规则一致；Word、ERD、契约和实现按T057—T064同步。原T052—T056继续按各自条件验收。













## 患者预约与演示费用

- [X] T057 **精简登记及演示费用测试**。`backend/src/test/java/com/adc/infrastructure/PatientBillingIT.java`；`backend/src/test/java/com/adc/infrastructure/PatientBillingHttpIT.java`；`tests/unit/mini-registration.test.mjs`。依赖：T051。验收：AC-PB-01, AC-PB-02, AC-PB-03。

- [X] T058 **预约费用数据迁移与契约**。`backend/src/main/resources/db/migration/V201__patient_booking_and_demo_billing.sql`；`docs/diagrams/database/schema.json`；`specs/001-system-specification/contracts/openapi.json`。依赖：T057。验收：AC-G04, AC-PB-02。

- [X] T059 **精简资料与患者预约体验**。`apps/patient-miniprogram/miniprogram/pages/patient-bindings/index.ts`；`apps/patient-miniprogram/miniprogram/pages/appointment-booking/index.ts`。依赖：T058。验收：AC-PB-01。

- [X] T060 **号源保留及演示费用后端**。`backend/src/main/java/com/adc/application/PatientBillingService.java`；`backend/src/main/java/com/adc/infrastructure/PatientBillingStore.java`；`backend/src/main/java/com/adc/interfaces/PatientBillingController.java`。依赖：T058。验收：AC-PB-02, AC-PB-03。

- [X] T061 **双端费用及医生资料页面**。`apps/admin/src/views/patient-bills/index.vue`；`apps/admin/src/views/organization-resources/DoctorFeePolicy.vue`；`apps/patient-miniprogram/miniprogram/pages/patient-bills/index.ts`。依赖：T059, T060。验收：AC-PB-01, AC-PB-03。

- [X] T062 **预约缴费云端与微信联调**。`docs/verification/patient-billing-20261125/README.md`；`tools/deployment/configure-billing-demo.mjs`。依赖：T061。验收：AC-PB-01, AC-PB-02, AC-PB-03。

- [X] T063 **当前需求文档与Spec一致性**。`安德鲁牙科连锁管理系统需求分析与设计.docx`；`specs/001-system-specification/spec.md`；`tools/diagrams/verify.py`。依赖：T058, T064。验收：AC-G04, AC-G08, AC-PB-01, AC-PB-02, AC-PB-03。

- [X] T064 **确认并发布当前ERD及清理旧图源**。`图源/D1_数据库ER图.pdf`；`docs/diagrams/database/D1-database.dbml`；`docs/diagrams/official/D1.png`。依赖：T058。验收：AC-G04。


