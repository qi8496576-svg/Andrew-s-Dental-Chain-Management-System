# 系统级需求与验收追踪矩阵

**规约**：[spec.md](spec.md)，当前规约；**日期**：2026-11-25。本文整理原编号，不增加业务范围。章节、表号、图号均来自最终 Word，图与表的 D1 分别注明。

追踪链为：原文章节/表 → 原需求/规则 → 本规约 FR → 正式模型/协作 → 原关系模式及关键字段 → 接口设计 → Given/When/Then 验收。本轮 Plan 已形成数据/接口/验证方案，设计定位见文末；实施及测试结果见当前tasks.md和docs/verification/patient-billing-20261125/README.md。Tasks定位已在 task-traceability.md 补充；后续在实现和验收阶段补充真实定位，不以文档存在宣称实现或测试通过。所有验收定义见 spec.md，不是已执行结果。

## 用例、场景与身份支撑

| 原需求 | 原文章节及表 | FR | 正式模型及职责 | 原业务表/关键字段 | 验收场景 |
| --- | --- | --- | --- | --- | --- |
| UC01 预约就诊 | 第二章（五），B3、B4、B4a—B4d；第三章 C2/C3 | FR-001—005、017—019、025 | B1、C4、C13—C16、C12；预约/到诊/取消/爽约/改约控制共享就诊实体 | 下列五场景合计；不建立独立 UC09—UC12 | 所有 AC-UC01-S1—S5 场景；AC-G01—03、G08 |
| UC01-S1 创建预约 | 第二章（五），B3、B4；D22、D25 | FR-001 | C4；患者接口/前台代办→预约控制→患者、牙医、排班、就诊；C1—C3、C12 | Patient.allergy_review_status；PatientAllergy；Clinic；DentistQualification 的核验/有效期；DentistClinicAssignment 的有效期；DentistSchedule 的状态、粒度、区间；TreatmentQualification；Appointment 的患者/班次/诊所/牙医/时间/status；AppointmentRequestedTreatment；AppointmentEvent 的 BOOK/request_key/details | AC-UC01-S1-01—06；AC-Q01、Q03、Q04、Q07 |
| UC01-S2 确认到诊 | 第二章（五），B4a；D22、D23、D25 | FR-002 | C13、C12；前台→到诊控制→就诊 | Appointment.status、attended_at；DentistSchedule.schedule_status；AppointmentEvent 的 ATTEND/from_status/to_status/actor_role/actor_reference/request_key | AC-UC01-S2-01—03；AC-G01—03；AC-Q04、Q07 |
| UC01-S3 取消预约 | 第二章（五），B4b、B13；D22、D23 | FR-003 | C14、C12；患者/前台→取消控制→就诊 | Appointment 的预约/取消时点、取消分类/原因/status；DentistSchedule；AppointmentEvent 的 CANCEL/原因/主体/请求键；Patient 的本人绑定依据由身份组件提供 | AC-UC01-S3-01—04；AC-Q07、Q08；AC-UC08-01 |
| UC01-S4 登记爽约 | 第二章（五），B4c；D22、D23 | FR-004 | C15、C12；前台→爽约控制→就诊 | Appointment 的 status/取消时点/NO_SHOW 分类；DentistSchedule 的时隙粒度用于计算结束；AppointmentEvent 的 CANCEL/核实主体/原因/request_key | AC-UC01-S4-01—03；AC-G01；AC-UC08-01 |
| UC01-S5 停诊改约 | 第二章（五），B4d；D22、D24、D25 | FR-005 | C16、C12；前台→改约控制→旧/新就诊、排班 | DentistSchedule.schedule_status；Appointment.rescheduled_from_id、patient_id、旧 CLINIC_RESCHEDULE/CLINIC_CANCEL 及新归属；AppointmentRequestedTreatment；AppointmentEvent 两端事件；新安排读取资质/执业/目录 | AC-UC01-S5-01—04；AC-G01、G03、G05；AC-Q04 |
| UC02 管理出诊排班 | 第二章（六），B11、B11a；D11、D22 | FR-006 | C5；前台→排班控制→牙医、出诊排班；C1—C3 | DentistClinicAssignment 的有效区间；DentistSchedule 的 dentist_id、clinic_id、schedule_date、start_time/end_time、slot_minutes、schedule_status；Appointment 受影响引用；AppointmentEvent 在后续 S5 写入 | AC-UC02-01—03；AC-Q02、Q09；AC-UC01-S5-01—04 |
| UC03 记录治疗 | 第二章（五），B5、B6；D16、D22、D23、D25 | FR-007 | C6、C12；牙医→治疗控制→就诊、治疗项目、施用治疗；小计属施用治疗 | Appointment.status、问题/特殊需求、completed_at；Treatment 默认价/状态；AppliedTreatment 的 appointment_id/treatment_id/dentist_id/standard_units/unit_price/subtotal/performed_at；DentistQualification、Qualification、DentistClinicAssignment；AppointmentEvent.COMPLETE；Invoice 只读边界 | AC-UC03-01—05；AC-G01、G07；AC-Q01、Q03、Q07 |
| UC04 结算就诊 | 第二章（五），B7、B8；D17、D18、D22、D25 | FR-008 | C7、C12；收费→结算控制→就诊/结算单/施用治疗；结算单汇总，控制不算金额 | Invoice.appointment_id/invoice_number/issued_at/total_amount；InvoiceItem 的 applied_treatment_id、invoice_id/line_number 和名称/单位/价格/小计快照；AppliedTreatment；Appointment.status；AppointmentEvent.INVOICE；另以PatientBill、PaymentOrder及RefundOrder关联费用办理事实 | AC-UC04-01—05；AC-G03、G07—08；AC-Q03、Q04 |
| UC05 维护患者资料 | 第二章（六），B11b；D3—D5 | FR-009 | C8；患者首次登记或前台安全维护→患者资料控制→患者/过敏症；共享目录由 UC06 维护 | Patient 的编号、姓名、生日、联系、账单及紧急联系人、allergy_review_status；Allergy 读取；PatientAllergy 的复合键、程度/备注、撤销及 audit_history | AC-UC05-01—04；AC-Q07、Q08；AC-SF02-01—03 |
| UC06 维护组织资源 | 第二章（六），B11c；D4、D6—D10、D12—D13 | FR-010 | C9；总部→资源控制→诊所/牙医/目录实体；C1—C3 | Clinic；Dentist 的任职及员工号；Qualification；DentistQualification 的证书/核验/日期；DentistClinicAssignment 的日期；Treatment 默认价；TreatmentQualification 的必需性；Allergy | AC-UC06-01—04；AC-Q02、Q09；AC-G05 |
| UC07 核算季度绩效 | 第二章（五），B9、B10、B13；第四章第十五节，D19、D20、D22、D25 | FR-011、023 | C10；季度时点/管理接口→绩效控制→牙医、结算单、成本凭证、季度绩效；独立复核发布 | Invoice.issued_at；InvoiceItem→AppliedTreatment.dentist_id；CostEntry 的发生时间/归属/金额/来源/确认/冲销；Dentist 任职；DentistSchedule NORMAL 有效分钟及 DentistClinicAssignment；QuarterlyPerformance 的季度/版本/金额/状态/input_hash/source_snapshot/published_at | AC-UC07-01—09；AC-G03、G05—07；AC-Q04、Q08、Q09；AC-SC-01 |
| UC08 运营分析 | 第一章 A1a；第二章（六）B11d、指标定义、B13；第三章 C3 | FR-012、024 | C11；管理接口→分析控制→指标责任实体；只读投影 | Appointment 的应诊时点/状态/取消分类；AppliedTreatment.performed_at/单位/小计/实施者；Treatment；DentistSchedule、资格/执业；Clinic 营业范围；QuarterlyPerformance 当前 PUBLISHED；营业接入/使用和口径来源按原文，不新增业务表 | AC-UC08-01—06；AC-Q07、Q08；AC-SC-01—02 |
| SF01 登录与退出 | 第二章 B12b；第四章（十四）D26 | FR-013 | D2；登录入口→独立身份组件→业务服务校验 | 账号/会话独立存储，无对应业务表，不写就诊状态 | AC-SF01-01—02；AC-Q06；AC-G02 |
| SF02 登记与关联本人档案 | 第二章 B12a、B12b；D26；本规约 Clarifications 2026-11-07 Q1 的负责人明确确认 | FR-014 | D2；首次本人登记自动关联；已有档案安全核实关联；业务服务校验当前映射 | 首次本人登记创建新Patient，已有档案仅作安全核验读取；subject_id/patient_id 有效绑定双向至多一个，重绑后旧绑定失效、历史保留；绑定及证据属身份存储，不新增业务表 | AC-SF02-01—03（含并发冲突、人工重绑及旧会话失去本人访问）；AC-UC05-01—02；AC-Q07、Q08 |
| SF03 管理员工账号 | 第二章 B12b；D26 | FR-015 | D2；具账号管理权限的总部→身份组件 | 账号独立存储，仅牙医适用时关联 Dentist；其他岗位不得伪造为牙医 | AC-SF03-01—02；AC-Q06、Q08 |
| SF04 分配诊所权限 | 第二章 B12a、B12b；D26 | FR-016 | D2；具授权管理权限的总部→身份组件；业务服务每次复核 | 角色、诊所范围、有效期、授权变更属身份存储；引用 Clinic 范围不写 Clinic 授权字段 | AC-SF04-01—02；AC-Q06—08；AC-G02 |

## 共同规则与数据约束

| 规约编号 | 原来源 | 模型/数据定位 | 明确验收 |
| --- | --- | --- | --- |
| FR-017 五状态及事件 | 第三章 C2、图 C12；第四章 D22、D23 | Appointment.status 及事实时点，AppointmentEvent 的 BOOK/ATTEND/CANCEL/COMPLETE/INVOICE；取消四分类 | AC-G01；AC-UC01-S2-01—03、AC-UC01-S3-01—04、AC-UC01-S4-01—03、AC-UC01-S5-01—04、AC-UC03-02—03、AC-UC04-05 |
| FR-018 权限及披露 | B12a、B12b；D26；宪章 II/V | D2；身份组件与 Patient/Clinic/Appointment/AppliedTreatment 对象范围 | AC-G02；AC-SF01-01—02、AC-SF02-01—03、AC-SF03-01—02、AC-SF04-01—02；AC-Q06—08 |
| FR-019 原子性/幂等 | B4、B8、B10；D22、D25；宪章 V | C4、C7、C10、C13—C16；班次/就诊/单据/事件/绩效及独立审计；请求主体与内容摘要 | AC-G03；AC-UC01-S1-05—06、AC-UC01-S5-03—04、AC-UC04-02—04、AC-UC07-07；AC-Q04 |
| FR-020 数据基线 | 第四章 D1—D24，图 D1；宪章 III | 24 表的全体 209 字段/44 外键；15 单列主键、4 复合关联主键，条件唯一及跨表规则 | AC-G04；spec.md Key Entities；结构检查不得替代真实约束验收 |
| FR-021 历史保护 | B6、B8、B11a—c；D5、D11、D16、D18—D22；宪章 III | C1、C12、D1；PatientAllergy.audit_history、冻结治疗/开票、Appointment 来源、CostEntry 冲销、QuarterlyPerformance 旧版本 | AC-G05；AC-UC03-04—05、AC-UC05-04、AC-UC06-03、AC-UC07-07—08 |
| FR-022 金额及时间 | B6、B8、B10；D16—D20；第四章（八）（十三）（十五）；宪章 III | 原金额/单位/比率类型及小计、total_amount；issued_at/incurred_at/performed_at；季度区间 | AC-G06—07；AC-UC03-01、AC-UC04-01、AC-UC07-03—04 |
| FR-023 R1 | B9、B10、B13；D19、D20、D22；第四章第十五节 | C10、D1；以下 R1 子规则矩阵 | AC-UC07-01—09 |
| FR-024 指标口径 | A1a、B11d、B13 及第二章指标定义 | C11；预约队列、实际治疗、有效班次、当前绩效及来源标识 | AC-UC08-01—06；AC-SC-01—02 |
| FR-025 范围 | B1—B12b、B7/B8；C2/C3；D17/D18、D26；宪章 II/III | B1 八用例、C12 已结算终态、D1 十九表；身份支撑独立 | AC-G08；AC-UC04-05 |

### R1 子规则追踪

| R1 子规则（仅导航标签） | 原来源与字段 | 验收 |
| --- | --- | --- |
| 人员范围与离职日 | B9、B13；Dentist.hire_date/termination_date 及当季收入/成本归属 | AC-UC07-02 |
| 开票收入与逐项实施者 | B10、B13；Invoice.issued_at→InvoiceItem.applied_treatment_id→AppliedTreatment.dentist_id | AC-UC07-01、AC-UC07-03、AC-UC03-04 |
| 成本归期/归属及缺失 | B9/B13、D19、D22；CostEntry.incurred_at、成本类型、归属、确认及来源 | AC-UC07-05、AC-UC07-08 |
| 有效分钟与分摊尾差 | B13、第四章第十五节；Dentist 任职、DentistClinicAssignment 区间、DentistSchedule NORMAL；source_snapshot 完整分摊 | AC-UC07-04—05 |
| 个人利润与非负 10% 激励 | B10、B13、D20/D22；个人 revenue/medical_supply_cost/operating_expense/net_profit/incentive_rate/incentive_amount | AC-UC07-01、AC-UC07-06 |
| 同输入与发布版本 | B9/B10、D20/D22/D25；input_hash、calculation_version/status、source_snapshot；稳定 Dentist 行内发布 | AC-UC07-07、AC-UC07-09 |
| 完整/不完整发布分离 | B9、D22；INCOMPLETE/CALCULATED/PUBLISHED、来源完整性、权限 | AC-UC07-05—06、AC-UC07-09 |

## Q01—Q09 与成果指标

Q 原编号不拆改。质量要求不因未开发、测试资源未落实而降低；每项均有 spec.md 中完整 Given/When/Then 定义。

| 原编号 | 原来源 | 适用范围/数据 | 验收 | 关联成果 |
| --- | --- | --- | --- | --- |
| Q01 易用性 | 页面入口清楚，登录与本人资料状态明确；完成预约不超过4次业务提交或确认，保存治疗不超过3次。 | 通过组件交互、接口及实际页面自动化检查，验证导航、表单提示、预约、治疗保存及结果读回。保留模拟接口与真实环境的验证边界；负责人日常使用确认体验，不强制招募参与者、培训或提交人工记录。自动化指定场景通过，业务提交与确认次数符合目标，成功及错误提示明确；结果与后台一致，无权限绕过。不将自动化结果描述为人工实验。 |
| Q02 扩展性 | B12 | UC06、UC02、新配置及历史引用 | AC-Q02 | SC-009 |
| Q03 性能 | B12 当前小规模部署标准 | 完整数据规模；隔离2核2GB、10并发20分钟、60/20/20；云端5并发5分钟只读 | AC-Q03 | SC-004 |
| Q04 一致性 | B12；D22/D25 | UC01、UC04 的并发/故障；共同原子性覆盖迁移、S5、发布 | AC-Q04、AC-G03、AC-UC07-07 | SC-005 |
| Q05 备份恢复 | B12 | 全部业务表及独立身份/绑定/授权/审计的一致恢复 | AC-Q05 | SC-008 |
| Q06 身份会话 | B12；D26 | 全受保护业务与 SF01—04；独立身份存储 | AC-Q06、AC-SF01-01—02、AC-SF03-02、AC-SF04-02 | SC-007 |
| Q07 权限与敏感资料 | B12、B12a；D26 | 本人、岗位、诊所、字段、敏感下钻 | AC-Q07、AC-G02 | SC-007 |
| Q08 审计 | B12；D26 | 规定变更、敏感读取及独立审计，PatientAllergy 和 AppointmentEvent 相关证据 | AC-Q08、AC-G03、AC-G05 | SC-007 |
| Q09 可维护性 | B12 | UC06 新诊所及 UC01/UC03/UC04/UC07 规则回归 | AC-Q09 | SC-009 |
| A1/A1a 主指标 | 第一章 A1、A1a；第二章指标定义 | UC07 资料齐备至全部可发布结果发布，UC08 监测 | AC-SC-01；AC-UC07-01—09 | SC-001 |
| A1a 辅助指标 | 第一章 A1a | 期间营业诊所、接入/使用及七项完整有效治疗 | AC-SC-02、AC-UC08-06 | SC-002 |
| 范围覆盖 | 本次用户要求、宪章 I/VI | 八 UC、五场景、四 SF、九 Q、R1 的文档追踪 | 本矩阵及质量清单的覆盖检查 | SC-010 |
| 核算正确性 | B9/B10/B13、D22、第四章第十五节 | 逐人来源/守恒/非负激励/完整性 | AC-UC07-01—09 | SC-006 |

## 覆盖判定和后续证据

原业务功能覆盖为 UC01—UC08 8/8；UC01 场景 5/5；SF01—SF04 4/4；Q01—Q09 9/9；R1 的人员、归期归属、成本完整性、有效分钟、尾差守恒、10%激励和发布版本均有验收。所有 FR-001—025 至少映射一项已定义场景。

只读 UC08 不映射新增写入表；SF01—SF04 无独立业务表的部分如实注明。上述导航字段不是完整数据字典替代品；D3—D21 全字段及 D22—D24 约束整体继承。

| 追踪环节 | 当前依据 |
| --- | --- |
| 业务及身份规则 | 当前Word、Constitution与spec.md；首次本人登记直接预约、已有档案安全关联。 |
| 计划与接口 | plan.md、research.md、data-model.md、technical-data-model.md及contracts/。 |
| 实施 | 64项任务，完成状态见tasks-catalog.json，映射见tasks-catalog.json与task-traceability.md。 |
| 双端联调 | docs/verification/cloud-integration-20261124/summary.md及docs/verification/patient-onboarding-20261124/README.md。 |
| 质量及发布 | T052—T056按各自实测条件验收；前序联调通过不代替易用性、负载、恢复或正式发布。 |

## Plan 设计定位

2026-11-07：本轮技术决定、备选及来源见 [research.md](research.md)，模块/事务/部署及宪章复核见 [plan.md](plan.md)，24表全字段见 [data-model.md](data-model.md)，操作和HTTP形式见 [接口行为](contracts/api.md)、[83项操作目录](contracts/operations.md)、[OpenAPI](contracts/openapi.json) 及 [身份契约](contracts/identity.md)，后续实际执行方式见 [quickstart.md](quickstart.md)。下列operationId连接接口定义及实现任务，运行通过情况以对应实测证据判定。

| 规约编号 | 模块/接口 operationId 或设计责任 | 数据影响和验收责任 |
| --- | --- | --- |
| FR-001 | searchAppointmentCandidates、createAppointment；预约模块 | 原Patient/资质/执业/班次→Appointment/期望项目/BOOK，提交再校验；AC-UC01-S1-01—06。 |
| FR-002 | attendAppointment | 原Appointment.attended_at/状态及ATTEND原子；AC-UC01-S2-01—03。 |
| FR-003 | cancelAppointment | 原取消资料/CANCEL及占位，主体/窗口/班次按原规则；AC-UC01-S3-01—04。 |
| FR-004 | markNoShow | 结束后人工核实，原NO_SHOW取消分类；AC-UC01-S4-01—03。 |
| FR-005 | rescheduleAppointment | 原新旧Appointment/期望治疗/来源/事件原子，唯一同患者后继；AC-UC01-S5-01—04。 |
| FR-006 | createSchedule、listSchedules、suspendSchedule | 原Dentist稳定锁及正常班次谓词，不增加生成列；AC-UC02-01—03。 |
| FR-007 | getClinicalContext、updateClinicalNotes、recordAppliedTreatment、completeAppointment、correctTreatmentPrice | 原实际治疗/历史价/实施牙医/完成事件；授权价格纠错与普通诊疗分开；AC-UC03-01—05。 |
| FR-008 | invoiceAppointment、getInvoice | 原Invoice/Item/Appointment/INVOICE唯一且原子；AC-UC04-01—05。 |
| FR-009 | registerSelfPatient、createPatient、getPatient、updatePatient、reviewPatientAllergies、addPatientAllergy、correctPatientAllergy、retractPatientAllergy | 原患者/关联核实链与三态，目录读取不改变；AC-UC05-01—04。 |
| FR-010 | create/update/get/list Clinic、Dentist、Qualification、Treatment、Allergy；maintainDentistQualification/Assignment、setTreatmentRequirements | 原组织目录/资质/执业及治疗要求，历史价和已引用记录保持；AC-UC06-01—04。 |
| FR-011 | recordCostEntry、reverseCostEntry、prepareQuarterPerformance、calculateQuarterPerformance、publishQuarterPerformance、getQuarterPerformanceSources | 原CostEntry及QuarterlyPerformance含DRAFT/source_snapshot，不加封账/分摊表；AC-UC07-01—09。 |
| FR-012 | getAnalysis及其分项、listQuarterPerformance | 只读原业务事实、统一截止及口径；AC-UC08-01—06。 |
| FR-013 | initializeWebCsrf、createWechatSession、createStaffSession、logout、getCurrentIdentity | 独立身份存储，无业务表写入；真微信/员工会话及Q06；AC-SF01-01—02。 |
| FR-014 | registerSelfPatient、requestPatientBinding、approvePatientBinding、rebindPatient、revokePatientBinding、getPatientBinding | 独立身份当前绑定双向唯一及历史，首次登记创建新Patient并自动关联；已有档案安全核实，旧会话失本人权；AC-SF02-01—03。 |
| FR-015 | createStaffAccount、activateStaffAccount、deactivateStaffAccount、credentialrecoveryStaffAccount、listStaffAccounts | 独立员工账号，不将非牙医造为Dentist；AC-SF03-01—02。 |
| FR-016 | createClinicGrant、revokeClinicGrant、listClinicGrants | 独立角色/能力/诊所范围/期限；每次对象复核；AC-SF04-01—02。 |
| FR-017 | 全部生命周期命令，data-model五状态/四分类/事件表 | 无任意状态PATCH；原状态事实及时点一致；AC-G01及生命周期AC。 |
| FR-018 | identity契约、所有操作的当前主体/能力/范围和岗位投影 | 不变更业务归属；默认汇总、敏感读取另授；AC-G02、AC-Q06—08。 |
| FR-019 | RequestReceipt、getRequestResult、统一锁序及事务完成后释放命名锁 | adc_identity.RequestReceipt技术记录不污染24表；原业务/事件/审计整体提交，真实MySQL并发/回滚；AC-G03、AC-Q04。 |
| FR-020 | data-model完整字段字典及结构指纹检查，MyBatis显式映射 | 24/209/44逐项不变，迁移历史adc_identity.flyway_schema_history；条件唯一不变全局唯一；AC-G04。 |
| FR-021 | 资料/过敏纠错、目录停用调价、成本冲销、改约及发布版本 | 原引用、历史价/凭据/核实/来源保留，审计独立追加；AC-G05、AC-UC07-07—08。 |
| FR-022 | 所有DTO金额/ID字符串、BigDecimal/UTC映射、业务季度及日历配置 | 原DECIMAL精度，逐项舍入及归季不漂移；AC-G06—07。 |
| FR-023 | prepare/calculate/publishQuarterPerformance；R1领域服务 | 原人员/开票收入/发生期成本/NORMAL分钟/尾差/非负10%及唯一发布；AC-UC07-01—09。 |
| FR-024 | getAnalysis，api.md分项字段表 | 原队列/剔除/分母/缺失/加权单位与当前绩效口径，历史不可重建时不冒充当前值；AC-UC08-01—06。 |
| FR-025 | 所有业务契约及无付款/收退款/税费折扣操作检查 | 保留八UC五场景及24表；INVOICED仅费用凭据；AC-G08。 |

Q01—Q09和SC-001—010以当前Word及Spec为准；Q01组织方式和Q03部署负载条件按负责人已确认内容执行，Plan及quickstart给出相同可执行路径。C-02数据库及C-04身份架构已获批准；C-03保留必要工具验证，C-04真实接入及C-05资源/测试/恢复转后续实施及验收；未实施检查不得在Tasks/Analyze写成已经通过。

## Plan补充审核追踪：原业务库与技术身份

| 原需求/来源 | 本次设计定位 | 验证导航 |
| --- | --- | --- |
| D3—D21、FR-020、AC-G04 | business-baseline-audit.md/json，原Word209字段及键逐行核对；原D1不变 | PV-DB01，实际DDL/键/CHECK/条件唯一检查 |
| D22—D24、FR-017—019 | 原规则及21行关系原文对照；技术到业务APP引用与数据库FK分清 | PV-DB01—03、PV-ID04 |
| SF01/SF03、Q06 | Subject/ExternalIdentity/StaffAccount/Session/LoginThrottle与identity.md真实接入 | PV-ID01；AC-SF01-01—02、AC-SF03-01—02、AC-Q06 |
| SF02、Clarify Q1 | BindingRequest/CurrentPatientBinding/BindingEvent，申请不需先有批准凭据；双向唯一/原子重绑 | PV-ID02—03；AC-SF02-01—03 |
| SF04、Q07 | AccessGrant/GrantClinicScope/GrantCapability，当前账号/范围与对象复核 | PV-ID05；AC-SF04-01—02、AC-Q07 |
| FR-019、Q04/Q08 | RequestReceipt、AuditEvent及19条纯技术FK；成功事实与审计整体提交 | PV-ID04—05；AC-G03、AC-Q04、AC-Q08 |
| Q05、AC-Q05 | 三schema共同恢复位点与逻辑引用巡检 | PV-DB03 |

PV为Plan验证项，不取代或重编号Spec的87个验收场景；运行结果按对应任务的实际证据判定。
