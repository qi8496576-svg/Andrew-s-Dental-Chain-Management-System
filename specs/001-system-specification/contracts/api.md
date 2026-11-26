# ADC 统一业务接口行为契约

日期：2026-11-07；阶段：Plan Phase1，技术基线已获负责人2026-11-07正式批准，未实现；本轮仅同步状态。依据：[Spec](../spec.md)、[数据模型](../data-model.md)、最终 Word D25/D26。完整操作目录为 [operations.md](operations.md)，机器形式为 [openapi.json](openapi.json)，身份及会话细则为 [identity.md](identity.md)。

## 统一传输和版本

统一 HTTPS REST/JSON 前缀 /api/v1。OpenAPI 3.1.1 是本轮选定的契约格式，不宣称它是最新规范。契约修改须检查 UC/SF/Q、双方 DTO、数据影响及原验收；不以改版本号绕开业务批准。

BIGINT 标识使用十进制字符串，金额、单位数、比率也用字符串，不能经 JavaScript Number 或 Java double 中转。原金额两位、单位数两位、激励率0.1000；Money、UnitPrice、Units 的位数保持原字典。成本金额使用 DECIMAL(14,2) 非负范围，冲销由服务器引用原正额生成等额负值。输入溢出/多余精度不静默截断。

时间点请求必须带时区，响应为 UTC；日期和班次 TIME 按 Asia/Shanghai 业务本地值解释。日/季度边界按业务时区计算，季度起点含、终点不含。服务端生成确认、到诊、取消、开票、发布等事实时点，不能从客户端任选当前时钟。

JSON 请求拒绝未列字段；输入只有可执行命令，不能任意 PATCH status、伪造主体/授权范围、普通诊疗单价或计算结果。资源 PATCH 只限获批的目录/组织资料及医生职称、擅长、简介字段；停用必须保留引用。临床备注 PATCH 仅 IN_PROGRESS，已完成不能借备注或通用资源操作追加治疗。

## 身份、权限和投影

OpenAPI 中 Cookie 与 Bearer 是传输方式的并列描述，不表示两类客户端都可调用所有操作。服务端还必须组合检查会话类型、可信主体、功能能力、诊所有效期、具体对象及当前本人绑定：PATIENT 不能调用员工操作，Web 不能使用任意 Bearer 绕过 CSRF。

患者的 patient_id 从当前有效绑定读取；普通患者请求自报该字段须拒绝。前台代办的 patient_id 是待核验对象标识，必须同时校验其诊所服务依据和服务端可验证的 patient_verification_reference。实际实施牙医、成本确认人和发布人都从可信员工主体取得，不接受客户端替他人归收入或自称已核验。

“医生”沿用牙医；“诊所管理员”按 SF04 已获岗位能力和诊所范围工作，不由名称自动取得总部维护、成本核验、发布、账号管理或授权管理能力。能力名是接口设计标识，不新增原用例。授权管理者不能授予超出自身可授范围的能力。

| 返回视图 | 可见范围和最小字段 |
| --- | --- |
| CatalogItem / Candidate | 可按用途读取的目录代码、名称、有效标志及候选牙医/班次/时隙；不返回牙医家庭住址和无关联系资料。牙医完整资源名单/详情限员工相应权限。 |
| AppointmentView | 本人预约或获授权岗位对象的预约号、归属、时间、五状态及事实/来源标识；知道ID不构成访问证明。 |
| ClinicalContext | 获授权本次就诊牙医读取必要过敏确认、当前/撤销风险项、问题/特殊需求及实际治疗；不返回账单地址或无关患者档案。 |
| PatientView / AllergyView | 完整本人资料仅限当前有效关联的患者及有服务依据的授权前台；核实历史的敏感读取另校验。牙医/收费不通过完整档案接口取得无关字段。 |
| InvoiceView | 授权收费及有来源读取权的总部读取费用凭据/项目快照。按实际凭据需要补患者姓名/账单信息时仍为最小投影，不能附带过敏全文。没有已付款标识。 |
| PerformanceView / AnalysisView | 内部核算按权限查版本/状态，普通分析只用当前 PUBLISHED；默认汇总，来源快照和敏感下钻另授权并留读取审计。 |
| SubjectView / GrantView / AuditView | 分别限账号、授权及审计管理权限，只返回管理所需信息；密码、会话令牌、微信秘密均不返回。 |

对象不在可信范围时返回统一拒绝或不可访问响应，不能通过不同错误内容泄漏他人档案是否存在。查询的权限过滤须在分页和聚合之前完成。

### 首次本人登记与预约

registerSelfPatient为WECHAT患者提供首次登记，沿用Patient预约所需姓名、出生日期、联系电话，服务器生成编号并自动关联当前主体，不要求人工核验。已有档案仅由授权前台安全核实后关联；患者不能提交patient_id或核验字段认领历史资料。本人声明为SELF_DECLARED，过敏保持NOT_REVIEWED；SD1是当前声明确认引用，可用于本人预约，不能当作AR1医护核实。活动门店、治疗项目和真实候选允许已登录未关联患者只读；完整档案、预约写入与回执重放均复核当前本人映射。详细字段、并发和回滚要求见identity.md及SelfPatientRegistration。

## 请求回执、并发和响应

受保护写命令携带 Idempotency-Key（1—64字符）。可信主体+操作+键形成互斥/回执范围，同时比较规范化内容摘要；同键同内容复用，异内容409，不允许覆盖。身份组件只在认证入口处理密码/临时代码，不把秘密和登录返回的明文令牌写入通用回执。

顺序固定为：当前身份/授权复核 → 同键及请求内容摘要核对 → 已成功回执重放 → 仅首次执行才检查If-Match和业务前置。If-Match属于规范化请求内容的一部分；原请求提交成功后响应丢失，使用原键/原内容/原If-Match重试须返回原操作结果，不能因本次成功已经改变ETag而误报412。换键或改变If-Match视为新的内容/命令；历史回执不能绕过现在的撤权或失效绑定。

请求先查当前可信身份及所需权限，再在同一事务连接内取回执及稳定业务锁。成功结果以对象引用保存于 adc_identity.RequestReceipt；原 BOOK/ATTEND/CANCEL/COMPLETE/INVOICE 事件仍按原数据表保存并核对。业务事实、状态事件、关联/明细、规定成功审计及成功回执必须整体提交；未持久化审计不能报告完成。

所有多对象写操作采用研究中的同序锁协议。命名锁不会随提交/回滚自动释放，须在事务真正完成后、连接归还前释放；释放失败逐出连接。禁止请求锁在连接A、事务在B、释放在C。发布首次也锁稳定 Dentist，不能靠不存在的旧发布版互斥。

成功默认200返回新或原结果；无响应体命令204。HTTP状态不能单独证明业务完成，须核对对象、状态和事件。响应超时/连接中断后结果未知，不当作失败证明；使用 getRequestResult 按原主体/操作/键查或原键重试。UNKNOWN 表示尚不能确认结果，PENDING 为当前请求锁可确认正在处理的观察状态，不预先独立提交PENDING回执；SUCCEEDED 引用已提交结果。返回原回执前仍检查当前授权，重绑/撤权后不能借历史回执绕过限制。

列表默认20、最大100、cursor为不透明值。它是技术分页选择，不是业务处理数量限制。ETag基于原字段/当前规范化内容计算；支持修订的资源读取返回ETag，If-Match过时412，客户端重新读取、核实后提交，不新增业务version字段。过敏项目的ETag可在项内返回，实际治疗视图也返回其计算标识。

Web员工登录及Cookie写请求要求精确Origin和CSRF；匿名GET /auth/csrf只初始化CSRF上下文，不授业务身份。小程序只接受绑定WECHAT会话类型的ADC不透明Bearer，不能使用微信session_key或客户端自报OpenID。

## 错误契约

| HTTP | 机器码示例 | 可判定结果与处理 |
| --- | --- | --- |
| 400 | INVALID_REQUEST | JSON/格式不正确，指出字段，不提交业务。 |
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_DISABLED | 无有效身份或会话已失效，不返回敏感数据。 |
| 403/404 | ACCESS_DENIED / OBJECT_NOT_ACCESSIBLE / PATIENT_BINDING_REQUIRED | 拒绝当前功能/对象/本人范围；允许范围内确实不存在可404，范围外不得泄漏存在性。 |
| 409 | SLOT_OCCUPIED / STATE_CONFLICT / BINDING_CONFLICT / IDEMPOTENCY_CONTENT_CONFLICT / PUBLISH_CONFLICT | 保留先提交合法结果，本次无部分变更；同键异内容不覆盖。 |
| 412 | PRECONDITION_FAILED | If-Match过时，不覆盖当前资料。 |
| 422 | FIELD_REQUIRED / QUALIFICATION_INVALID / ASSIGNMENT_INVALID / ALLERGY_CONFIRMATION_REQUIRED / NO_VALID_TREATMENT / PERFORMANCE_INCOMPLETE | 字段或业务条件不满足，保留可更正输入并说明原因；不完整计算可保存INCOMPLETE，发布必须拒绝。 |
| 422 | SELF_DECLARATION_REQUIRED | 缺少本人资料确认或过敏声明，不执行登记。 |
| 429 | AUTH_ATTEMPT_LIMITED | 第5次连续认证失败限制15分钟；客户端改计时不能绕过。 |
| 503 | IDENTITY_UNAVAILABLE / PERSISTENCE_UNAVAILABLE / LOCK_RETRY / COMMIT_OUTCOME_UNKNOWN | 无法验证身份不放行；锁等待/依赖故障/提交未知安全重试，未知结果按原键核对。 |

错误响应为code、message、request_id，可附field_errors及retry_with_same_key；不得返回SQL、秘密、无关病历或越权对象详情。Q03的非预期服务错误率不能直接把所有非2xx都算错：业务409/422需依机器码分类。保存失败须整体回滚；拒绝/失败审计可在回滚后独立持久化，但不能伪记为成功。

## 用例命令的关键条件

完整81项HTTP操作、operationId、原编号、权限和AC入口导航见 [operations.md](operations.md)。同功能所有原AC仍适用，不能只测目录中的一个导航场景。

| 请求或命令 | 必须执行的条件 |
| --- | --- |
| AppointmentCreate | 诊所/班次/预约时间/期望项目、patient_details原必填资料、allergy_declaration全部已知过敏和本次确认齐全；提交复核全部必需资质、执业、NORMAL、时隙对齐及占位。预约责任牙医取班次。前台核实代办与患者当前绑定分别验证。PatientView提供服务器生成的过敏确认引用；提交资料与受保护档案冲突时转前台，不用自助声明覆盖。 |
| Attend / Cancel / NoShow | SCHEDULED且按各场景身份/班次/时点核验。患者开始前NORMAL可自助；开始后至时隙结束前由前台核实；结束后未到诊才NO_SHOW；挂起转S5。分类和迁移由操作确定，不接受任意status。 |
| Reschedule | 挂起班次旧约，患者意向已核实。改约需全部new_*，旧CLINIC_RESCHEDULE/新SCHEDULED、同患者无环且唯一直接后继，失败全回滚；CLINIC_CANCEL分支不接收新安排，不混入患者取消率。 |
| TreatmentRecord / Complete | 只收项目、正单位数、实施时间；实际牙医来自可信账号且治疗日资质/执业有效。目录价冻结、逐项HALF_UP；只在进行中增加，至少一项有效真实诊疗才能完成，免费检查/咨询可以计入，未实施不登记。 |
| ClinicalNotes / PriceCorrection | 临床备注仅进行中；价格纠错仅开票前且另获price.correct能力，保存原因/核实依据及旧新值审计。该能力不因普通牙医或收费角色自动获得。 |
| Invoice | COMPLETED且有效治疗，逐项同就诊归属、历史价/实施者完整；唯一开票、逐项快照、小计之和等于总价、原子事件及状态，重试原单。开票后治疗/明细只读，不要求付款成功。 |
| Patient / Allergy | 原建档必填、邮箱可空、电话不唯一；NOT_REVIEWED/NO_KNOWN/RECORDED含义不变，空关联不推无过敏。更正/撤销追加旧新值、原因、核实人/时间，前台不改共享目录。 |
| 资源 / 资质 / 执业 | 编码唯一、日期有效、资质已核验。缩短区间列出未来影响；目录停用保留历史、调价仅未来治疗。被引用班次不能借资源PATCH改归属或时段；多个写入口遵守稳定父锁。 |
| CostCreate / Reverse | 来源唯一、核验主体及确认时间由服务端取得；医疗用品归实施牙医，关联一致；零额明确已确认范围。冲销请求必须提供经核验的incurred_at、新source_reference/source_batch、verification_reference和原因，不能静默沿用原发生时点或服务器当前时间。金额/类型/归属由原正额生成同归属、等额负值、唯一原引用，不能覆盖原凭证；按冲销自身已核验发生时点归季。 |
| QuarterPreparation / Calculate | 自然季度结束，系统生成人员范围及所需收入/成本/任职/有效分钟。客户端clinic_ids/preparation_ids不能删减应纳人员或来源；缺失保留INCOMPLETE并禁止发布。原source_snapshot保存封账/零成本/人员/分摊证据，DRAFT准备和计算不另建业务表。 |
| PublishInput | 单独发布权限、expected_input_hash及复核依据对应原版本，稳定Dentist锁内复核资料/守恒/金额/R1，原子旧SUPERSEDED/新PUBLISHED。完整零激励可发布，不能以计算成功代替复核。 |

核实引用必须对应同主体、对象、范围的服务端可查证据；SF02待核验申请不要求事先已有批准引用，前台实际核验批准时原子生成依据，详见identity.md，不是一个随意字符串或客户端“已核实=true”。证据由身份核验BindingRequest/BindingEvent、可信审计及原source_snapshot承载，不新增核实、封账或分摊业务表。全部诊所季度来源按原范围完整，客户端筛选只在授权边界内表达请求，不能把部分结果包装为个人完整季度绩效。

## 分析结果

所有结果带期间、cutoff、rule_version、来源、样本/排除/缺失/未处理数量、provisional和不可计算原因。rows只返回所选指标的下列业务投影。比例以十进制字符串表达无量纲比值，例如0.20由客户端格式化为20%，不能客户端重新从不完整队列计算。

cutoff必须对应服务器可支持的一致来源快照或已保存冻结版本；若不能重建该历史截止所需状态/证据，返回SOURCE_SNAPSHOT_UNAVAILABLE或明确来源不足，不以当前值冒充。季度input_hash对规则版本、cutoff、全人员及来源/金额/有效分钟/封账证据作规范化摘要，稳定排序并按字典精度编码；不能只摘要客户端表单或省略负额冲销。工作日日历作为有来源/版本的配置，评价时保留所用版本。

| metric | 分项字段及原口径 |
| --- | --- |
| cancellations | clinic_id、已结束队列数、PATIENT_CANCEL数、NO_SHOW数、未处理数、两项率及合计未履约率；剔CLINIC_*，有未处理则暂定。 |
| treatment-comparison | clinic_id、treatment_id、单位定义引用、次数、standard_units合计、subtotal合计、加权单价；按performed_at，不能混单位或简单平均条目单价。 |
| skill-slot-coverage | clinic_id、treatment_id、全部必需资质/执业有效的NORMAL时隙数、NORMAL总时隙及比率；不是空闲比例。 |
| skill-structure | 牙医/有效资质汇总，按所选范围期间；历史或非必需资质不冒充选定治疗的合格供给。 |
| performance | dentist_id、quarter_start/end、当前PUBLISHED版本、个人收入/成本/净利润/激励；未发布或旧口径单列，不混合比较。 |
| coverage | 期间营业诊所数、统一资料使用诊所数、比率及来源。 |
| traceability | 有效治疗数、七项齐全数、缺项统计及比率；缺一要素不计分子。 |
| calculation-time | 资料齐备/全部可发布结果发布时点、工作日耗时，资料等待另列；周一至周五且法定节假日除外。 |

分母零返回value=null并说明原因；来源不足不补零。默认分析不返回原始source_snapshot或患者临床全文，来源读取另授敏感下钻能力并先保存读取审计。契约包括受控演示缴费及全额演示退款，不扣真实款；未接入真实微信支付回调、实收登记、渠道对账或税费/折扣，也不提供普通员工查全链资料入口。

## 设计核验边界

本目录定义接口行为，实际实现及运行结果以对应任务和验收证据为准。OpenAPI结构可解析不能证明业务通过；实现须按operationId及完整AC覆盖正常/失败/越权/并发/重试，真实MySQL验证锁、唯一及原子性；微信真实链路、Q03负载和Q05恢复均须指定环境及独立执行证据。原业务数据库24/209/44边界不会因接口数量而改变。

## 已有档案关联与人工核验输入

已有档案关联申请输入patient_number/date_of_birth/clinic_id；clinic_id为待办服务点，不授权限。首次本人登记使用独立的SelfPatientRegistration输入，由系统新建档案并自动关联。
BindingApproval输入patient_id、verification_basis和reason，路径requestId须指向PENDING申请；
服务端验证原资料和授权前台，再原子保存核验结论及绑定，成功申请ID才成为verification_reference。
verification_basis明确clinic_id及service_basis实际服务说明；前者须在前台当前范围内，
批准/重绑时须匹配申请服务点。服务上下文标识、核验人和时点由服务端保存，不循环要求未生成凭据。
Rebind另需新主体的binding_request_id；BindingRevocation直接保存本次人工核验依据和原因，
不依赖未建立的新申请。本人核验确认由授权前台作出，后端核对真实原资料，
不能将患者提交的“已确认=true”当作身份证据。

表与键见[独立技术模型](../technical-data-model.md)；原业务ERD不改动，
控制与迁移元数据分别落adc_identity.RequestReceipt、adc_identity.flyway_schema_history。

## 物理 Schema

当前有效方案仅为 adc_business（原24张业务表）、adc_identity（13张技术表，含 RequestReceipt、flyway_schema_history）、adc_audit（AuditEvent 1张表）。回执落 adc_identity.RequestReceipt，Flyway历史落 adc_identity.flyway_schema_history；技术存储不改变既定业务ERD。


## 已有患者安全检索

POST /patients/lookup（lookupPatient）用于授权前台核实既有患者。输入为patient_number、date_of_birth及verification_basis（clinic_id、person_confirmed、service_basis）；必须为当前有getPatient能力且覆盖实际服务点的RECEPTION。核对原Patient编号/出生日期及授权前台人工核验，失败不披露范围外对象；成功返回{patient: PatientView, verification_reference: string}。引用由服务器生成并指向同主体、Patient、实际服务诊所和时点的成功审计，与幂等回执同事务。当前授权及服务端证据缺一不可，不能用任意引用、布尔值、电话或历史角色快照取得档案。该证据供既有患者读取、更正及过敏核验复核，不给Patient增加诊所所有权。

前台PatientCreate必须提供verification_basis：clinic_id、person_confirmed、service_basis；可选duplicate_reviewed（默认false）、review_reason。既有七项资料及PatientView不变。疑似重复须授权前台人工复核留因；同电话可以是不同患者，不自动合并。创建核实、资料、成功审计和回执原子保存；未绑定小程序/尚无预约不阻止合法前台服务。核验存于既有AuditEvent/RequestReceipt，不增加表或字段。CSRF、Idempotency-Key、最小披露、当前诊所授权和原键重试规则全部适用。


## 组织资源响应

组织资源沿当前接口及路径维护。AssignmentEntry可选assignment_id定位要维护的原执业记录；省略新建，不以没有唯一约束的组合推定覆盖。DentistView包含当前资源管理所需qualifications及clinic_assignments，TreatmentView包含qualification_requirements；字段与空值按原关联字典，读取范围不扩大，历史保留。

ClinicView/DentistView/QualificationView/TreatmentView的可选future_impact仅返回当前授权范围内的必要对象引用（object_kind、object_id、clinic_id、可选affected_date、reason），用于既定调整后的未来影响提示；不能据此自动停诊/取消/改约或改为一律拒绝调整。主体和范围仍实时校验，不披露无权对象或临床内容。

总部POST /allergies及GET/PATCH /allergies/{resourceId}使用AllergyResourceView，只含原Allergy目录的allergy_id/allergy_name/description/is_active。患者过敏AllergyView及UC05接口不变，不为目录伪造is_retracted。

## 预约患者资料输入

AppointmentCreate.patient_details使用AppointmentPatientDetails，保留原七项资料及六项必填。前台POST /patients使用PatientCreate及verification_basis；首次本人登记使用SelfPatientRegistration。当前本人关联、前台代办核验引用和过敏、资质、执业、占位守卫按各自分支校验，83个操作共享相同事务、回执和审计规则。

## 患者费用与收费预约

首次登记保留姓名、生日、电话和过敏声明，地址及紧急联系人可空。医生患者投影只提供职称、主要方向、简介和姓名，不返回私人资料。入口“看牙检查／洗牙洁牙”映射实际启用的治疗项目。

收费预约先校验并保留真实号源五分钟（最迟至开诊前）；PENDING账单不等于预约。统一医生/排班锁校验Appointment和未过期BookingHold占用，直接createAppointment不得绕过非零挂号费。金额由后台策略冻结为整数分；付款原子生成PaymentOrder、正式Appointment及BOOK事件、审计和回执。重复请求或不同键并发仅一次成功；过期、停诊或资质改变关闭保留而不生成预约/爽约。取消已付挂号预约时同事务全额演示退款，停诊改约退款后重新预约。

Invoice/InvoiceItem只对应实际完成的治疗，生成独立TREATMENT账单；开票不等于已付款。演示支付仅ADC_DEMO_PAYMENTS_ENABLED及明确诊所白名单启用；始终显示“演示支付，不扣真实款”，不调用微信扣款、不计入实际收款或R1。挂号费策略使用resource.read/write；账单读取billing.read、演示收款/关闭billing.pay、退款billing.refund按CASHIER/HEADQUARTERS当前诊所授权，患者仅当前关联本人。退款不改变已冻结Invoice和R1；真实商户支付未实现。

| 409 | REGISTRATION_PAYMENT_REQUIRED / FREE_BOOKING_REQUIRED / DEMO_PAYMENT_DISABLED / PAID_BILL_REQUIRED / PAID_BILL_CANNOT_CLOSE / TREATMENT_BILL_CANNOT_CLOSE / CANCEL_APPOINTMENT_FIRST / DEMO_PAYMENT_REQUIRED | 费用或当前状态不允许该操作 |
| 422 | INVALID_AMOUNT | 金额必须为范围内整数分 |
