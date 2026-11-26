# Plan 补充审核记录：业务数据库边界与真实身份

日期：2026-11-07。状态：当前Plan及补充技术设计已于2026-11-07经项目负责人正式批准，基线ADC-PLAN-20261107-01；本轮仅修正事项状态。
范围：原 Word 业务数据库保真、技术表落地、数据库/应用引用边界、Schema 精简、真实身份与本人核验。
本轮未修改 Constitution、Spec、原 Word、原业务 ERD 或原 schema/constraints，未编写业务代码/DDL/部署文件。

## 审核结论与问题处理

| ID | 原问题与影响 | 修订结果 | 证据与残余验证 |
| --- | --- | --- | --- |
| DB-01 | 将“原全库30FK”误读为全系统技术存储上限，会使SF身份/会话/审计无明确数据模型 | 原D1明确为19表业务ERD，技术表另建独立模型，不覆盖原图 | [业务基线审核](business-baseline-audit.md)、[技术模型](technical-data-model.md) |
| DB-02 | 只确认19/163/30计数不能证明字段/类型/键保真 | 直接读取最终Word D3—D21，163行六列逐项对照schema.json和data-model.md；差异0 | [163字段与30FK明细](business-baseline-audit.md)、[机器证据](business-baseline-audit.json)；实际数据库尚未检查 |
| DB-03 | 唯一键成员标记容易被拆成多个单列唯一，NORMAL条件唯一容易误改为全局唯一 | 明列普通/组合/条件唯一语义，保持15单列PK和4复合PK；NORMAL只在稳定Dentist锁内检查，允许SUSPENDED多版 | D22及审核报告；后续实测条件/跨行约束，不能只验普通索引 |
| DB-04 | adc_identity/audit/control/meta只列概念，无法审查实际表数和数据职责 | 身份技术13表（含回执/工具历史）＋审计1表；共14张技术表、110字段、19条纯技术FK、12项应用引用，逐表给出类型/PK/UNIQUE/FK/约束 | [technical-schema.json](technical-schema.json)、独立技术ERD；尚未执行迁移 |
| DB-05 | 对跨库关联只说“独立”而未区分数据库约束与服务保证 | 技术表内部FK及AuditEvent→Subject数据库FK明确列出；到Patient/Clinic/Dentist及多态对象为APP引用，当前读/对象权限/固定锁序/事务/恢复巡检保证 | 技术模型关联清单；技术引用不追加进原业务30FK |
| DB-06 | control/meta各自一表却单独建库，增加初始化/权限/恢复组织成本 | 五物理schema精简为三；RequestReceipt、flyway_schema_history并入identity；audit保留独立权限/保留边界 | research R-D08；运行账号逐表授权，独立migrator；实际权限待验 |
| ID-01 | 微信账号真实性与患者本人身份可能被混同 | 真实code2Session→精确外部身份→Subject→ADC会话，再经人工核验→当前本人绑定；不自报OpenID，不按电话/姓名/UnionID合并 | [identity.md](contracts/identity.md)、research R-D09；真实平台联调未执行 |
| ID-02 | 绑定申请要求预先提供核验引用，无法解释该证据由谁、何时生成 | 申请只交编号/生日线索和服务点；前台比对原Patient、核实本人及服务依据，批准时原子生成可查核验事实 | 修订OpenAPI的BindingRequest/BindingApproval及新BindingVerification；不用假字符串充当证据 |
| ID-03 | 新账号重绑缺少新主体申请与批准闭环，可能出现先双绑或单边解绑 | rebind引用新主体PENDING申请；批准、新旧映射、BindingEvent、AuditEvent、RequestReceipt同事务；旧会话后续失权 | CurrentPatientBinding的主体PK/患者UNIQUE；ExternalIdentity主体UNIQUE；PV-ID02—04待实测 |
| ID-04 | 限制登录、CSRF、员工初始化可能隐含未列出的表或默认身份 | LoginThrottle/Session/StaffAccount等明确落表；匿名CSRF签名上下文不建表；无Spring Session/Quartz隐藏表；初始总部受控创建、无默认共享密码 | 身份契约及14表清单；初始化/CSRF/生产适配器待执行验证 |

本次消除设计遗漏，没有以未经确认政策改变原业务。技术定义是本 Plan 的可评审方案，
这14张技术表属于现已批准的Plan设计，不冒充原Word已有规定；批准记录见[plan-approval.md](plan-approval.md)。

## 原 Word 保真核对

权威来源：根目录《安德鲁牙科连锁管理系统需求分析与设计.docx》，
SHA-256 为 556456e8c492d245363b34e24f056aff3bf3113a1d538f9c9247688f1340a203。
直接解包 Word 读取 D3—D21 表格；每字段比较名称、原类型、PK、FK、可空性、唯一标记，
同时比较字段顺序，19表/163字段/30FK文档差异为0。
D22的25行规则、D23的5行状态、D24的21行关系与现有约束索引逐行相同。

原 Word 未定义的键、字段或关系不自行补造：Patient.phone不唯一；
Appointment没有appointment_number字段；DentistClinicAssignment不擅自加组合UNIQUE；
DentistQualification沿原复合PK；CostEntry→QuarterlyPerformance仍是source_snapshot逻辑N:M。
不新增付款状态、实际支付或渠道；INVOICED是费用结算，R1仍为个人季度净利润正额的10%。
核对结果证明目标文档保真，不证明实际MySQL已安装约束。

## Schema 与实际表映射

| 原设计名称 | 修订后物理位置 | 明确表名 |
| --- | --- | --- |
| adc_business | adc_business | 原19张业务表，逐表见基线报告 |
| adc_identity | adc_identity | Subject、ExternalIdentity、StaffAccount、Session、LoginThrottle、BindingRequest、CurrentPatientBinding、BindingEvent、AccessGrant、GrantClinicScope、GrantCapability |
| adc_audit | adc_audit | AuditEvent |
| adc_control | 并入adc_identity；不再创建旧名schema | RequestReceipt |
| adc_meta | 并入adc_identity；不再创建旧名schema | flyway_schema_history |

同实例三schema、一个业务事务连接。数据库FK保证技术主体/授权等引用；应用服务保证技术到原业务对象引用。
运行账号无DDL、无工具历史写权限、无审计修改/删除权限；迁移器单独配置历史表落点。
MySQL DDL的隐式提交性质不能按业务事务全回滚处理。备份/恢复覆盖三个schema及共同binlog位点。

## 独立图与文档同步

- [完整技术ERD](diagrams/technical-erd.mmd)：仅14张技术表及19条技术FK，完整字段和组合键见技术模型。
- [技术与业务边界图](diagrams/storage-boundaries.mmd)：实线技术FK分组概览、虚线应用验证；不是原D1的重画。
- [边界概览 PNG](diagrams/technical-storage-overview.png) / [SVG](diagrams/technical-storage-overview.svg)：已本地绘制并查看，完整技术Mermaid尚无专用渲染证据。
- [data-model.md](data-model.md) 保留原19表完整字段，技术字段单一维护于 technical-data-model.md/json。
- [plan.md](plan.md)、[research.md](research.md)、[quickstart.md](quickstart.md)、
  [traceability.md](traceability.md)、[api.md](contracts/api.md)、[identity.md](contracts/identity.md)
  已同步三个物理schema与真实身份核验流程。
- [openapi.json](contracts/openapi.json) 与 [operations.md](contracts/operations.md) 同步SF02 DTO；
  保持83个操作及对应当前路径，不新增业务用例或任意表修改入口。

## Constitution 六原则复核

| 原则 | 补充设计结论 | 依据与边界 |
| --- | --- | --- |
| I 来源与追踪 | 符合 | 原Word直接逐字段复核，D22—24逐行一致，保留原件与原编号；PV验证项映射原AC |
| II 业务/身份/权限 | 符合 | 原UC/SF/Q/R1不改，登录与本人绑定分层，Q1双向唯一与旧绑定失效，逐请求对象授权 |
| III 原表/金额/历史 | 符合 | 19/163/30保真；技术表独立；条件唯一不改全局；原逻辑快照不伪造FK |
| IV 架构与部署 | 符合 | 小程序/Web共用后端，同一MySQL单主三个schema；Windows/WSL2开发及Linux/Docker目标保持 |
| V 验证/事务/安全 | 设计符合，运行待验 | 技术FK与APP引用保证方式明确，同连接审计/回执原子性、统一恢复点；真实数据库/微信/性能/恢复未执行 |
| VI 流程与明确审核 | 符合 | 历史补充审核时只补充Plan；当前Tasks及Analyze已完成，待负责人最终版本审核，尚未Implement |

未发现需要修改宪章或原业务政策才能继续本次文档设计的冲突。
这不是对尚不存在的实现作通过判定，正式Analyze及其后的实施审核仍属后续阶段，当前Plan批准已记录。


## 工具验证、治理期限及后续工作承接

| 编号 | 当前状态 | 处理时点 |
| --- | --- | --- |
| C-03 | 后续必要工具验证；原重建源及新增技术Mermaid专用解析/渲染未执行 | 采用重建模型前完成；不是负责人未决定业务想法 |
| TD-01 | 已确认一期不启用自动删除，仅失效、停用及撤权，保留历史 | 后续物理清理另行明确范围并确认；审计至少1年与备份30天保持 |

| 已批准/承接编号 | 状态 | 后续实施、验收工作 |
| --- | --- | --- |
| C-02 | 数据库产品、版本线与约束实现已批准 | 实施时锁版本，执行实际迁移及约束验证 |
| C-04 | 身份架构设计已批准 | 真实微信配置、账号初始化及实际联调转后续实施任务 |
| C-05 | 云部署、性能与恢复方案已批准 | 云资源/备份介质、Q03测试与Q05恢复演练转后续实施及验收任务 |

已关闭或移出范围的登记及批准文件指纹见[plan-approval.md](plan-approval.md)。

本轮执行：Word逐行提取对比、JSON解析与本地引用/键目标核查、技术表/外键/应用引用计数、
API操作与原验收编号导航、Markdown链接/表格及受保护来源哈希复核。
未执行：实际数据库DDL/约束安装核验、并发/故障注入、微信真实代码交换与真机登录、
依赖构建、Q03性能、Q05恢复、生产部署或完整OpenAPI元模式验证。
后续Given/When/Then验证项PV-DB01—03、PV-ID01—05详见技术模型，不替代84个AC。
