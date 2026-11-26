# 需求、图表与数据模型映射

编号来自最终Word，不新编业务需求。D1（表）与D1（图）用类型区分；图C12虽排在C16之后仍保留编号。

## 场景与支撑功能（表C3原文）

| 用例或支撑功能 | 规约及交互依据 | 分析责任对象与协作 | 状态及数据设计 |
| --- | --- | --- | --- |
| UC01-S1 创建预约 | UC01；表B3—B4；图C4 | 患者接口、预约就诊控制、患者、牙医、出诊排班、就诊 | 建立SCHEDULED；Patient及过敏关联、资质/执业/班次、Appointment及期望治疗、AppointmentEvent |
| UC01-S2 确认到诊 | UC01；表B4a；图C13 | 前台接口、确认到诊控制、就诊 | SCHEDULED→IN_PROGRESS；Appointment、DentistSchedule、AppointmentEvent |
| UC01-S3 取消预约 | UC01；表B4b；图C14 | 患者/前台接口、取消预约控制、就诊 | SCHEDULED→CANCELLED；PATIENT_CANCEL；Appointment、AppointmentEvent |
| UC01-S4 登记爽约 | UC01；表B4c；图C15 | 前台接口、登记爽约控制、就诊 | SCHEDULED→CANCELLED；NO_SHOW；Appointment、DentistSchedule、AppointmentEvent |
| UC01-S5 停诊改约 | UC01；表B4d；图C16 | 前台接口、停诊改约控制、旧/新就诊、出诊排班 | 旧预约CANCELLED，新预约SCHEDULED；Appointment及期望治疗、DentistSchedule、AppointmentEvent |
| UC02 出诊排班 | 表B11a；图C5 | 前台接口、排班控制、牙医、出诊排班 | Dentist、DentistClinicAssignment、DentistSchedule；停诊后转UC01-S5 |
| UC03 记录治疗 | 表B5—B6；图C6 | 牙医接口、记录治疗控制、就诊、治疗项目、施用治疗 | IN_PROGRESS→COMPLETED；Appointment、AppliedTreatment、Treatment、牙医资质/执业、AppointmentEvent |
| UC04 结算就诊 | 表B7—B8；图C7 | 收费接口、结算控制、就诊、结算单、施用治疗 | COMPLETED→INVOICED；Invoice、InvoiceItem、AppliedTreatment、Appointment及事件；另建独立诊疗账单及演示支付退款 |
| UC05 患者资料 | 表B11b；图C8 | 患者或前台接口、患者资料控制、患者、过敏症 | Patient、Allergy、PatientAllergy；SF02支持首次本人登记及已有档案安全关联；受保护资料更正仍由授权前台办理 |
| UC06 组织资源 | 表B11c；图C9 | 管理接口、组织资源控制、诊所、牙医及目录对象 | Clinic、Dentist、Qualification、DentistQualification、DentistClinicAssignment、Treatment及资质关联、Allergy |
| UC07 个人绩效 | 表B9—B10；图C10 | 管理/季度接口、绩效控制、季度绩效、成本凭证、牙医、结算单 | Invoice/InvoiceItem、AppliedTreatment、CostEntry、QuarterlyPerformance、Dentist；个人净利润10% |
| UC08 运营分析 | 表B11d；图C11 | 管理接口、分析控制及指标责任实体 | 只读Appointment、AppliedTreatment、班次/资质/执业、Dentist、QuarterlyPerformance等；保留口径与来源 |
| SF01 登录退出 | 表B12b；表D26 | 前端登录入口→身份组件校验会话→业务服务验证身份 | 身份组件保存账号与会话；不改变就诊状态 |
| SF02 本人登记与关联 | 表B12b；表D26 | 首次登记→新档案自动关联；已有档案→前台核验→当前关联→业务服务读取 | 首次本人登记创建新Patient并自动保存subject_id与patient_id映射；既有档案关联及维护按人工核实流程处理 |
| SF03 员工账号 | 表B12b；表D26 | 授权管理入口→身份组件维护账号→业务服务校验状态 | 账号由身份组件保存；Dentist只在牙医身份适用时关联 |
| SF04 诊所授权 | 表B12b；表D26 | 授权管理入口→身份组件保存授权→业务服务检查对象范围 | 角色和clinic_scope由身份组件保存；业务表为24张 |

## 数据表与用例（表D1原文及结构表编号）

| 分析来源 | 数据表 | 原文用例 | 字段定义 | 模型图 |
| --- | --- | --- | --- | --- |
| 患者 | Patient | UC01、UC05 | D3 | 图C1；图D1 |
| 过敏症 | Allergy | UC01、UC05 | D4 | 图C1；图D1 |
| 患者—过敏症 | PatientAllergy | UC01、UC05 | D5 | 图C1；图D1 |
| 诊所 | Clinic | UC01、UC06 | D6 | 图C1；图D1 |
| 牙医 | Dentist | UC01、UC06 | D7 | 图C1；图D1 |
| 专业资质 | Qualification | UC06 | D8 | 图C1；图D1 |
| 牙医—专业资质 | DentistQualification | UC06 | D9 | 图C1；图D1 |
| 牙医—诊所 | DentistClinicAssignment | UC02、UC06 | D10 | 图C1；图D1 |
| 出诊排班 | DentistSchedule | UC01、UC02 | D11 | 图C1；图D1 |
| 治疗项目 | Treatment | UC03 | D12 | 图C1；图D1 |
| 治疗—所需资质 | TreatmentQualification | UC01、UC06 | D13 | 图C1；图D1 |
| 就诊 | Appointment | UC01、UC03 | D14 | 图C1；图D1 |
| 就诊—期望治疗 | AppointmentRequestedTreatment | UC01 | D15 | 图C1；图D1 |
| 施用治疗 | AppliedTreatment | UC03 | D16 | 图C1；图D1 |
| 结算单 | Invoice | UC04 | D17 | 图C1；图D1 |
| 开票明细快照 | InvoiceItem | UC04 | D18 | 图C1；图D1 |
| 成本凭证 | CostEntry | UC07 | D19 | 图C1；图D1 |
| 季度绩效 | QuarterlyPerformance | UC07 | D20 | 图C1；图D1 |
| 就诊状态事件 | AppointmentEvent | UC01、UC03、UC04 | D21 | 图C1；图D1 |

## 旧图源编号

| 旧图源键 | 最终需求场景 | 图编号 |
| --- | --- | --- |
| UC09 | UC01-S2 | C13 |
| UC10 | UC01-S3 | C14 |
| UC11 | UC01-S4 | C15 |
| UC12 | UC01-S5 | C16 |

## 质量需求

Q01—Q09保持表B12定义，统一适用各用例。身份支撑SF01—SF04见表B12b和表D26，不映射新增业务表。完整图源路径见[图表索引](../diagrams/README.md)，完整结构见[DBML](../diagrams/database/D1-database.dbml)。

## 规范编号的完整表名索引

下列补充读取/关联为基于表C3与操作契约整理的导航，不是新增需求。表D1的直接追踪仍以上文原文为准。Q01—Q09统一适用各用例，不人为指定新图号。

| 需求 | 图编号 | 相关业务表（包括读取） |
| --- | --- | --- |
| UC01 | B1、C4、C13、C14、C15、C16、C12 | Patient、Allergy、PatientAllergy、Clinic、Dentist、DentistSchedule、TreatmentQualification、Appointment、AppointmentRequestedTreatment、AppointmentEvent、DentistQualification、DentistClinicAssignment、Treatment、RegistrationFeePolicy、BookingHold、PatientBill、PaymentOrder、RefundOrder、RegistrationFeePolicy、BookingHold、PatientBill、PaymentOrder、RefundOrder |
| UC02 | B1、C5 | DentistClinicAssignment、DentistSchedule、Appointment、AppointmentEvent |
| UC03 | B1、C6、C12 | Treatment、Appointment、AppliedTreatment、AppointmentEvent、Dentist、DentistQualification、DentistClinicAssignment、Qualification、Invoice |
| UC04 | B1、C7、C12 | Invoice、InvoiceItem、AppointmentEvent、Appointment、AppliedTreatment、Treatment、PatientBill、PaymentOrder、RefundOrder、PatientBill、PaymentOrder、RefundOrder |
| UC05 | B1、C8 | Patient、Allergy、PatientAllergy |
| UC06 | B1、C9 | Clinic、Dentist、Qualification、DentistQualification、DentistClinicAssignment、TreatmentQualification、RegistrationFeePolicy、RegistrationFeePolicy |
| UC07 | B1、C10 | CostEntry、QuarterlyPerformance、Invoice、InvoiceItem、AppliedTreatment、Dentist、DentistSchedule、DentistClinicAssignment、Clinic |
| UC08 | B1、C11 | Appointment、AppliedTreatment、Treatment、DentistSchedule、DentistQualification、Qualification、DentistClinicAssignment、Dentist、QuarterlyPerformance、Clinic |
| SF01 | D2 | 独立身份组件 |
| SF02 | D2 | Patient |
| SF03 | D2 | Dentist |
| SF04 | D2 | Clinic |
| R1 | C10、D1 | QuarterlyPerformance、CostEntry、Invoice、InvoiceItem、AppliedTreatment、Dentist、DentistSchedule、DentistClinicAssignment |
