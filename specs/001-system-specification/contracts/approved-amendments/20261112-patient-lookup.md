# ADC-CONTRACT-20261112-02

2026-11-12负责人明确回复：“批准该最小契约补充”。对应提案为docs/verification/decisions/uc05-contract-gap-proposal.md，保留其提出时待审历史及此次批准状态。

范围限定为UC05新增POST /patients/lookup和PatientCreate的实际服务/人工核验上下文。新增4个请求/响应Schema；原81个operationId及其内容保留，原组件中只扩展PatientCreate，PatientView不变。沿用原审计、回执、CSRF和身份范围守卫，不增加业务或技术表/字段，不改Spec、Plan、Constitution及原审批登记。

openapi.json、api.md、operations.md的前后SHA-256记录在同名JSON，前项严格衔接ADC-CONTRACT-20261111-01及原批准指纹。共享DTO、标准验证器和漂移检查按此批准链更新；不能把本次补充解释为允许任意接口漂移或重写旧审批。
