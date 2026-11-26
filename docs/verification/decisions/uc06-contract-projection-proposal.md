# UC06 组织资源：现有接口投影最小修正提案

2026-11-12提出时待负责人批准，未修改契约源或原审批，T023未勾选。随后负责人明确回复“批准这份有限契约修正”，按本有限范围追加ADC-CONTRACT-20261112-03并实施，原待审过程保留。T021/T022已通过实际验收，本提案不是重做Spec/Plan/Tasks。

## 现有需求与具体缺口

Spec User Story 10、AC-UC06-01/04及T023/T024要求维护/查看资质、执业和治疗资质要求，缩短有效期时列明受影响未来安排，保留历史，不静默改变预约。对当前OpenAPI逐项核对发现：

| 现有契约位置 | 缺口及影响 |
| --- | --- |
| AssignmentEntry；POST /dentists/{dentistId}/clinic-assignments | 没有assignment_id；原表只以assignment_id为主键，没有(dentist_id,clinic_id,start_date)唯一约束。不能擅自用该组合推定要覆盖哪条旧记录，也无法明确指定要缩短的原执业记录。 |
| DentistView；GET /dentists/{resourceId}及关联维护响应 | 仅有牙医基本资料，没有资质或执业关联投影，也没有独立的关联读取操作。页面重载后不能可靠展示这些既有关系。 |
| TreatmentView；GET /treatments/{resourceId}及setTreatmentRequirements响应 | 没有当前必需/非必需资质关联投影。不能用前端保存上次表单或假数据代替实际数据库状态。 |
| 资源维护响应 | 没有受影响未来安排的投影。Error.field_errors仅允许field/code，并不是成功调整后的业务提示模型；不能擅自以“一律拒绝调整”替代批准流程。 |
| POST /allergies、GET/PATCH /allergies/{resourceId}的200响应 | 引用的是患者过敏AllergyView，其中is_retracted必填且带临床备注；原Allergy目录没有此字段，而description/is_active反而不能返回。不能伪造一个患者关联状态给共享目录。 |

## 待批准的最小修改

不增加路径或操作，操作数维持82，原19/163/30数据库及全部业务规则不变：

1. **AssignmentEntry增加可选assignment_id: Id**（字符串）。省略表示新建，提供时明确定位原记录；服务端校验路径牙医、原记录及诊所授权，按原规则调整日期/状态并留痕。不新增复合唯一约束，不按模糊组合覆盖。
2. **DentistView增加可选qualifications和clinic_assignments数组**。分别投影原关联的qualification_id、certificate_number、granted_date、expiry_date、verification_status；以及assignment_id、clinic_id、start_date、end_date、availability_note、is_active。父牙医从原资源路径取得。字段类型/可空性严格来自原字典，不能加入新的业务属性。执业只返回当前获授权范围，历史记录保留。
3. **TreatmentView增加可选qualification_requirements数组**，项为qualification_id: Id、is_mandatory: boolean，对应原TreatmentQualification，不添加目录字段或关系表。
4. **ClinicView、DentistView、QualificationView、TreatmentView增加可选future_impact数组**，用于既定维护操作成功后的提示。项只包含object_kind（DentistSchedule或Appointment）、object_id: Id、clinic_id: Id、affected_date（date，可选）、reason（字符串）。只返回当前授权范围内的必要引用/日期和影响说明，不返回患者资料或临床内容；空数组表示本次检查无相应影响。不新增自动取消、自动停诊、自动改约或一律拒绝调整政策；原权限及业务守卫继续适用。
5. **单独定义AllergyResourceView**：allergy_id: Id、allergy_name: string、description: string|null、is_active: boolean，对应原Allergy目录四列；仅将上述三项总部资源操作的200响应改为此投影。患者过敏AllergyView及UC05接口保持原样，不把is_retracted移到业务目录。

这些都是既有业务数据和既定结果的接口表达；不新增业务功能、表、列、状态、权限政策或支付能力。旧审批、Spec、Plan、Constitution、Word/ERD/UML不修改。

## 获批后的修改与验证范围

只增补contracts/openapi.json、api.md、operations.md对应描述，追加独立批准修正登记，更新DTO/漂移校验及原任务内操作映射；不重新生成任务或重新执行Analyze。当前T023代码只具备患者页面所需的既有过敏目录最小读取，不能据此宣称组织资源维护已完成。

先写真实MySQL/HTTP测试验证明确记录更新、关联读取、范围过滤、历史保护、价格快照、未来影响、并发锁及审计回滚；再实现总部资源页面并运行真实浏览器闭环。必须确认Patient/PatientAllergy响应、原业务结构及其余接口未发生漂移。
