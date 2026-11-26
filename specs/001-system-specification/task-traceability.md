# 当前任务追踪（ADC-TASKS-20261125-04）

2026-11-25；当前64项任务的追踪关系，验收状态以tasks.md及实际证据为准。旧快照保留于history/tasks-186-before-20261111。

## FR、Q及成功指标

| 需求 | 当前任务 |
| --- | --- |
| FR-001 | T029, T030 |
| FR-002 | T031, T032 |
| FR-003 | T033, T034 |
| FR-004 | T035, T036 |
| FR-005 | T037, T038 |
| FR-006 | T027, T028 |
| FR-007 | T039, T040 |
| FR-008 | T041, T042 |
| FR-009 | T021, T022 |
| FR-010 | T023, T024 |
| FR-011 | T043, T044 |
| FR-012 | T045, T046 |
| FR-013 | T015, T016 |
| FR-014 | T025, T026 |
| FR-015 | T017, T018 |
| FR-016 | T019, T020 |
| FR-017 | T047 |
| FR-018 | T013, T048 |
| FR-019 | T013, T048 |
| FR-020 | T008, T012 |
| FR-021 | T047 |
| FR-022 | T013 |
| FR-023 | T043 |
| FR-024 | T045 |
| FR-025 | T047 |
| Q01 易用性 | 页面入口清楚，登录与本人资料状态明确；完成预约不超过4次业务提交或确认，保存治疗不超过3次。 | 通过组件交互、接口及实际页面自动化检查，验证导航、表单提示、预约、治疗保存及结果读回。保留模拟接口与真实环境的验证边界；负责人日常使用确认体验，不强制招募参与者、培训或提交人工记录。自动化指定场景通过，业务提交与确认次数符合目标，成功及错误提示明确；结果与后台一致，无权限绕过。不将自动化结果描述为人工实验。 |
| Q02 | T049, T055 |
| Q03 | T050, T053, T055 |
| Q04 | T048, T055 |
| Q05 | T050, T054, T055 |
| Q06 | T048, T050, T055 |
| Q07 | T048, T055 |
| Q08 | T013, T048, T055 |
| Q09 | T049, T055 |
| SC-001 | T056 |
| SC-002 | T056 |
| SC-003 | Q01自动化指定场景通过；预约≤4次业务提交或确认、治疗保存≤3次 | 页面、组件及业务数据检查；负责人日常确认体验，无强制人工实验记录。 |
| SC-004 | T053 |
| SC-005 | T048 |
| SC-006 | T044 |
| SC-007 | T048 |
| SC-008 | T054 |
| SC-009 | T049 |

## 验收场景

| 原AC | 验证任务 |
| --- | --- |
| AC-G01 | T047 |
| AC-G02 | T013, T048 |
| AC-G03 | T013, T048 |
| AC-G04 | T008, T012, T014 |
| AC-G05 | T047 |
| AC-G06 | T013 |
| AC-G07 | T013 |
| AC-G08 | T047 |
| AC-Q01 | T052 |
| AC-Q02 | T049 |
| AC-Q03 | T053 |
| AC-Q04 | T013, T048 |
| AC-Q05 | T054 |
| AC-Q06 | T048, T051 |
| AC-Q07 | T048 |
| AC-Q08 | T013, T048 |
| AC-Q09 | T049 |
| AC-SC-01 | T056 |
| AC-SC-02 | T056 |
| AC-SF01-01 | T015, T016, T051 |
| AC-SF01-02 | T015, T016 |
| AC-SF02-01 | T025, T026, T051 |
| AC-SF02-02 | T025, T026, T051 |
| AC-SF02-03 | T025, T026, T029, T030；证据：docs/verification/patient-onboarding-20261124/README.md |
| AC-SF03-01 | T017, T018 |
| AC-SF03-02 | T017, T018 |
| AC-SF04-01 | T019, T020 |
| AC-SF04-02 | T019, T020 |
| AC-UC01-S1-01 | T029, T030 |
| AC-UC01-S1-02 | T029, T030 |
| AC-UC01-S1-03 | T029, T030 |
| AC-UC01-S1-04 | T029, T030 |
| AC-UC01-S1-05 | T029, T030 |
| AC-UC01-S1-06 | T029, T030 |
| AC-UC01-S2-01 | T031, T032 |
| AC-UC01-S2-02 | T031, T032 |
| AC-UC01-S2-03 | T031, T032 |
| AC-UC01-S3-01 | T033, T034 |
| AC-UC01-S3-02 | T033, T034 |
| AC-UC01-S3-03 | T033, T034 |
| AC-UC01-S3-04 | T033, T034 |
| AC-UC01-S4-01 | T035, T036 |
| AC-UC01-S4-02 | T035, T036 |
| AC-UC01-S4-03 | T035, T036 |
| AC-UC01-S5-01 | T037, T038 |
| AC-UC01-S5-02 | T037, T038 |
| AC-UC01-S5-03 | T037, T038 |
| AC-UC01-S5-04 | T037, T038 |
| AC-UC02-01 | T027, T028 |
| AC-UC02-02 | T027, T028 |
| AC-UC02-03 | T027, T028 |
| AC-UC03-01 | T039, T040 |
| AC-UC03-02 | T039, T040 |
| AC-UC03-03 | T039, T040 |
| AC-UC03-04 | T039, T040 |
| AC-UC03-05 | T039, T040 |
| AC-UC04-01 | T041, T042 |
| AC-UC04-02 | T041, T042 |
| AC-UC04-03 | T041, T042 |
| AC-UC04-04 | T041, T042 |
| AC-UC04-05 | T041, T042 |
| AC-UC05-01 | T021, T022 |
| AC-UC05-02 | T021, T022 |
| AC-UC05-03 | T021, T022 |
| AC-UC05-04 | T021, T022 |
| AC-UC06-01 | T023, T024 |
| AC-UC06-02 | T023, T024 |
| AC-UC06-03 | T023, T024 |
| AC-UC06-04 | T023, T024 |
| AC-UC07-01 | T043, T044 |
| AC-UC07-02 | T043, T044 |
| AC-UC07-03 | T043, T044 |
| AC-UC07-04 | T043, T044 |
| AC-UC07-05 | T043, T044 |
| AC-UC07-06 | T043, T044 |
| AC-UC07-07 | T043, T044 |
| AC-UC07-08 | T043, T044 |
| AC-UC07-09 | T043, T044 |
| AC-UC08-01 | T045, T046 |
| AC-UC08-02 | T045, T046 |
| AC-UC08-03 | T045, T046 |
| AC-UC08-04 | T045, T046 |
| AC-UC08-05 | T045, T046 |
| AC-UC08-06 | T045, T046 |

## 已批准接口

| operationId | 实现 | 契约测试 |
| --- | --- | --- |
| initializeWebCsrf | T015 | T015 |
| createWechatSession | T015 | T015 |
| createStaffSession | T015 | T015 |
| logout | T015 | T015 |
| getCurrentIdentity | T015 | T015 |
| requestPatientBinding | T025 | T025 |
| getPatientBinding | T025 | T025 |
| listBindingRequests | T025 | T025 |
| approvePatientBinding | T025 | T025 |
| rebindPatient | T025 | T025 |
| revokePatientBinding | T025 | T025 |
| createStaffAccount | T017 | T017 |
| listStaffAccounts | T017 | T017 |
| activateStaffAccount | T017 | T017 |
| deactivateStaffAccount | T017 | T017 |
| credentialrecoveryStaffAccount | T017 | T017 |
| createClinicGrant | T019 | T019 |
| listClinicGrants | T019 | T019 |
| revokeClinicGrant | T019 | T019 |
| getRequestResult | T013 | T013 |
| searchAppointmentCandidates | T029 | T029 |
| listAppointments | T029 | T029 |
| createAppointment | T029 | T029 |
| getAppointment | T029 | T029 |
| attendAppointment | T031 | T031 |
| cancelAppointment | T033 | T033 |
| markNoShow | T035 | T035 |
| rescheduleAppointment | T037 | T037 |
| completeAppointment | T039 | T039 |
| invoiceAppointment | T041 | T041 |
| listSchedules | T027 | T027 |
| createSchedule | T027 | T027 |
| suspendSchedule | T027 | T027 |
| updateClinicalNotes | T039 | T039 |
| recordAppliedTreatment | T039 | T039 |
| correctTreatmentPrice | T039 | T039 |
| getInvoice | T041 | T041 |
| createPatient | T021 | T021 |
| lookupPatient | T021 | T021 |
| getPatient | T021 | T021 |
| updatePatient | T021 | T021 |
| reviewPatientAllergies | T021 | T021 |
| addPatientAllergy | T021 | T021 |
| listPatientAllergies | T021 | T021 |
| correctPatientAllergy | T021 | T021 |
| retractPatientAllergy | T021 | T021 |
| listClinic | T023 | T023 |
| createClinic | T023 | T023 |
| getClinic | T023 | T023 |
| updateClinic | T023 | T023 |
| listDentist | T023 | T023 |
| createDentist | T023 | T023 |
| getDentist | T023 | T023 |
| updateDentist | T023 | T023 |
| listQualification | T023 | T023 |
| createQualification | T023 | T023 |
| getQualification | T023 | T023 |
| updateQualification | T023 | T023 |
| listTreatment | T023 | T023 |
| createTreatment | T023 | T023 |
| getTreatment | T023 | T023 |
| updateTreatment | T023 | T023 |
| listAllergy | T023 | T023 |
| createAllergy | T023 | T023 |
| getAllergy | T023 | T023 |
| updateAllergy | T023 | T023 |
| maintainDentistQualification | T023 | T023 |
| maintainDentistAssignment | T023 | T023 |
| setTreatmentRequirements | T023 | T023 |
| recordCostEntry | T043 | T043 |
| listCostEntries | T043 | T043 |
| reverseCostEntry | T043 | T043 |
| prepareQuarterPerformance | T043 | T043 |
| calculateQuarterPerformance | T043 | T043 |
| listQuarterPerformance | T043 | T043 |
| getQuarterPerformanceSources | T043 | T043 |
| publishQuarterPerformance | T043 | T043 |
| getAnalysis | T045 | T045 |
| searchAuditEvents | T013 | T013 |
| getClinicalContext | T039 | T039 |
| getAppliedTreatment | T039 | T039 |
| getCostEntry | T043 | T043 |

## 旧→新任务号（仅追踪，不重新执行）

| 原任务 | 当前任务 |
| --- | --- |
| T001 | T001 |
| T002 | T002 |
| T003 | T003 |
| T004 | T004 |
| T005 | T005 |
| T006 | T006 |
| T007 | T007 |
| T008 | T008 |
| T009 | T009 |
| T010 | T010 |
| T011 | T011 |
| T012 | T011 |
| T013 | T011 |
| T014 | T011 |
| T015 | T011 |
| T016 | T011 |
| T017 | T011 |
| T018 | T011 |
| T019 | T011 |
| T020 | T011 |
| T021 | T011 |
| T022 | T011 |
| T023 | T011 |
| T024 | T011 |
| T025 | T011 |
| T026 | T011 |
| T027 | T011 |
| T028 | T011 |
| T029 | T011 |
| T030 | T011 |
| T031 | T011 |
| T032 | T011 |
| T033 | T011 |
| T034 | T011 |
| T035 | T011 |
| T036 | T011 |
| T037 | T011 |
| T038 | T011 |
| T039 | T011 |
| T040 | T011 |
| T041 | T011 |
| T042 | T011 |
| T043 | T012 |
| T044 | T013 |
| T045 | T013 |
| T046 | T013 |
| T047 | T013 |
| T048 | T013 |
| T049 | T013 |
| T050 | T014 |
| T051 | T015 |
| T052 | T015 |
| T053 | T015 |
| T054 | T015 |
| T055 | T015 |
| T056 | T016 |
| T057 | T016 |
| T058 | T017 |
| T059 | T017 |
| T060 | T017 |
| T061 | T017 |
| T062 | T017 |
| T063 | T017 |
| T064 | T018 |
| T065 | T018 |
| T066 | T019 |
| T067 | T019 |
| T068 | T019 |
| T069 | T019 |
| T070 | T019 |
| T071 | T020 |
| T072 | T020 |
| T136 | T021 |
| T137 | T021 |
| T138 | T021 |
| T139 | T021 |
| T140 | T021 |
| T141 | T022 |
| T142 | T022 |
| T143 | T023 |
| T144 | T023 |
| T145 | T023 |
| T146 | T023 |
| T147 | T023 |
| T148 | T023 |
| T149 | T023 |
| T150 | T023 |
| T151 | T024 |
| T152 | T024 |
| T073 | T025 |
| T074 | T025 |
| T075 | T025 |
| T076 | T025 |
| T077 | T025 |
| T078 | T026 |
| T079 | T026 |
| T080 | T027 |
| T081 | T027 |
| T082 | T027 |
| T083 | T027 |
| T084 | T027 |
| T085 | T028 |
| T086 | T028 |
| T087 | T029 |
| T088 | T029 |
| T089 | T029 |
| T090 | T029 |
| T091 | T029 |
| T092 | T030 |
| T093 | T030 |
| T094 | T031 |
| T095 | T031 |
| T096 | T031 |
| T097 | T031 |
| T098 | T031 |
| T099 | T032 |
| T100 | T032 |
| T101 | T033 |
| T102 | T033 |
| T103 | T033 |
| T104 | T033 |
| T105 | T033 |
| T106 | T034 |
| T107 | T034 |
| T108 | T035 |
| T109 | T035 |
| T110 | T035 |
| T111 | T035 |
| T112 | T035 |
| T113 | T036 |
| T114 | T036 |
| T115 | T037 |
| T116 | T037 |
| T117 | T037 |
| T118 | T037 |
| T119 | T037 |
| T120 | T038 |
| T121 | T038 |
| T122 | T039 |
| T123 | T039 |
| T124 | T039 |
| T125 | T039 |
| T126 | T039 |
| T127 | T040 |
| T128 | T040 |
| T129 | T041 |
| T130 | T041 |
| T131 | T041 |
| T132 | T041 |
| T133 | T041 |
| T134 | T042 |
| T135 | T042 |
| T153 | T043 |
| T154 | T043 |
| T155 | T043 |
| T156 | T043 |
| T157 | T043 |
| T158 | T043 |
| T159 | T043 |
| T160 | T043 |
| T161 | T043 |
| T162 | T043 |
| T163 | T044 |
| T164 | T044 |
| T165 | T045 |
| T166 | T045 |
| T167 | T045 |
| T168 | T045 |
| T169 | T045 |
| T170 | T046 |
| T171 | T046 |
| T172 | T047 |
| T173 | T048 |
| T174 | T048 |
| T177 | T049 |
| T178 | T050 |
| T175 | T051 |
| T176 | T052 |
| T179 | T053 |
| T180 | T053 |
| T181 | T054 |
| T182 | T054 |
| T183 | T055 |
| T184 | T055 |
| T185 | T056 |
| T186 | T056 |

## T053/T054量化指标来源复核（2026-11-11）

| 当前任务 | 已批准指标/实施依据 | 来源与执行边界 |
| --- | --- | --- |
| T053 / AC-Q03 / SC-004 | 完整数据规模；隔离合计2核2GB、10并发20分钟、60/20/20及5000次成功；云端5并发5分钟只读600次 | 当前Word表B12、Spec AC-Q03及Plan Performance Goals。 |
| T053 / AC-Q03 | 各类P95≤3秒、错误<1%、配比误差≤0.5个百分点，真实新增及账单/状态/审计/回执一致 | 不推断100并发或云端大规模写入容量。 |
| T054 / AC-Q05 / SC-008 | 每日全量、每15分钟增量、30天保留；RPO≤15分钟、RTO≤4小时；隔离恢复后数量/金额/绑定/权限一致 | 原Word表B12 Q05、Spec质量验收表、Plan Reliability/Security及一致恢复设计。 |
| T054 | 三Schema共同快照/日志位点、独立介质、备份清单与恢复计时 | 获批Plan备份设计、quickstart备份与恢复演练；24/209/44是数据库基线，不是新增性能指标。 |

Q01和Q03按当前负责人确认的验收条件执行，Q05保留原RPO≤15分钟、RTO≤4小时。不得编造人工实验；虚构完整季度的结果须来自实际服务与数据库，不表述为真实营业事实。

2026-11-12：负责人有限批准ADC-CONTRACT-20261112-02；lookupPatient对应既有UC05、AC-UC05-01/02及T021/T022，当前83个操作，涵盖首次本人登记与患者核实检索。此表仍为任务映射，真实实施证据另见docs/verification/stories/patients.md，不据映射自动宣称验收完成。

2026-11-13：T025—T030已按真实MySQL、页面及协议验收证据完成；映射/数量/任务依赖不变。绑定、排班、预约证据分别见docs/verification/stories/{patient-bindings,schedules,appointment-booking}.md。负责人有限批准ADC-CONTRACT-20261112-04，仅拆分预约患者资料DTO；82个操作不变。真实微信和真机联调仍在T051，未以SDK测试替代。

2026-11-13：T031—T034完成，当前34/56；当前权限/核验、到诊与取消及停诊竞争、服务器开始/结束边界、审计回滚及真实浏览器验收见docs/verification/stories/appointment-attendance.md和appointment-cancellation.md。未修改任务依赖、业务模型和已批准契约；T035开始继续爽约核实，真实微信及真机仍属T051。

2026-11-13：T035—T038完成；爽约人工核实、停诊改约/诊所取消及其真实MySQL/页面证据见docs/verification/stories/appointment-no-show.md和appointment-rescheduling.md；38/56，T039治疗记录进行中。任务编号、依赖、原业务设计和批准契约不变。

2026-11-13：T039/T040实际诊疗完成，40/56；真实MySQL、金额/历史价/权限/备注版本/开票后只读及医生工作台证据见docs/verification/stories/clinical-treatment.md；T041继续既有费用凭据，不引入支付。

2026-11-14：T041/T042实际结算完成，42/56；MySQL并发、原子回滚、历史费用、跨就诊拒绝及真实页面未知响应恢复证据见docs/verification/stories/invoicing.md。T043继续成本及季度核算；无支付功能。

2026-11-14：T043/T044完成，44/56；成本唯一冲销、RR冻结来源、R1、缺项禁发、零/负激励、发布竞争/回滚及真实页面证据见docs/verification/stories/quarterly-performance.md。T045继续既有只读分析。

2026-11-14：T045/T046完成，46/56。运营分析原样本、只取当前发布、来源不足/不可复现拒绝和真实页面证据见docs/verification/stories/analytics.md。T047开始完整系统贯通门禁；受控时钟/提供方边界不代替T051真实微信或T056真实季度。

2026-11-14：T047通过，47/56。实际服务贯通、23项单元/142项MySQL集成、Web37项单元/2项壳E2E、契约82/91及小程序6页构建证据见docs/verification/system-journey.md。T048专项安全/多实例故障继续；真实外部验收未虚报。

2026-11-14：T048专项通过，48/56；82操作真实权限矩阵及两独立应用上下文/连接池的MySQL发布竞争、审计回滚与原键恢复证据见docs/verification/concurrency-faults.md。T049新诊所首次管理运维补充已获负责人有限批准；仅按批准范围实施，不修改原SF04/API/数据库。T050收到腾讯云环境并完成只读检查，尚不等于隔离部署/HTTPS验收通过。

2026-11-14：T049真实MySQL及真实Linux/Docker/Vue新增诊所排班预约闭环通过，49/56。受控运维补充ADC-OPS-20261114-01由负责人有限批准，仅新增独立首份管理授权，不改原授权或SF04/API/数据库。证据见docs/verification/quality/q02-q09-results.md及database/container-smoke.json。T050继续隔离云环境；真实微信文件已收到且仅核对格式，域名/证书/真实wx.login仍未验收，不预勾后续任务。

2026-11-14：负责人明确备案前不启用正式解析/网站，T050正式DNS/公网HTTPS、T051真实合法域名联调等待ICP；保留既有云候选、SSH及持久化配置。已启动仅127.0.0.1本机持久预览，四岗位真实浏览器通过，并验证复用24个已有样本步骤不重建数据。DNS-01方案及T053配比/库存/响应校验准备继续，未执行完整Q03，任务仍49/56，不改正式依赖或验收标准。

2026-11-18：按负责人授权继续不依赖ICP备案的实施部分。T050云端隔离候选仅绑定127.0.0.1:24443，33迁移、健康状态、SSH隧道证书核验和真实HTTP拒绝验证通过，证据docs/verification/tencent-loopback-readiness.json；正式域名和公网不计通过。T052九人十八组协议及空白NOT_RUN记录已准备，tests/usability/q01-protocol.md。T053完整SQL合成基线经真实MySQL验证30/100/10000/100000/200000及19/163/30、库存和状态/金额/资质一致性，11项相关Node测试通过，证据docs/verification/performance/q03-results.md。SQL夹具不冒充API主流程；k6工具兼容、真实worker会话及完整性能窗口待完成。保持49/56和原依赖，不预勾后续任务。


## 患者预约与演示费用

| 需求或验收 | 任务 |
| --- | --- |
| FR-026 | T057—T064 |
| AC-PB-01 | T057、T059、T061、T062、T063 |
| AC-PB-02 | T057、T058、T060、T062、T063 |
| AC-PB-03 | T057、T060、T061、T062、T063 |

| createBookingHold | T060、T061；验证T057、T062 |
| listPatientBills | T060、T061；验证T057、T062 |
| getPatientBill | T060、T061；验证T057、T062 |
| payDemoBill | T060、T061；验证T057、T062 |
| closePatientBill | T060、T061；验证T057、T062 |
| refundPatientBill | T060、T061；验证T057、T062 |
| getRegistrationFee | T060、T061；验证T057、T062 |
| setRegistrationFee | T060、T061；验证T057、T062 |
