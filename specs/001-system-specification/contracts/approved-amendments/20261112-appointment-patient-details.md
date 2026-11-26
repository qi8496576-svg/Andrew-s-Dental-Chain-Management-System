# ADC-CONTRACT-20261112-04

2026-11-12，负责人回复：“批准这一处嵌套 DTO 修正”。对应提案 docs/verification/decisions/uc01-patient-details-contract-proposal.md。

仅增加 AppointmentPatientDetails（原七项患者资料、原六项必填），将 AppointmentCreate.patient_details 引用指向该 schema，避免患者预约被动要求提交前台建档核验声明。PatientCreate 与其前台核验要求保持不变；82个操作、数据库、Spec、Plan、任务与业务规则均不变。

同名JSON记录三份契约的实际前后SHA-256，衔接ADC-CONTRACT-20261112-03，不覆盖历史批准记录。共享类型与漂移验证按此批准链同步。
