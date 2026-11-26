# ADC-CONTRACT-20261112-03

2026-11-12负责人明确回复：“批准这份有限契约修正”。具体提案见docs/verification/decisions/uc06-contract-projection-proposal.md，提出时的待审状态及后续批准说明均保留。

只补充AssignmentEntry的可选原assignment_id，DentistView的资质/执业关联，TreatmentView的资质要求，以及既定维护操作的范围内未来影响投影；总部过敏目录三项操作改用AllergyResourceView。患者过敏AllergyView、PatientView、其余UC05接口不变。没有新增路径或操作，仍为82项；不改业务表/字段、Spec、Plan、Constitution和原审批登记。

同名JSON记录openapi.json、api.md、operations.md的前后SHA-256，严格衔接ADC-CONTRACT-20261112-02。DTO及标准/载荷/漂移工具同步；10项契约测试通过，实际业务证据见docs/verification/stories/organization-resources.md。resource.read已在原获批资源详情操作中定义，此次实现补齐其允许能力登记，不自动授予任何账号。
