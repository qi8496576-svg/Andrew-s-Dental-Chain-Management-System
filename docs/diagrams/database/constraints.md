## D22

| 约束对象 | 规则与负责层 |
| --- | --- |
| 业务编号与目录名称 | 数据库：业务编号以及已声明唯一的目录名称 UNIQUE 且 NOT NULL。 |
| Appointment.status | CHECK：SCHEDULED、CANCELLED、IN_PROGRESS、COMPLETED、INVOICED。 |
| 取消分类 | CHECK：PATIENT_CANCEL、NO_SHOW、CLINIC_RESCHEDULE、CLINIC_CANCEL；只有 CANCELLED 可填写取消资料。 |
| 状态事实时点 | SCHEDULED 时到诊、取消、完成时点为空；进行中及后续状态有到诊时点；完成及结算状态有完成时点；取消状态有取消时点和原因且无到诊时点。 |
| Patient.allergy_review_status | CHECK：NOT_REVIEWED、NO_KNOWN、RECORDED；预约提交时须完成资料确认；临床登记前牙医可再次核实。 |
| PatientAllergy | 复合主键(patient_id, allergy_id)；更正和撤销追加 audit_history，不删除既有证据。 |
| 牙医与资质 | termination_date 不早于 hire_date；资质 expiry_date 不早于 granted_date；只使用 VERIFIED 且治疗日处于有效期的资质。 |
| DentistSchedule | schedule_status为NORMAL或SUSPENDED；仅NORMAL班次的(dentist_id, schedule_date, start_time)组合唯一；SUSPENDED历史可有多版，不参与该唯一性；end_time > start_time，slot_minutes > 0，班次长度为时隙长度整数倍。 |
| 班次冲突与不可变性 | 领域事务：同一牙医同日跨诊所NORMAL班次不得重叠，SUSPENDED历史不参加重叠校验；班次处于有效执业区间；被引用班次不覆盖归属、日期或时段。 |
| 预约时隙占用 | 建立事务锁定目标班次后校验：预约日期、诊所、牙医与班次一致，时刻位于半开区间且对齐时隙。SCHEDULED、IN_PROGRESS、COMPLETED、INVOICED 记录保留占位；CANCELLED 不占用。 |
| 改约来源 | rescheduled_from_id 引用已取消且分类为 CLINIC_RESCHEDULE 的旧预约；UNIQUE(rescheduled_from_id)限制一个直接后继；业务检查同患者和无环，取消和建立在同一事务内完成。 |
| AppliedTreatment | standard_units > 0；unit_price >= 0；subtotal = ROUND(standard_units * unit_price,2)；就诊进行中才能增加，记录实际实施牙医，校验其治疗日资质和诊所执业关系。 |
| Invoice | appointment_id 与 invoice_number 分别唯一且非空；total_amount 等于全部明细小计之和；创建单据、明细、状态事件与已结算状态在同一事务提交。 |
| InvoiceItem | UNIQUE(invoice_id,line_number) 与 UNIQUE(applied_treatment_id)；所引用治疗必须属于该单对应就诊；单位数、价格、小计与当次治疗一致。 |
| CostEntry | cost_type 为 MEDICAL_SUPPLY 或 OPERATING；source_reference 唯一；已确认凭证不可覆盖；冲销记录 amount < 0，reversal_of_id 唯一且指向同归属同类型的正额原记录，绝对金额相等。普通金额非负，零额记录须注明已确认零成本的范围。 |
| 成本归属 | 领域校验：填写 applied_treatment_id 时，其就诊、诊所和牙医与其他已填写归属一致；公共费用必须以 source_snapshot 中按R1计算并复核的分摊项归到牙医，分摊合计等于原凭证金额且不得重复分摊。 |
| QuarterlyPerformance | UNIQUE(dentist_id,quarter_start,quarter_end,calculation_version)；版本为正，季度起点包含、终点不含；数据完整时 net_profit = revenue - medical_supply_cost - operating_expense。 |
| 激励与发布状态 | 个人提成率incentive_rate＝0.1000；资料完整时incentive_amount＝ROUND(MAX(net_profit,0)×incentive_rate,2)。非正净利润保存0，不因净利润非正而拒绝发布；资料不完整时金额可空且不得发布。 |
| 核算状态 | DRAFT为草稿，INCOMPLETE为资料不完整，CALCULATED为计算完成待复核，PUBLISHED为已发布，SUPERSEDED为已被新版替代。发布要求来源、人员、金额及分摊齐备。 |
| 发布版本 | 领域事务：同一牙医同一季度仅一个 PUBLISHED 版本；发布新版时将原版状态置 SUPERSEDED，冻结其金额、输入摘要与来源快照。 |
| AppointmentEvent | UNIQUE(appointment_id,event_type,request_key)；事件类型 BOOK、ATTEND、CANCEL、COMPLETE、INVOICE；from_status 与实际旧状态一致，与主表变化原子保存。 |
| 请求幂等 | 创建预约前以可信主体和请求标识取得互斥锁并查找既有BOOK结果，事件details保存请求摘要。已有事件的组合唯一键只能防同预约重复，不能单独防重复创建预约。 |
| 来源分摊与版本 | 同一分摊批次保存完整份额、有效排班时长及R1；净额守恒且不重复计入。输入摘要含规则、人员、来源和截止时间；发布在稳定牙医行锁内切换当前版本。 |
| 单行与跨表检查 | 枚举、数值正负、日期先后及事实时点可用单行CHECK；资质有效、跨诊所重叠、明细归属和金额汇总、分摊守恒及唯一发布必须由领域服务和事务检查。 |
| 状态事件 | BOOK:NULL→SCHEDULED；ATTEND:SCHEDULED→IN_PROGRESS；CANCEL:SCHEDULED→CANCELLED；COMPLETE:IN_PROGRESS→COMPLETED；INVOICE:COMPLETED→INVOICED。事件与主表原子保存。 |

## D23

| 状态 | status 取值 | 允许操作 | 数据约束 |
| --- | --- | --- | --- |
| 已预约 | SCHEDULED | 确认到诊、取消；挂起班次下办理改约 | 到诊、取消、完成时点均为空；无实际治疗及结算单。 |
| 进行中 | IN_PROGRESS | 记录问题、增加治疗、完成 | 到诊时点非空；完成和取消时点为空，允许尚无实际治疗。 |
| 已完成 | COMPLETED | 生成结算单 | 到诊与完成时点非空，至少一项实际诊疗项目；无取消资料。 |
| 已结算 | INVOICED | 查询与重复结算返回原单 | 存在唯一结算单；治疗和明细只读；到诊与完成时点保持。 该状态不表示已付款。 |
| 已取消 | CANCELLED | 查询历史；改约建立独立新预约 | 取消分类、原因、时点齐全；无到诊、实际治疗及结算单。 |

## D24

| 父表 | 子表 | 基数 | 实现方式 |
| --- | --- | --- | --- |
| Patient | Appointment | 1:N | Appointment.patient_id |
| Clinic | Appointment | 1:N | Appointment.clinic_id |
| Dentist | Appointment | 1:N | Appointment.dentist_id |
| Patient | Allergy | M:N | PatientAllergy |
| Dentist | Qualification | M:N | DentistQualification |
| Dentist | Clinic | M:N（随时间） | DentistClinicAssignment |
| Treatment | Qualification | M:N | TreatmentQualification |
| Appointment | Treatment | M:N（预约时） | AppointmentRequestedTreatment |
| Appointment | AppliedTreatment | 1:N | AppliedTreatment.appointment_id |
| Appointment | Invoice | 每次就诊最多对应一张结算单 | Invoice.appointment_id |
| Invoice | InvoiceItem | 1:N | InvoiceItem.invoice_id |
| Dentist | QuarterlyPerformance | 1:N | QuarterlyPerformance.dentist_id |
| Dentist | DentistSchedule | 1:N | DentistSchedule.dentist_id |
| Clinic | DentistSchedule | 1:N | DentistSchedule.clinic_id |
| DentistSchedule | Appointment | 1:N | Appointment.schedule_id |
| Appointment | Appointment | 每条预约最多对应一条直接后继预约 | rescheduled_from_id；有效后继受业务唯一规则限制 |
| Appointment | AppointmentEvent | 1:N | AppointmentEvent.appointment_id |
| CostEntry | CostEntry | 每条成本凭证最多对应一条冲销凭证 | reversal_of_id 唯一且可空 |
| AppliedTreatment | InvoiceItem | 每项实际治疗最多对应一条结算明细 | applied_treatment_id非空且单列唯一 |
| CostEntry | QuarterlyPerformance | 逻辑N:M | source_snapshot冻结来源和分摊；无直接FK |
| Dentist | AppliedTreatment | 每名牙医可对应零项或多项实际治疗 | dentist_id记录实施牙医；开票明细关联实际治疗，收入逐项归实施牙医。 |
| Clinic / Dentist | RegistrationFeePolicy | 各1:N | clinic_id、dentist_id；二者组成策略主键 |
| Patient / DentistSchedule | BookingHold | 各1:N | patient_id、schedule_id；其余业务外键见表D28 |
| BookingHold | PatientBill | 1:0..1 | hold_id可空且唯一；挂号账单必须关联号源 |
| Invoice | PatientBill | 1:0..1 | invoice_id可空且唯一；诊疗账单必须关联费用凭据 |
| PatientBill | PaymentOrder | 1:0..1 | bill_id非空且唯一 |
| PaymentOrder | RefundOrder | 1:0..1 | payment_id非空且唯一，全额退款保留原因与操作者 |

## 预约费用与号源规则

挂号费采用整数分。非零挂号费先保留真实号源五分钟，最多至预约开始；待缴不等于预约。付款事务再次核对本人资料快照、排班、资格及正式/临时占用。失效或资料改变关闭保留；成功演示支付与预约、事件、审计和回执整体提交。

PatientBill须由BookingHold或Invoice提供唯一来源；每账单至多一条PaymentOrder，每支付至多一条全额RefundOrder。合法退号同步演示退款。诊疗账单退款需要billing.refund及诊所范围并记录原因，不覆盖原Invoice、诊疗事实或R1。所有演示页面标明“不扣真实款”，服务端仅在明确启用的虚构测试门店接受演示命令。
