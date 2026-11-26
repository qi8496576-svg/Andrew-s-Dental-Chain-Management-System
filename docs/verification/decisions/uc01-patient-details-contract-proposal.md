# UC01-S1：预约患者资料与建档核验上下文隔离（待负责人批准）

提出时：2026-11-12，执行 T029 前检查发现一处现有契约引用冲突，当时尚未修改契约源或批准记录。负责人随后明确回复“批准这一处嵌套 DTO 修正”；按 ADC-CONTRACT-20261112-04 的有限范围执行，原提出记录保留。

ADC-CONTRACT-20261112-02 为 POST /patients 的 PatientCreate 增加了必填 verification_basis（授权前台建档人工核验上下文）。AppointmentCreate.patient_details 同时引用 PatientCreate，因而也被动增加了这一必填项。原预约要求的是七项患者资料及本次过敏确认；PatientView 不返回建档核验上下文。小程序不能伪造“前台已人工核验”的建档声明，也不能靠忽略当前 schema 必填项完成契约验收。

最小建议：新增 AppointmentPatientDetails schema，内容严格取原七项患者资料（保留原六项必填与 email 可空/可省略），仅把 AppointmentCreate.patient_details 的引用改为此 schema。PatientCreate 及其建档核验字段保持原样。前台代办的 patient_verification_reference、本人当前绑定、过敏确认、资料一致性、诊所权限及原子预约规则均保持不变。

范围：仅一个嵌套 DTO 引用及一个复用 schema；82 个操作不增删，组件由90变为91。无数据库、Spec、Plan、业务规则或任务变更。批准后追加独立修正记录并同步 DTO、契约漂移校验，保留全部既有审批历史；随后以真实 MySQL、HTTP、Vue及小程序边界测试验证 T029/T030。

可审阅补丁：同目录 `uc01-patient-details-contract.patch`。当前 T025—T028 可继续；T029/T030 的依赖实施等待此项批准。
