# 当前业务数据基线核验

当前正式Word、字段字典及DBML共同采用24表、209字段、44外键；19个单列主键、5个复合主键。图D1使用负责人确认的布局，原19表位置及业务分区配色保留。身份及审计技术模型另列14表、110字段、19外键，不与业务图混画。

Word字段表由核验工具逐项比较名称、顺序、类型、PK、FK、可空及唯一标记，DBML使用解析器作独立比较；实际MySQL约束另由SchemaBaselineIT执行。原33个迁移摘要保留，新增V201。

| 表 | 字段 | 外键 | Word字段表 |
| --- | --- | --- | --- |
| Patient | 12 | 0 | D3 |
| Allergy | 4 | 0 | D4 |
| PatientAllergy | 8 | 2 | D5 |
| Clinic | 9 | 0 | D6 |
| Dentist | 14 | 0 | D7 |
| Qualification | 4 | 0 | D8 |
| DentistQualification | 6 | 2 | D9 |
| DentistClinicAssignment | 7 | 2 | D10 |
| DentistSchedule | 10 | 2 | D11 |
| Treatment | 6 | 0 | D12 |
| TreatmentQualification | 3 | 2 | D13 |
| Appointment | 16 | 5 | D14 |
| AppointmentRequestedTreatment | 3 | 2 | D15 |
| AppliedTreatment | 8 | 3 | D16 |
| Invoice | 7 | 1 | D17 |
| InvoiceItem | 8 | 2 | D18 |
| CostEntry | 14 | 5 | D19 |
| QuarterlyPerformance | 16 | 1 | D20 |
| AppointmentEvent | 11 | 1 | D21 |
| RegistrationFeePolicy | 4 | 2 | D27 |
| BookingHold | 14 | 5 | D28 |
| PatientBill | 11 | 5 | D29 |
| PaymentOrder | 7 | 1 | D30 |
| RefundOrder | 7 | 1 | D31 |

## 事务与核算边界

数据库可表达的PK、FK、普通唯一键及CHECK由数据库约束；资质、时隙占用、状态迁移、幂等支付退款及来源一致性由当前对象授权、固定顺序行锁和事务共同检查。INVOICED仍仅表示费用凭据；演示支付和退款独立保存，不改写原收入及R1个人正净利润10%口径。
