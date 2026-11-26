# UC05 患者检索与服务核验：最小契约补充提案

提出时状态：待负责人批准，2026-11-12，当时未修改契约源、Spec、Plan、数据库或任务清单。后续负责人明确回复“批准该最小契约补充”；按此有限范围追加契约修正登记并实施，不重新规划系统。

## 已有依据与缺口

- Spec User Story 9、AC-UC05-01/02要求前台核实身份、检索查重、返回患者编号，并以合法诊所服务依据复用档案；phone不唯一，不自动合并。
- contracts/api.md要求核实引用对应同主体、对象、范围的服务端可查证据；不能接受任意字符串或“已核实=true”单独放行。
- 当前OpenAPI的患者根路径只有POST /patients；GET /patients/{patientId}只接受存储主键，不提供患者编号检索。PatientCreate只有七项患者资料，不含服务诊所或核验依据。
- 已有预约及已批准BindingRequest可以作为部分既有服务证据，但不能覆盖“尚无预约、尚未绑定小程序的新患者/首次跨诊所前台核验”。不能把全体授权诊所当作本次实际服务点，也不能给Patient增加归属诊所字段。

## 待批准的两处补充

1. **新增POST /patients/lookup**，只实现既定UC05按患者编号核实检索，不提供全链患者遍历或电话自动识别。
   - 输入：patient_number（字符串，最多30字符）、date_of_birth（date）和verification_basis；均必填。
   - verification_basis包含clinic_id（既有Id）、person_confirmed（布尔）、service_basis（非空字符串，最多255字符）。只有实际授权前台可提交人工确认；它不是匿名或患者自助声明。
   - 服务端校验当前RECEPTION及患者读取能力、该实际服务点的当前范围、患者编号/出生日期与原主档精确匹配、确认及服务说明。核验失败不返回匹配对象详情。
   - 成功返回`{patient: PatientView, verification_reference: string}`，不修改PatientView定义。引用由服务器生成，对应同事务成功核验审计中的可信主体、Patient、单一实际服务诊所和时点；不得由客户端自造。
   - 采用既有Web CSRF、Idempotency-Key、原键重试/回执及最小披露规则；审计/回执失败整体拒绝。已保存且仍具当前授权的同主体/对象/范围核验证据供现有GET、PATCH及过敏命令复核，不把读过一次或历史角色快照当作当前权限。
2. **POST /patients的PatientCreate增加必填verification_basis**，含上述clinic_id、person_confirmed、service_basis，另可提交duplicate_reviewed（布尔，默认false）及review_reason（字符串，最多255字符）。
   - 其余七项患者资料和既有响应原样保留。服务端核对实际服务点权限，保存可信核验人、时间、依据及建档审计。
   - 按现有资料检查疑似重复，不以phone唯一或自动合并。仅出现疑似重复且未完成实际人工复核时提示复核；确认不同患者后按原UC05允许分别建档，复核理由留痕。同电话的不同患者仍可合法存在。
   - 核实布尔值仅记录授权前台的人工确认；必须与真实会话、当前能力/诊所、原资料比对和成功审计组合校验，不能凭布尔值或任意核实引用越权。

核验证据使用现有adc_audit.AuditEvent及既有RequestReceipt，不新增业务或技术表/字段；不为Patient建立永久诊所所有权。没有真实微信也可由授权前台按既定业务范围办理，不要求患者先开通小程序。这里只是接口表达补齐，不增加身份证件上传、支付、全链患者查询或自动匹配身份。

## 修改边界及验证

若批准，只增补contracts/openapi.json及api.md、operations.md中的对应操作/投影说明，追加独立批准修正记录并同步DTO/漂移工具；operations由81变为82，原81个operationId不改名/删除。T021/T022的既有实施范围承载此补充，不增改任务编号，不重写Spec/Plan/Constitution或原审批历史。

须先写真实MySQL与HTTP测试：无服务权限、他人核验引用、错误编号/生日、跨诊所、未核实、重复复核、同电话两人、审计回滚、原键重试，以及人工核验后读取/更正和撤权立即失效；再完成患者页面闭环。获批前不开放上述新路径、不修改既有契约、不以测试夹具代替首次实际核验流程。
