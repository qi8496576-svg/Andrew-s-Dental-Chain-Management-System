# ADC 数据模型与完整性设计

日期：2026-11-25。状态：当前业务数据模型；字段与原始Word一致，迁移、代码及真实数据库结果见对应实施任务证据。

## 基线与解释范围

依据：[Spec](spec.md)（含 Clarifications 2026-11-07 Q1）、[研究决策](research.md) R-D01—R-D07、[Constitution](../../.specify/memory/constitution.md)、最终 Word 第四章表 D3—D26。字段检索来源为 [schema.json](../../docs/diagrams/database/schema.json)，完整业务约束同时读取 [constraints.md](../../docs/diagrams/database/constraints.md)、[D 系统设计](../../docs/requirements/D-系统设计.md) 和正式 [ERD D1](../../docs/diagrams/official/D1.png)。独立历史图或可编辑重建源不覆盖正式 Word。

采用 MySQL 8.4 LTS / InnoDB。adc_business 保留 **24 张业务表、209 个字段、44 条外键**；19 张为单列代理主键，5 张为复合主键。下方逐字段由 schema.json 精确转录，字段顺序、类型、可空性、主键、外键及唯一标记不自行重释。原字段中的“UNIQUE(组合)”须结合本表后方组合说明理解，不能给每个成员各加一个单列唯一；“UNIQUE(条件组合)”仅对 NORMAL 生效，不能改成无条件唯一。

业务编号与存储主键分离，映射器使用原 PascalCase 表名和下划线字段名。开发/集成/生产均使用 Linux MySQL 容器并在初始化时统一 lower_case_table_names=0；不以 Windows 原生 MySQL 的大小写容错代替 Linux 验证。禁止 ORM 自动建表/改表，不新增通用 version、deleted、active_slot、生成列、表达式索引隐藏列或未经批准的业务表。可在既有字段上提出非唯一查询索引，但须有用途、写入成本和 EXPLAIN 证据，不改变既有唯一及数据含义。

## 表与字段总览

| 原表号 | 业务表 | 字段数 | 外键数 | 主键字段 |
| --- | --- | --- | --- | --- |
| D3 | Patient | 12 | 0 | patient_id |
| D4 | Allergy | 4 | 0 | allergy_id |
| D5 | PatientAllergy | 8 | 2 | patient_id, allergy_id |
| D6 | Clinic | 9 | 0 | clinic_id |
| D7 | Dentist | 14 | 0 | dentist_id |
| D8 | Qualification | 4 | 0 | qualification_id |
| D9 | DentistQualification | 6 | 2 | dentist_id, qualification_id |
| D10 | DentistClinicAssignment | 7 | 2 | assignment_id |
| D11 | DentistSchedule | 10 | 2 | schedule_id |
| D12 | Treatment | 6 | 0 | treatment_id |
| D13 | TreatmentQualification | 3 | 2 | treatment_id, qualification_id |
| D14 | Appointment | 16 | 5 | appointment_id |
| D15 | AppointmentRequestedTreatment | 3 | 2 | appointment_id, treatment_id |
| D16 | AppliedTreatment | 8 | 3 | applied_treatment_id |
| D17 | Invoice | 7 | 1 | invoice_id |
| D18 | InvoiceItem | 8 | 2 | invoice_item_id |
| D19 | CostEntry | 14 | 5 | cost_entry_id |
| D20 | QuarterlyPerformance | 16 | 1 | quarterly_performance_id |
| D21 | AppointmentEvent | 11 | 1 | appointment_event_id |
| D27 | RegistrationFeePolicy | 4 | 2 | clinic_id, dentist_id |
| D28 | BookingHold | 14 | 5 | hold_id |
| D29 | PatientBill | 11 | 5 | bill_id |
| D30 | PaymentOrder | 7 | 1 | payment_id |
| D31 | RefundOrder | 7 | 1 | refund_id |
| 合计 | 24 表 | 209 | 44 | 19 单列主键＋5 复合主键 |

字段源文件 SHA-256：`b0e834c226ce1a301bb8e8af2ace59646b84ee1de2b56bd1d8f379f18f9fc18b`。本摘要用于核对转录来源，不代替正式 Word 的权威性。

## 原业务字段字典

### 表 D3 Patient（患者）

适用：UC01、UC05；SF02 首次本人登记创建新档案，已有档案安全核实关联。长期患者身份、联系资料及过敏确认。patient_number 为业务编号，patient_id 为存储主键；phone 不是唯一身份键。姓名、出生日期和联系电话必填；地址、邮箱及紧急联系人可空，后续就诊时补充。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| patient_id | BIGINT | Yes | No | NOT NULL | UNIQUE |
| patient_number | VARCHAR(30) | No | No | NOT NULL | UNIQUE |
| full_name | VARCHAR(100) | No | No | NOT NULL | - |
| date_of_birth | DATE | No | No | NOT NULL | - |
| billing_address | VARCHAR(255) | No | No | NULL | - |
| phone | VARCHAR(30) | No | No | NOT NULL | - |
| email | VARCHAR(254) | No | No | NULL | - |
| emergency_contact_name | VARCHAR(100) | No | No | NULL | - |
| emergency_contact_phone | VARCHAR(30) | No | No | NULL | - |
| created_at | TIMESTAMP | No | No | NOT NULL | - |
| updated_at | TIMESTAMP | No | No | NOT NULL | - |
| allergy_review_status | VARCHAR(20) | No | No | NOT NULL | - |

### 表 D4 Allergy（过敏症）

适用：UC06 写目录；UC01/UC05 读取。总部维护共享过敏目录；前台只选择合法目录项或提新增申请。停用不删除历史关联。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| allergy_id | BIGINT | Yes | No | NOT NULL | UNIQUE |
| allergy_name | VARCHAR(100) | No | No | NOT NULL | UNIQUE |
| description | VARCHAR(255) | No | No | NULL | - |
| is_active | BOOLEAN | No | No | NOT NULL | - |

### 表 D5 PatientAllergy（患者过敏症）

适用：UC05；UC01/UC03 风险资料读取。患者与过敏症的复合关联；当前程度、临床备注和撤销状态支持临床查阅，audit_history 追加原值、新值、核实人、时间与原因。撤销误记不物理删除。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| patient_id | BIGINT | Yes | FK:Patient.patient_id | NOT NULL | UNIQUE(组合) |
| allergy_id | BIGINT | Yes | FK:Allergy.allergy_id | NOT NULL | UNIQUE(组合) |
| noted_at | TIMESTAMP | No | No | NOT NULL | - |
| severity_note | VARCHAR(100) | No | No | NULL | - |
| clinical_note | VARCHAR(255) | No | No | NULL | - |
| is_retracted | BOOLEAN | No | No | NOT NULL | - |
| audit_history | JSON | No | No | NOT NULL | - |
| updated_at | TIMESTAMP | No | No | NOT NULL | - |

复合主键及组合唯一为 (patient_id,allergy_id)。

### 表 D6 Clinic（诊所）

适用：UC06；UC01/UC02/UC07/UC08 读取。统一诊所资料和地点范围。诊所业务资料不存员工角色、授权、支付渠道或季度封账新字段。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| clinic_id | BIGINT | Yes | No | NOT NULL | UNIQUE |
| clinic_code | VARCHAR(20) | No | No | NOT NULL | UNIQUE |
| postal_address | VARCHAR(255) | No | No | NOT NULL | - |
| manager_name | VARCHAR(100) | No | No | NULL | - |
| phone | VARCHAR(30) | No | No | NOT NULL | - |
| email | VARCHAR(254) | No | No | NULL | - |
| office_area_sqm | DECIMAL(8,2) | No | No | NULL | - |
| is_active | BOOLEAN | No | No | NOT NULL | - |
| created_at | TIMESTAMP | No | No | NOT NULL | - |

### 表 D7 Dentist（牙医）

适用：UC06；UC01/UC02/UC03/UC07/UC08 读取。牙医业务身份、联系方式及任职资料。员工号与存储主键分离；非牙医前台、收费和总部员工不为登录写入本表。hire_date/termination_date 决定核算任职范围，离职日计入。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| dentist_id | BIGINT | Yes | No | NOT NULL | UNIQUE |
| employee_number | VARCHAR(30) | No | No | NOT NULL | UNIQUE |
| full_name | VARCHAR(100) | No | No | NOT NULL | - |
| date_of_birth | DATE | No | No | NOT NULL | - |
| home_address | VARCHAR(255) | No | No | NULL | - |
| phone | VARCHAR(30) | No | No | NOT NULL | - |
| email | VARCHAR(254) | No | No | NULL | - |
| hire_date | DATE | No | No | NOT NULL | - |
| is_active | BOOLEAN | No | No | NOT NULL | - |
| created_at | TIMESTAMP | No | No | NOT NULL | - |
| termination_date | DATE | No | No | NULL | - |
| professional_title | VARCHAR(40) | No | No | NULL | - |
| specialty | VARCHAR(255) | No | No | NULL | - |
| introduction | VARCHAR(1000) | No | No | NULL | - |

### 表 D8 Qualification（专业资质）

适用：UC06；UC01/UC03/UC08 读取。统一专业资质目录；目录名称唯一。目录是否可用不能替代牙医证书核验和具体日期有效性。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| qualification_id | BIGINT | Yes | No | NOT NULL | UNIQUE |
| qualification_name | VARCHAR(120) | No | No | NOT NULL | UNIQUE |
| description | VARCHAR(255) | No | No | NULL | - |
| is_active | BOOLEAN | No | No | NOT NULL | - |

### 表 D9 DentistQualification（牙医专业资质）

适用：UC06 写；UC01/UC03/UC08 读取。牙医资质关联及证书事实。只有 VERIFIED 且在业务当日有效的必需资质满足匹配；证书续期的旧日期及核验依据追加到独立审计，不新增业务历史表或字段。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| dentist_id | BIGINT | Yes | FK:Dentist.dentist_id | NOT NULL | UNIQUE(组合) |
| qualification_id | BIGINT | Yes | FK:Qualification.qualification_id | NOT NULL | UNIQUE(组合) |
| certificate_number | VARCHAR(60) | No | No | NOT NULL | - |
| granted_date | DATE | No | No | NOT NULL | - |
| expiry_date | DATE | No | No | NULL | - |
| verification_status | VARCHAR(20) | No | No | NOT NULL | - |

复合主键及组合唯一为 (dentist_id,qualification_id)。

### 表 D10 DentistClinicAssignment（牙医诊所委派）

适用：UC06；UC02/UC01/UC03/UC07/UC08 读取。以起止日期表达随时间变化的牙医—诊所执业关系；保留 is_active 原字段，但不得只看布尔值而忽略日期。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| assignment_id | BIGINT | Yes | No | NOT NULL | UNIQUE |
| dentist_id | BIGINT | No | FK:Dentist.dentist_id | NOT NULL | - |
| clinic_id | BIGINT | No | FK:Clinic.clinic_id | NOT NULL | - |
| start_date | DATE | No | No | NOT NULL | - |
| end_date | DATE | No | No | NULL | - |
| availability_note | VARCHAR(255) | No | No | NULL | - |
| is_active | BOOLEAN | No | No | NOT NULL | - |

### 表 D11 DentistSchedule（出诊排班）

适用：UC02；UC01/UC07/UC08 读取。牙医在诊所某日的半开班次及固定时隙粒度。仅 NORMAL 的 (dentist_id,schedule_date,start_time) 条件唯一；SUSPENDED 历史可有多版，不参与该唯一与重叠校验。被引用后只挂起，不覆盖归属、日期、时段或粒度。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| schedule_id | BIGINT | Yes | No | NOT NULL | UNIQUE |
| dentist_id | BIGINT | No | FK:Dentist.dentist_id | NOT NULL | UNIQUE(条件组合) |
| clinic_id | BIGINT | No | FK:Clinic.clinic_id | NOT NULL | - |
| schedule_date | DATE | No | No | NOT NULL | UNIQUE(条件组合) |
| start_time | TIME | No | No | NOT NULL | UNIQUE(条件组合) |
| end_time | TIME | No | No | NOT NULL | - |
| slot_minutes | SMALLINT | No | No | NOT NULL | - |
| schedule_status | VARCHAR(20) | No | No | NOT NULL | - |
| note | VARCHAR(255) | No | No | NULL | - |
| created_at | TIMESTAMP | No | No | NOT NULL | - |

仅 schedule_status=NORMAL 时，(dentist_id,schedule_date,start_time) 唯一；SUSPENDED 历史不受该条件约束。

### 表 D12 Treatment（治疗项目）

适用：UC06 写目录；UC01/UC03/UC04/UC08 读取。统一检查、咨询及治疗目录与默认单位价。零价实际项目允许；调价只影响之后新建实际治疗，原表不增加货币浮点值或单位扩展字段。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| treatment_id | BIGINT | Yes | No | NOT NULL | UNIQUE |
| treatment_code | VARCHAR(30) | No | No | NOT NULL | UNIQUE |
| treatment_name | VARCHAR(120) | No | No | NOT NULL | - |
| description | VARCHAR(255) | No | No | NULL | - |
| default_unit_price | DECIMAL(12,2) | No | No | NOT NULL | - |
| is_active | BOOLEAN | No | No | NOT NULL | - |

### 表 D13 TreatmentQualification（治疗所需资质）

适用：UC06；UC01/UC03/UC08 读取。治疗所需资质的复合关联，is_mandatory 区分必需及展示性资质；至少缺一项必需资质即不匹配。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| treatment_id | BIGINT | Yes | FK:Treatment.treatment_id | NOT NULL | UNIQUE(组合) |
| qualification_id | BIGINT | Yes | FK:Qualification.qualification_id | NOT NULL | UNIQUE(组合) |
| is_mandatory | BOOLEAN | No | No | NOT NULL | - |

复合主键及组合唯一为 (treatment_id,qualification_id)。

### 表 D14 Appointment（就诊）

适用：UC01-S1—S5、UC03、UC04；UC08 读取。同一次预约/到诊/诊疗/开票的生命周期载体。创建时 patient_id、clinic_id、dentist_id、schedule_id 与班次一致并冻结归属；attended_at 派生到诊标记。取消分类独立于五状态，改约通过 rescheduled_from_id 新建后继，不恢复旧对象。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| appointment_id | BIGINT | Yes | No | NOT NULL | UNIQUE |
| patient_id | BIGINT | No | FK:Patient.patient_id | NOT NULL | - |
| clinic_id | BIGINT | No | FK:Clinic.clinic_id | NOT NULL | - |
| dentist_id | BIGINT | No | FK:Dentist.dentist_id | NOT NULL | - |
| schedule_id | BIGINT | No | FK:DentistSchedule.schedule_id | NOT NULL | - |
| scheduled_at | TIMESTAMP | No | No | NOT NULL | - |
| status | VARCHAR(20) | No | No | NOT NULL | - |
| problems_or_special_needs | TEXT | No | No | NULL | - |
| completed_at | TIMESTAMP | No | No | NULL | - |
| created_at | TIMESTAMP | No | No | NOT NULL | - |
| updated_at | TIMESTAMP | No | No | NOT NULL | - |
| attended_at | TIMESTAMP | No | No | NULL | - |
| cancelled_at | TIMESTAMP | No | No | NULL | - |
| cancellation_reason | VARCHAR(255) | No | No | NULL | - |
| cancellation_kind | VARCHAR(30) | No | No | NULL | - |
| rescheduled_from_id | BIGINT | No | FK:Appointment.appointment_id | NULL | UNIQUE |

### 表 D15 AppointmentRequestedTreatment（就诊期望治疗）

适用：UC01-S1/S5。预约时的期望项目集合及备注，仅表达意向，不可替代实际治疗、费用明细或收入。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| appointment_id | BIGINT | Yes | FK:Appointment.appointment_id | NOT NULL | UNIQUE(组合) |
| treatment_id | BIGINT | Yes | FK:Treatment.treatment_id | NOT NULL | UNIQUE(组合) |
| request_note | VARCHAR(255) | No | No | NULL | - |

复合主键及组合唯一为 (appointment_id,treatment_id)。

### 表 D16 AppliedTreatment（施用治疗）

适用：UC03 写；UC04/UC07/UC08 读取。实际诊疗事实：实际实施者、实施时间、正标准单位数及冻结历史单位价。实施牙医可不同于预约责任牙医；收入经开票明细逐项归本项实施者。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| applied_treatment_id | BIGINT | Yes | No | NOT NULL | UNIQUE |
| appointment_id | BIGINT | No | FK:Appointment.appointment_id | NOT NULL | - |
| treatment_id | BIGINT | No | FK:Treatment.treatment_id | NOT NULL | - |
| dentist_id | BIGINT | No | FK:Dentist.dentist_id | NOT NULL | - |
| standard_units | DECIMAL(10,2) | No | No | NOT NULL | - |
| unit_price | DECIMAL(12,2) | No | No | NOT NULL | - |
| subtotal | DECIMAL(14,2) | No | No | NOT NULL | - |
| performed_at | TIMESTAMP | No | No | NOT NULL | - |

### 表 D17 Invoice（结算单）

适用：UC04 写；UC07/UC08 读取。每次完成就诊至多一张费用凭据，appointment_id 与 invoice_number 分别唯一。issued_at 决定开票收入归季，不代表收款或付款成功。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| invoice_id | BIGINT | Yes | No | NOT NULL | UNIQUE |
| invoice_number | VARCHAR(40) | No | No | NOT NULL | UNIQUE |
| appointment_id | BIGINT | No | FK:Appointment.appointment_id | NOT NULL | UNIQUE |
| issued_at | TIMESTAMP | No | No | NOT NULL | - |
| total_amount | DECIMAL(14,2) | No | No | NOT NULL | - |
| invoice_status | VARCHAR(20) | No | No | NOT NULL | - |
| created_at | TIMESTAMP | No | No | NOT NULL | - |

### 表 D18 InvoiceItem（结算单明细）

适用：UC04 写；UC07/UC08 读取。逐项开票快照；每项实际治疗最多引用一次，每单行号唯一，且治疗属于该单的同次就诊。名称、单位数、历史价及小计随开票冻结。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| invoice_item_id | BIGINT | Yes | No | NOT NULL | UNIQUE |
| invoice_id | BIGINT | No | FK:Invoice.invoice_id | NOT NULL | UNIQUE(组合) |
| applied_treatment_id | BIGINT | No | FK:AppliedTreatment.applied_treatment_id | NOT NULL | UNIQUE |
| line_number | INT | No | No | NOT NULL | UNIQUE(组合) |
| treatment_name | VARCHAR(120) | No | No | NOT NULL | - |
| standard_units | DECIMAL(10,2) | No | No | NOT NULL | - |
| unit_price | DECIMAL(12,2) | No | No | NOT NULL | - |
| subtotal | DECIMAL(14,2) | No | No | NOT NULL | - |

组合唯一为 (invoice_id,line_number)；applied_treatment_id 另有非空单列唯一。

### 表 D19 CostEntry（成本凭证）

适用：UC07 成本资料准备及核算。已核验的交易级医疗用品/运营成本事实。source_reference 防来源重复；确认后不覆盖，使用唯一等额反号冲销再补正确记录。普通零额凭证须说明已确认零成本范围。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| cost_entry_id | BIGINT | Yes | No | NOT NULL | UNIQUE |
| dentist_id | BIGINT | No | FK:Dentist.dentist_id | NULL | - |
| clinic_id | BIGINT | No | FK:Clinic.clinic_id | NOT NULL | - |
| appointment_id | BIGINT | No | FK:Appointment.appointment_id | NULL | - |
| applied_treatment_id | BIGINT | No | FK:AppliedTreatment.applied_treatment_id | NULL | - |
| cost_type | VARCHAR(30) | No | No | NOT NULL | - |
| amount | DECIMAL(14,2) | No | No | NOT NULL | - |
| incurred_at | TIMESTAMP | No | No | NOT NULL | - |
| description | VARCHAR(255) | No | No | NULL | - |
| source_reference | VARCHAR(100) | No | No | NOT NULL | UNIQUE |
| source_batch | VARCHAR(60) | No | No | NOT NULL | - |
| confirmed_at | TIMESTAMP | No | No | NOT NULL | - |
| confirmed_by | VARCHAR(100) | No | No | NOT NULL | - |
| reversal_of_id | BIGINT | No | FK:CostEntry.cost_entry_id | NULL | UNIQUE |

### 表 D20 QuarterlyPerformance（季度绩效）

适用：UC07；UC08 只读取合规版本。每牙医每季度的准备/计算及发布版本；金额可空不等于零。source_snapshot 保存原有封账确认、来源凭证、名单、R1 及完整分摊依据。input_hash 对输入而非结果计算。同人同季至多一个当前 PUBLISHED。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| quarterly_performance_id | BIGINT | Yes | No | NOT NULL | UNIQUE |
| dentist_id | BIGINT | No | FK:Dentist.dentist_id | NOT NULL | UNIQUE(组合) |
| quarter_start | DATE | No | No | NOT NULL | UNIQUE(组合) |
| quarter_end | DATE | No | No | NOT NULL | UNIQUE(组合) |
| revenue | DECIMAL(14,2) | No | No | NULL | - |
| medical_supply_cost | DECIMAL(14,2) | No | No | NULL | - |
| operating_expense | DECIMAL(14,2) | No | No | NULL | - |
| net_profit | DECIMAL(14,2) | No | No | NULL | - |
| incentive_rate | DECIMAL(5,4) | No | No | NOT NULL | - |
| incentive_amount | DECIMAL(14,2) | No | No | NULL | - |
| calculation_status | VARCHAR(20) | No | No | NOT NULL | - |
| calculated_at | TIMESTAMP | No | No | NULL | - |
| calculation_version | INT | No | No | NOT NULL | UNIQUE(组合) |
| source_snapshot | JSON | No | No | NOT NULL | - |
| input_hash | CHAR(64) | No | No | NOT NULL | - |
| published_at | TIMESTAMP | No | No | NULL | - |

组合唯一为 (dentist_id,quarter_start,quarter_end,calculation_version)；它不等于当前 PUBLISHED 唯一，后者由发布事务另行保障。

### 表 D21 AppointmentEvent（就诊事件）

适用：UC01-S1—S5、UC03 完成、UC04。只追加的生命周期事件；事件旧状态与主表实际旧状态一致，随主记录原子保存。事件组合唯一仅防同预约重复，不能单独覆盖首次创建幂等。

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| appointment_event_id | BIGINT | Yes | No | NOT NULL | UNIQUE |
| appointment_id | BIGINT | No | FK:Appointment.appointment_id | NOT NULL | UNIQUE(组合) |
| event_type | VARCHAR(30) | No | No | NOT NULL | UNIQUE(组合) |
| from_status | VARCHAR(20) | No | No | NULL | - |
| to_status | VARCHAR(20) | No | No | NOT NULL | - |
| occurred_at | TIMESTAMP | No | No | NOT NULL | - |
| actor_role | VARCHAR(30) | No | No | NOT NULL | - |
| actor_reference | VARCHAR(100) | No | No | NOT NULL | - |
| reason | VARCHAR(255) | No | No | NULL | - |
| request_key | VARCHAR(64) | No | No | NOT NULL | UNIQUE(组合) |
| details | JSON | No | No | NULL | - |

组合唯一为 (appointment_id,event_type,request_key)，不是跨预约的首次创建幂等键。



### 表 D27 RegistrationFeePolicy（挂号费策略）

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| clinic_id | BIGINT | Yes | FK:Clinic.clinic_id | NOT NULL | - |
| dentist_id | BIGINT | Yes | FK:Dentist.dentist_id | NOT NULL | - |
| amount_fen | BIGINT | No | No | NOT NULL | - |
| updated_at | DATETIME(6) | No | No | NOT NULL | - |

### 表 D28 BookingHold（预约号源保留）

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| hold_id | BIGINT | Yes | No | NOT NULL | - |
| patient_id | BIGINT | No | FK:Patient.patient_id | NOT NULL | - |
| clinic_id | BIGINT | No | FK:Clinic.clinic_id | NOT NULL | - |
| dentist_id | BIGINT | No | FK:Dentist.dentist_id | NOT NULL | - |
| schedule_id | BIGINT | No | FK:DentistSchedule.schedule_id | NOT NULL | - |
| scheduled_at | DATETIME(6) | No | No | NOT NULL | - |
| slot_minutes | SMALLINT | No | No | NOT NULL | - |
| requested_treatment_ids | JSON | No | No | NOT NULL | - |
| confirmation_digest | BINARY(32) | No | No | NOT NULL | - |
| expires_at | DATETIME(6) | No | No | NOT NULL | - |
| status | VARCHAR(20) | No | No | NOT NULL | - |
| appointment_id | BIGINT | No | FK:Appointment.appointment_id | NULL | UNIQUE |
| created_at | DATETIME(6) | No | No | NOT NULL | - |
| updated_at | DATETIME(6) | No | No | NOT NULL | - |

### 表 D29 PatientBill（患者账单）

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| bill_id | BIGINT | Yes | No | NOT NULL | - |
| patient_id | BIGINT | No | FK:Patient.patient_id | NOT NULL | - |
| clinic_id | BIGINT | No | FK:Clinic.clinic_id | NOT NULL | - |
| kind | VARCHAR(20) | No | No | NOT NULL | - |
| hold_id | BIGINT | No | FK:BookingHold.hold_id | NULL | UNIQUE |
| appointment_id | BIGINT | No | FK:Appointment.appointment_id | NULL | - |
| invoice_id | BIGINT | No | FK:Invoice.invoice_id | NULL | UNIQUE |
| amount_fen | BIGINT | No | No | NOT NULL | - |
| status | VARCHAR(20) | No | No | NOT NULL | - |
| created_at | DATETIME(6) | No | No | NOT NULL | - |
| updated_at | DATETIME(6) | No | No | NOT NULL | - |

### 表 D30 PaymentOrder（支付订单）

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| payment_id | BIGINT | Yes | No | NOT NULL | - |
| bill_id | BIGINT | No | FK:PatientBill.bill_id | NOT NULL | UNIQUE |
| amount_fen | BIGINT | No | No | NOT NULL | - |
| mode | VARCHAR(10) | No | No | NOT NULL | - |
| status | VARCHAR(20) | No | No | NOT NULL | - |
| paid_at | DATETIME(6) | No | No | NOT NULL | - |
| created_at | DATETIME(6) | No | No | NOT NULL | - |

### 表 D31 RefundOrder（退款订单）

| 原字段 | 原类型 | PK | 原外键目标 | 可空性 | 原唯一标记 |
| --- | --- | --- | --- | --- | --- |
| refund_id | BIGINT | Yes | No | NOT NULL | - |
| payment_id | BIGINT | No | FK:PaymentOrder.payment_id | NOT NULL | UNIQUE |
| amount_fen | BIGINT | No | No | NOT NULL | - |
| reason | VARCHAR(255) | No | No | NOT NULL | - |
| actor_subject_id | VARCHAR(36) | No | No | NOT NULL | - |
| status | VARCHAR(20) | No | No | NOT NULL | - |
| created_at | DATETIME(6) | No | No | NOT NULL | - |

## D22—D24 原业务完整性约束

以下从 constraints.md 的已核对正文保留原规则；上方字段字典与本节共同构成数据约束，不把结构外键误当作全部业务条件。

### D22

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

### D23

| 状态 | status 取值 | 允许操作 | 数据约束 |
| --- | --- | --- | --- |
| 已预约 | SCHEDULED | 确认到诊、取消；挂起班次下办理改约 | 到诊、取消、完成时点均为空；无实际治疗及结算单。 |
| 进行中 | IN_PROGRESS | 记录问题、增加治疗、完成 | 到诊时点非空；完成和取消时点为空，允许尚无实际治疗。 |
| 已完成 | COMPLETED | 生成结算单 | 到诊与完成时点非空，至少一项实际诊疗项目；无取消资料。 |
| 已结算 | INVOICED | 查询与重复结算返回原单 | 存在唯一结算单；治疗和明细只读；到诊与完成时点保持。 该状态不表示已付款。 |
| 已取消 | CANCELLED | 查询历史；改约建立独立新预约 | 取消分类、原因、时点齐全；无到诊、实际治疗及结算单。 |

### D24

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


## 领域校验与状态迁移的落实

### 就诊生命周期

BOOK：不存在预约 → SCHEDULED；ATTEND：SCHEDULED → IN_PROGRESS；CANCEL：SCHEDULED → CANCELLED；COMPLETE：IN_PROGRESS → COMPLETED；INVOICE：COMPLETED → INVOICED。只允许这五种状态与五种迁移事件，不开放直接写 status 的通用接口。attended_at 是到诊事实字段，不新增独立到诊布尔列。

SCHEDULED 无到诊、取消、完成时点且无实际治疗/单据；IN_PROGRESS 有到诊时点、可暂时无治疗，但至少一项有效实际检查/咨询/治疗才可完成；COMPLETED 保留到诊及完成事实，不可继续增加治疗；INVOICED 有唯一完整费用凭据且治疗、开票明细只读，不表示付款。CANCELLED 只有取消事实而无到诊/诊疗/单据，不能恢复旧对象。

只有取消状态可保存 PATIENT_CANCEL、NO_SHOW、CLINIC_RESCHEDULE、CLINIC_CANCEL。患者自助取消须早于预约开始且班次 NORMAL；开始至时隙结束由前台核实代办；时隙结束后经前台核实未到诊才登记 NO_SHOW，不由定时任务判定。停诊只挂起班次；SCHEDULED 受影响预约保留待处理，经 S5 形成同患者无环的新旧链或诊所取消。SCHEDULED、IN_PROGRESS、COMPLETED、INVOICED 仍占用其原时隙，CANCELLED 释放占位。

### 资格、服务与时段

- 预约候选及最终提交都检查治疗所需的全部必需资质、VERIFIED、业务当日有效期、诊所执业区间、NORMAL 班次及占位；非必需资质只展示，不错误排除候选。实际治疗单独以实际实施日和实施牙医校验资质/执业，不能沿用预约筛选结果作终身许可。
- DentistQualification 使用 granted_date、expiry_date、verification_status；空到期日只有经核实长期有效才可使用，不把空值解释为“未核验也永久有效”。Qualification/Treatment 的目录可用性与证书核验是不同条件。
- DentistClinicAssignment 使用 start_date、end_date、is_active 共同表达可执业事实；不能只用当前 is_active 重写历史有效区间。任职、执业、班次和季度区间按原业务日期含义求交；离职日计入任职区间。
- 班次为 [start_time,end_time)，开始早于结束，slot_minutes>0 且整除班次长度；预约 scheduled_at 的业务日期、牙医、诊所与 schedule_id 一致且对齐时隙。跨诊所 NORMAL 重叠比较同一牙医，不能只检索当前诊所。
- 被引用班次不可覆盖归属、日期、时段、粒度；变更先 SUSPENDED 旧班次再创建新班次。目录/资质/执业变更影响未来预约时列出影响和后续处理，不静默改写已有安排。资质续期及受保护资料更正保留原值与核验依据。

### 诊疗、开票及历史金额

AppliedTreatment.dentist_id 为实际实施者，允许不同于 Appointment.dentist_id。每项 standard_units>0，unit_price>=0；由目录在建立实际治疗时确定并冻结价格，牙医不自行覆盖。预约期望治疗、实际治疗及费用快照是三种不同事实，不能互相补造。

subtotal=ROUND(standard_units×unit_price,2)，先逐项舍入到分后求和。每项实际治疗生成一行 InvoiceItem，复制本次名称、单位数、历史单价和小计；跨就诊引用拒绝。唯一 Invoice、所有 InvoiceItem、Appointment 的 INVOICED 及 INVOICE 事件整体提交。重复结算返回原单，不重新取目录价，不增加税费及折扣；支付和退款使用独立记录，不覆盖开票快照。

开票前价格纠错仅限授权核实并留痕；不增加价格版本字段，旧/新值与核实依据按原审计边界保存。开票后治疗及明细只读。免费咨询/检查按实际目录零价项目记录；无实际诊疗不能用虚构零价行完成就诊。

## 季度准备、成本完整性与 R1 快照

### 既有字段承载准备证据

UC07 的成本准备、封账确认和零成本确认属于原核算流程，不新增 QuarterClose、CostAllocation、PreparationBatch 等业务表，也不在 Clinic/CostEntry 新增 seal_status 或 JSON 字段。

- 已确认的正额/零额/冲销成本均使用原 CostEntry 字段。零额凭证用 description 明确已核实的诊所、季度、类型及适用零成本范围，保留 source_reference、source_batch、confirmed_at、confirmed_by；字段长度按原字典校验，不截断关键范围或用缺记录代替零。
- 季度人员及成本准备结果使用原 QuarterlyPerformance 的正 calculation_version、DRAFT 和 source_snapshot。快照内保留原已要求的封账确认、零成本范围/凭证、确认主体/时间/依据、人员名单、截止时点、来源 ID/金额及规则；不另造 calculation_version=0、“全局牙医0”或新核算状态来存准备批次。
- 相同输入摘要复用既有准备/计算版本；已有 DRAFT 可在相同冻结输入上完成计算，转 INCOMPLETE 或 CALCULATED。补录/修正导致输入变化时产生新摘要及新正版本，不覆盖已保存的来源依据或旧结果。计算版本与 R1 规则版本分别管理。
- 准备确认不得仅凭客户端传“资料齐备=true”；应用服务核验授权、确认记录和来源完整性，将核实证据与请求审计一并持久化。存在相同季度多个个人快照时，引用的当轮封账/人员/分摊依据须一致且可核对，不能各自杜撰完整性。
- 未封账、零成本范围未确认、医疗用品缺实施牙医归属，或有待分摊净额但有效总分钟为零，保存 INCOMPLETE 和具体缺失原因，允许未定金额为空，不允许发布。数据完整时个人激励为零的结果仍可正常复核发布。

### 收入、成本及分摊

自然季度按 Asia/Shanghai 的 [quarter_start,quarter_end) 解释；任职与季度相交者全部纳入，另补当季有收入/成本归属者，包括此前离职和无收入者。收入按 Invoice.issued_at 归季、以 InvoiceItem 引用的 AppliedTreatment.dentist_id 逐项归属；成本按 CostEntry.incurred_at 归季，医疗用品必须明确实施牙医，关联实际治疗时就诊/诊所/牙医的其他归属一致。

直接运营费用直接归属；无个人归属的 OPERATING 公共净额，按同诊所同季度、任职及执业有效区间内 NORMAL 班次与季度交集分钟数分摊，排除 SUSPENDED，不改用收入、治疗次数或平均人数。按净额绝对值先向下截至分，余分按未舍入余数降序、同余 dentist_id 升序分配，随后恢复符号。凭证份额及批次净额都应守恒且不重复计入；正费用及冲销净额同样处理。

net_profit=revenue−medical_supply_cost−operating_expense；incentive_rate 固定0.1000；incentive_amount=ROUND(MAX(net_profit,0)×0.10,2)。非正利润保存0激励，不产生负激励或跨季扣减。已确认成本更正为同归属同类型、唯一引用正额原凭证的等额反号冲销，再补正确记录；原凭证及来源保留。

### 快照与发布

source_snapshot 至少保留 R1、资料截止时点、人员/任职依据、来源结算明细 ID 与金额、成本凭证 ID 与净额、封账与零成本确认、分摊批次的完整接收者/有效分钟/份额/尾差。input_hash 采用稳定规范化输入，包括规则、来源、人员及截止；排除结果自身和新生成版本号以免同输入变成不同摘要。金额在 JSON 快照中仍用十进制字符串，不经浮点。源快照不替代原表关系，不把 CostEntry 与 QuarterlyPerformance 的逻辑 N:M 伪造为业务外键。

DRAFT/INCOMPLETE/CALCULATED/PUBLISHED/SUPERSEDED 保留原定义。计算和复核发布独立；发布前核验来源、名单、金额和分摊齐备、权限有效。首次发布也必须锁稳定 Dentist 行，不能只锁可能不存在的当前发布结果。替换发布时旧 PUBLISHED→SUPERSEDED 与新版本→PUBLISHED 同事务完成，旧金额、摘要及来源快照不改。

## BigDecimal、UTC 与数据映射边界

| 数据种类 | 规划映射与校验 |
| --- | --- |
| 原 DECIMAL(p,s) | MyBatis/JDBC 显式映射 Java BigDecimal，保留原 p/s；输入由十进制文本建立，不以 double 中转；超出范围或小数精度的请求明确拒绝，不靠数据库静默截断。 |
| 单位数/历史单位价/金额/激励率 | 分别保留原 DECIMAL(10,2)、DECIMAL(12,2)、DECIMAL(14,2)、DECIMAL(5,4) 等字典定义；乘法精确计算，小计和激励 HALF_UP 到分，R1 分摊向下截分后按规则补分。 |
| BIGINT 标识 | Java Long/对应整型存取，REST JSON 用字符串，避免两端 JavaScript 超出安全整数范围；业务编号 VARCHAR 不转成存储主键。 |
| DATE | 对应业务日/季度日期，不先转 UTC 导致日期偏移；按 Asia/Shanghai 计算边界。 |
| TIME | 业务日内时段；与 schedule_date 合成业务时点再转 UTC，不把日内时间单独当绝对时间。 |
| TIMESTAMP | 应用使用明确时间点，连接/数据库会话统一 UTC；返回带时区的 UTC 时间点并由前端按业务时区展示，禁止依赖 Windows/容器默认时区。 |
| JSON | 原 PatientAllergy.audit_history、AppointmentEvent.details、QuarterlyPerformance.source_snapshot 保留原用途；独立序列化器校验结构、来源及精确数值，不自动生成 JSON 外键。 |
| NULL | 仅按原 nullable 保存。INCOMPLETE 金额为空表示未确定，不转0；无过敏关联不自动推导 NO_KNOWN；expiry_date/end_date 空值不替代核验。 |

这些规则是实施方案，MyBatis TypeHandler、JDBC 时间往返、超界输入及半分舍入仍须以真实 MySQL 8.4 集成试验证明。不得把映射声明存在当作金额精度或时区验收通过。

## 统一锁顺序与事务保障

与 research.md R-D03 一致：写命令使用 READ COMMITTED；只读季度输入采用独立 REPEATABLE READ 来源快照。技术请求互斥及必要的身份事实稳定化先于业务锁；业务锁的统一顺序为 **Dentist 编号升序 → DentistSchedule 编号升序 → Appointment 编号升序 → 明细/结果**。只取得本命令必需的集合，先确定再按序锁；集合变化则回滚重新开始，不在已持有后序锁时补取前序锁。

| 操作 | 稳定锁及当前读 | 同事务写入与失败结果 |
| --- | --- | --- |
| UC02 排班及相关资质/执业更改 | 先锁稳定 Dentist，按同牙医全部诊所的原日期/状态谓词复核 NORMAL 唯一及不重叠；需要时再锁相关班次 | 班次或挂起事实及规定审计一起提交；首次无班次也受父行互斥，不只对空查询加锁。 |
| UC01-S1 创建预约 | 请求主体/操作/键互斥后，按所需顺序锁牙医及班次，重新读取资质、执业、NORMAL、有效占位 | Appointment、期望治疗、BOOK、技术回执及规定审计整体提交；同键不同内容拒绝，无效条件不保留部分预约。 |
| UC01-S2/S3/S4 | 先获得所需班次、再锁 Appointment，按服务端时间、当前班次/旧状态及可信执行者复核 | 到诊或取消事实与事件整体提交；已到诊不被爽约覆盖，同请求不重复迁移。 |
| UC01-S5 改约 | 按统一顺序锁涉及的牙医、新旧班次及旧 Appointment，当前读复核目标资格、占位及来源链 | 旧取消、新预约/期望治疗、来源关联、两端事件、回执/审计同时提交；任何失败全回滚，旧预约保留待处理。 |
| UC03 记录/完成 | 若需锁实施/责任牙医，先按编号取得，再锁就诊及相关实际治疗，当前读核验状态与治疗日资格 | 只在进行中新增；完成事实和 COMPLETE 原子保存。不能先锁就诊后反向取牙医锁，不能让完成与新增治疗穿插越过守卫。 |
| UC04 结算 | 锁稳定 Appointment，查询并复用已有 Invoice，否则锁所需明细形成冻结快照 | Invoice、所有 InvoiceItem、状态和 INVOICE 同时提交；唯一键作最终防线，失败无部分单据。 |
| UC07 保存版本/发布 | 同人同季保存版本及同输入复用在稳定 Dentist 锁内；批量升序，之后锁 QuarterlyPerformance | 首次/替换发布都原子检查并切换当前版本，失败不留下双发布或丢失旧版。只读来源快照与结果保存事务分开，不以长时间业务行锁代替冻结证据。 |
| 成本纠错 | 先按原归属确定业务锁集合；锁待冲销原成本并核验唯一冲销、归属及金额 | 每次凭证提交与其规定审计原子保存；先冲销再按核实流程补正确记录，原凭证不改，不将未完成更正的资料冒充完整；source_reference 和 reversal_of_id 唯一检查防重复。 |

必要的当前读及父行锁不能被普通快照 SELECT 替代。MySQL 命名锁是同一 mysqld、同一物理连接的技术锁，不随 COMMIT/ROLLBACK 自动释放；由事务完成回调在真正提交/回滚后、连接归池前释放，失败逐出连接。技术 RequestReceipt 以可信主体＋操作＋请求键唯一，摘要/结果引用与业务/审计同事务提交；BOOK 事件保留并交叉核对。所有异常回滚，Spring 事务从代理入口调用，不能依赖同类自调用的事务注解。

条件唯一与不重叠由这些受控写入口和稳定父锁实现；不声称 MySQL 原生支持带 WHERE 的部分唯一索引，不用隐藏生成列扩大字段集合，不把 NORMAL 条件键改为全局 UNIQUE。业务数据库账号不得供前端、通用 SQL 编辑接口或未采用该协议的独立写入者使用；运维数据修复需遵循原审批及验证流程。

## 独立技术存储与业务表计数

原始D1是业务数据库ERD，不是全系统所有技术存储的完整ERD。
本节上方24表完整字段保持原文；直接读取原Word的209字段、主键/唯一/44FK、D22—D24关系与规则
核对结果见 [business-baseline-audit.md](business-baseline-audit.md)，差异为0；这不是实际数据库DDL验收。

| 物理schema | 确切规划表 | 边界 |
| --- | --- | --- |
| adc_business | 原24张业务表 | 恰24/209/44，字段/类型/PK/FK/唯一和逻辑快照关系不变 |
| adc_identity | Subject、ExternalIdentity、StaffAccount、Session、LoginThrottle、BindingRequest、CurrentPatientBinding、BindingEvent、AccessGrant、GrantClinicScope、GrantCapability、RequestReceipt、flyway_schema_history | 13张技术表；身份、控制、元数据职责按模块及表级权限区分 |
| adc_audit | AuditEvent | 1张追加审计表，独立保留/权限边界，主体FK只指向技术Subject |

原Plan的adc_control、adc_meta不再创建为独立物理schema：
分别落在adc_identity.RequestReceipt及adc_identity.flyway_schema_history。
没有另设锁表、季度封账表或隐式框架会话表；原业务ERD不加技术表和业务外键。
14张技术表的逐字段、主键、唯一、19条纯技术FK、12项应用引用、独立技术ERD及边界图
统一定义于 [technical-data-model.md](technical-data-model.md)、
[technical-schema.json](technical-schema.json)，避免重复维护两份技术字段字典。

Subject等技术记录间由数据库FK保证；技术记录到Patient/Clinic/Dentist和多态业务引用由统一应用服务
当前读、本人/对象/诊所核验、固定锁序、同连接事务及恢复后巡检保证，不虚称跨库业务FK。
本人有效绑定数量遵守Clarify Q1，旧失效/新有效、核验历史和审计原子提交。
三个schema同实例同DataSource；所有相关数据和迁移历史恢复到共同binlog位点。

## 历史保护与恢复核验

不得覆盖或删除被引用目录、患者过敏核实链、班次归属及原时间、取消/改约轨迹、实际治疗历史价、开票快照、已确认成本、状态事件和绩效历史。受保护资料纠错按授权留原值及核验依据；成本按冲销后补记；发布新版保留旧金额/快照。目录停用只阻止新的非法选择，不抹去历史。

每日全备覆盖业务、身份技术（含控制与迁移历史）和审计三个schema，并保存一致日志位点；连续binlog归档的实际最长未归档跨度≤15分钟，保留可恢复30天的完整链。恢复不得分别拼接不同时间点；隔离恢复后校验24/209/44结构、关键金额/份额守恒、状态事件、唯一开单/发布、本人绑定与诊所授权、审计和请求回执引用。物理卷持久化不等于备份，活数据卷直接打包不等于一致全备。RPO≤15分钟及RTO≤4小时仍待实际演练，不能由本设计直接宣称达标。

## 验证范围与追踪

| 验证组 | 必须证明的事实 | 既有验收定位 |
| --- | --- | --- |
| 字段与关系 | 24表/209字段/44FK逐项一致，类型/精度/可空/PK/普通唯一保留，四关联复合PK正确 | FR-020；AC-G04 |
| 状态与冲突 | 五状态、四取消分类、事件和事实时点一致；NORMAL条件唯一、跨诊所重叠、有效占位、改约同患者无环 | FR-001—008、017、019；AC-UC01-S1—S5、AC-UC02、AC-G01/G03、AC-Q04 |
| 金额与归属 | BigDecimal/DECIMAL往返无漂移，历史价/逐项舍入、同次就诊明细、实施者收入、跨季UTC边界 | FR-007/008/022/023；AC-UC03、AC-UC04、AC-UC07-01/03/04、AC-G06/G07 |
| 完整性与版本 | 缺封账/零成本确认/归属时INCOMPLETE，R1守恒、非正利润激励0且可发布、唯一当前版本及历史保全 | FR-011/021/023；AC-UC07-01—09 |
| 身份/审计/技术隔离 | 有效绑定双向至多一个，旧绑定即使旧会话未过期也不能继续访问；撤权即时、审计可靠、技术存储不污染业务计数 | FR-013—016/018—020；AC-SF02-01—02、AC-Q06—08、AC-G02—G05 |
| 恢复 | 共同恢复点，金额/身份绑定/授权/审计/回执一致且达到原RPO/RTO | AC-Q05；SC-008 |

本轮只完成静态来源转录及文档核对；真实 MySQL 约束、行锁/命名锁、并发、故障注入、事务回滚、金额时间往返及恢复演练均**未执行**。后续须记录环境、虚构数据集、步骤、期望/实际及核验人；不得用SQLite、纯模拟对象或页面演示替代数据库一致性证据。技术支持依据及版本见 research.md；接口载荷与错误语义见本目录 contracts/，以统一方案评审后实施。

## 预约费用事务与数据边界

RegistrationFeePolicy以clinic_id/dentist_id复合主键配置整数分，未配置为零；新账单冻结金额。BookingHold保存预约意向、截止时刻、当前本人资料/过敏确认摘要和最终预约引用，HELD/BOOKED/CLOSED/EXPIRED独立于原就诊五状态。持有号源和正式预约共享医生/排班锁及重叠检查；支付前核对正常排班、有效资质、本人确认快照与当前关联，失效关闭保留。

PatientBill由挂号保留或真实Invoice提供唯一来源，PENDING/PAID/CLOSED/REFUNDED不替代Appointment或Invoice状态。PaymentOrder每账单至多一条成功演示支付，RefundOrder每支付至多一条全额退款。合法取消原预约时，同事务保存取消事件和演示退款；诊所改约退原费，替代预约沿用原改约业务，不另加收。治疗退款须另获billing.refund与诊所范围并记录原因，原Invoice/R1不回写。

金额为受范围约束的BIGINT整数分；模式固定DEMO，不接受客户端金额、模式或任意状态。服务端开关及测试门店白名单控制演示能力。真实微信商户渠道和异步对账不在当前物理实现中。
