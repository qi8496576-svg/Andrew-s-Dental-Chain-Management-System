# ADC 任务级需求与验收追踪

日期：2026-11-07。衔接 [原需求/模型追踪](traceability.md) → [获批设计](plan.md) → [任务清单](tasks.md)。本文件是新增任务层，不改写批准的设计追踪。编号均来自原 Spec；任务表示计划实现/验证，非已通过结果。

## FR 与成功指标

| 需求 | 任务 |
| --- | --- |
| FR-001 | T087, T088, T089, T090, T091, T092, T093 |
| FR-002 | T094, T095, T096, T097, T098, T099, T100 |
| FR-003 | T101, T102, T103, T104, T105, T106, T107 |
| FR-004 | T108, T109, T110, T111, T112, T113, T114 |
| FR-005 | T115, T116, T117, T118, T119, T120, T121 |
| FR-006 | T080, T081, T082, T083, T084, T085, T086 |
| FR-007 | T122, T123, T124, T125, T126, T127, T128 |
| FR-008 | T129, T130, T131, T132, T133, T134, T135 |
| FR-009 | T136, T137, T138, T139, T140, T141, T142 |
| FR-010 | T143, T144, T145, T146, T147, T148, T149, T150, T151, T152 |
| FR-011 | T153, T154, T155, T156, T157, T158, T159, T160, T161, T162, T163, T164 |
| FR-012 | T165, T166, T167, T168, T169, T170, T171 |
| FR-013 | T051, T052, T053, T054, T055, T056, T057 |
| FR-014 | T073, T074, T075, T076, T077, T078, T079 |
| FR-015 | T058, T059, T060, T061, T062, T063, T064, T065 |
| FR-016 | T066, T067, T068, T069, T070, T071, T072 |
| FR-017 | T172 |
| FR-018 | T045, T049, T173 |
| FR-019 | T046, T048, T049, T174 |
| FR-020 | T008, T043 |
| FR-021 | T172 |
| FR-022 | T044 |
| FR-023 | T155, T156, T157, T158, T159, T160 |
| FR-024 | T167 |
| FR-025 | T172 |
| Q01 | T176, T184 |
| Q02 | T177, T184 |
| Q03 | T178, T179, T180, T184 |
| Q04 | T174, T184 |
| Q05 | T178, T181, T182, T184 |
| Q06 | T173, T178, T184 |
| Q07 | T173, T184 |
| Q08 | T047, T173, T183, T184 |
| Q09 | T177, T184 |
| SC-001 | T185 |
| SC-002 | T186 |
| SC-003 | T176 |
| SC-004 | T180 |
| SC-005 | T174 |
| SC-006 | T164 |
| SC-007 | T173 |
| SC-008 | T182 |
| SC-009 | T177 |

## 验收场景：原 Given / When / Then → 验证任务

完整逐字场景继承 Spec；此处不新增或改写业务条件。合同测试/集成/故事 E2E 分层验证；真实微信及上线季度额外门槛见关联任务。

| 原 AC | Given（原文） | When（原文） | Then（原文） | 负责验证的任务 |
| --- | --- | --- | --- | --- |
| AC-G01 | 五个就诊状态及其事实样本，含非法跳转、取消后恢复、无项目完成、已到诊取消 | 逐项提交合法及非法业务事件 | 只允许状态表的迁移；非法请求无变更；事实时点和事件旧新状态一致；没有 NO_SHOW 第六状态。 | T172 |
| AC-G02 | 患者甲/乙、不同诊所前台、牙医、收费、分权总部账号及合法授权对照组 | 绕过页面直接请求本人外/范围外对象、无关字段或冒用客户端身份 | 越权全部拒绝、无敏感泄露/业务变更；合法对照按权限成功且只返回所需字段。 | T049, T173 |
| AC-G03 | 创建、到诊/取消、改约、开票及发布的多步保存，含规定写操作审计 | 分别注入中断并以原键查询或重试 | 无部分业务提交；审计未持久化不能报告规定写操作完成；原键不重复造业务事实，错误能区分缺项、无权、冲突与提交失败。 | T046, T048, T049, T174 |
| AC-G04 | 最终 D3—D21、D22—D24 与正式 ERD 为比较基线 | 评审后续数据定义及业务约束验证结果 | 19 表/163 字段/30 外键、15 单列代理主键及 4 复合关联主键、类型精度可空与唯一逐项对应；条件唯一仍有条件，跨表归属校验保留，身份存储独立，没有虚构业务外键。 | T008, T043, T050 |
| AC-G05 | 被引用目录、班次、过敏更正、治疗价、开票、成本、事件及已发布绩效均存在 | 调价、停用、改约、成本纠错或发布新版后回查 | 原记录及核实/来源链完整可查，不覆盖历史金额、关联或版本；普通账号不能改删审计。 | T172 |
| AC-G06 | Asia/Shanghai 季度起点、终点前及终点恰好发生的开票/成本样本 | 转换存储时间点并按业务日及季度取数 | 时间点统一转 UTC，业务边界仍按 Asia/Shanghai，起点纳入、终点不纳入；相邻季度无漏记或双计。 | T044 |
| AC-G07 | 单位数、单价、个人金额及分摊输入具有字典规定精度，包括半分舍入样本 | 计算、保存并往返传输后核对 | 精确十进制，逐项四舍五入到分后累加；单位数/单价/比率保持原精度，无二进制浮点近似导致的金额漂移。 | T044 |
| AC-G08 | 本规约、后续功能目录及数据设计可供评审 | 对照原 UC/SF 定义及费用凭据边界审查 | 只有八项主用例和既有五场景；不将 INVOICED 映射为付款状态，不新增实际支付、支付渠道、收退款、税费/折扣或相关业务表。 | T172 |
| AC-Q01 | 患者、前台、牙医各 3 名测试人员，经 30 分钟任务说明；预约测试已登录且本人绑定完成 | 每人完成 2 组指定预约/治疗任务，记录业务操作次数、结果及误操作 | 全部任务成功，预约≤4 次、保存一项治疗≤3 次；提交与确认各一次，纯浏览及逐字段输入不单计；失败能定位输入或业务冲突。 | T176 |
| AC-Q02 | 总部有资源权限、前台有排班权限，历史记录存在 | 总部经 UC06 各新增 1 项诊所、治疗、过敏及资质目录，前台经 UC02 新增合法班次，再筛选和录入 | 配置可用、历史价格与被引用记录不变；新增核算公式按规则变更评审，不能视为普通配置。 | T177 |
| AC-Q03 | 30 诊所、100 牙医、1 万患者、10 万预约、20 万治疗；应用及数据库各 4 核 8GB，同网络往返≤20 毫秒 | 100 并发持续完整 20 分钟，候选检索/治疗保存/结算请求比例 60%/20%/20%，保存原始结果 | 各类请求分别 P95≤3 秒，非预期服务错误率<1%，业务拒绝不计该错误率；低于基准的环境另列差异，不能宣称通过。 | T180 |
| AC-Q04 | 同一时隙并发争用、同一就诊重复结算、保存故障注入样本 | 并发/重复提交，在各保存步骤中断并按原请求键重试 | 每组争用至多一个有效占位，同次就诊至多一张单，无部分记录；状态、明细和事件一致。 | T046, T048, T174 |
| AC-Q05 | 业务、身份、绑定、授权及审计均纳入备份，具备隔离恢复环境 | 检查每天全量、每 15 分钟增量及 30 天保留，执行恢复演练 | RPO≤15 分钟、RTO≤4 小时；数量、关键金额、患者绑定及权限引用一致，保留实际丢失跨度和恢复耗时证据。 | T182 |
| AC-Q06 | 可用会话、无效凭据及停用/撤权对照样本 | 分别测试空闲满 30 分钟、会话建立满 8 小时、连续第 5 次认证失败、退出/停用/撤权后下一次请求，以及认证秘密日志检查 | 任一会话时限达到即失效，连续 5 次失败限制 15 分钟；注销/停用/撤权后下一请求拒绝；无效凭据不访问受保护业务，加密通道传输，日志无认证秘密。 | T173, T175 |
| AC-Q07 | 患者甲/乙、诊所 A/B 前台、收费及总部权限样本，含合法对照 | 直接调用业务请求测试甲读乙、A 操作未授权诊所、收费查无关临床、无授权敏感下钻及合法访问 | 越权请求全部拒绝，无敏感数据泄露及业务变更；合法样本按角色/诊所/本人范围通过、字段最小披露。 | T173 |
| AC-Q08 | 资料更正、绑定/授权、取消、敏感查询、成本冲销、绩效发布样本及普通/审计权限账号 | 逐项操作并检查审计，普通账号尝试改删日志，核对保留和访问策略 | 记录可信主体、对象、范围、时间、请求键、结果及原因；规定操作均可追溯；普通账号不能改删，审计保留 1 年，仅有审计权限的总部可查，无认证秘密和无关完整临床资料。 | T047, T173 |
| AC-Q09 | 新诊所基本资料齐备，授权总部人员可办理，存在相关回归样本 | 从接收资料开始计时直至配置可用于排班及预约；发生规则变更时检查集中维护及回归 | 新诊所可用≤1 个工作日；历史价格、预约冲突、个人提成、版本发布回归全部通过，记录耗时及改动范围。 | T177 |
| AC-SC-01 | 上线首个资料齐备的完整季度，所有诊所封账、零成本/归属和有效排班依据齐备，工作日历已核对 | 记录齐备时点至本轮所有可发布结果复核发布的时点，同时单列资料等待 | 业务工作日耗时≤1；结果保持完整、可追溯及 R1 正确，不能用跳过复核换取时效。 | T185 |
| AC-SC-02 | 同季度营业诊所、接入使用记录及有效治疗明细齐备 | 计算覆盖率及七项要素可追溯率并逐条核对 | 两项均为 100%；缺项列出且不伪充完整，不能仅据页面可打开认定通过。 | T186 |
| AC-SF01-01 | 可用患者或员工身份 | 成功登录再退出 | 可取得可信主体，退出后下一次受保护请求被拒绝；患者登录本身不等于已绑定档案。 | T051, T052, T057, T175 |
| AC-SF01-02 | 无效、过期、停用凭据或身份组件无法验证 | 直接请求受保护业务 | 拒绝且不泄露敏感资料、不改变业务；Q06 的超时及失败限制同样适用。 | T051, T052, T057 |
| AC-SF02-01 | 已登录患者，授权前台完成本人及档案核验，主体与档案均无其他有效绑定 | 批准绑定；以多个不同主体并发申请同一档案及同一主体申请不同档案作为冲突对照 | 身份存储保存可信映射和核验证据；每个主体和每个档案同时至多一个有效绑定，冲突请求不覆盖或生成第二个有效绑定；只允许本人范围操作，不更改 19 表结构。 | T073, T074, T079, T175 |
| AC-SF02-02 | 分别存在仅同姓名/电话、身份不能确认、已有绑定冲突、客户端伪报 patient_id，以及经前台核验的本人换号重绑样本 | 普通绑定申请或业务请求；另由授权前台核准重绑，再用旧、新主体访问该患者档案 | 未核实或冲突申请不自动绑定/覆盖或取得他人数据；核准重绑后新绑定有效、旧绑定失效且历史可查；旧主体即使持未过期会话，下一次凭旧绑定访问被拒绝，新主体按新有效绑定访问。 | T073, T074, T079, T175 |
| AC-SF03-01 | 总部有账号管理权限并核实工作人员 | 创建/关联、启停、恢复账号或调整离职访问资格 | 身份组件保留账号及操作结果；不自动授予业务权限，不为非牙医写入 Dentist。 | T058, T059, T065 |
| AC-SF03-02 | 只有员工资料或普通总部权限；另有已停用账号 | 分别请求账号管理或停用后访问 | 管理越权拒绝；停用后下一次受保护请求拒绝，业务及历史核算记录保留。 | T058, T059, T065 |
| AC-SF04-01 | 操作者可授予诊所 A 的指定角色，资料及有效期合法 | 配置员工权限并执行 A 的合法业务 | 授权及变更留痕，允许符合岗位/对象范围的请求；不因此取得 B 权限。 | T066, T067, T072 |
| AC-SF04-02 | 请求超可授予范围，或前端伪报角色/诊所，或授权已撤销/过期 | 授权或直接调用受保护业务 | 拒绝；撤权后下一次请求立即拒绝，无敏感披露及业务变更。 | T066, T067, T072 |
| AC-UC01-S1-01 | 患者已核验绑定，资料及过敏确认完整，所选班次正常且空闲，牙医全部必需资质已核验并当日有效、执业有效 | 患者选定时隙提交预约 | 生成一个 SCHEDULED 预约、期望治疗和 BOOK 事件，返回可核对的预约信息。 | T087, T088, T093 |
| AC-UC01-S1-02 | 授权前台已核实新患者，必填资料齐全 | 前台代建档并提交合法预约 | 形成可关联患者的预约；新患者以后自助仍须经 SF02 绑定，不因代约自动绑定。 | T087, T088, T093 |
| AC-UC01-S1-03 | 必需资质任一缺失、未核验或过期，或执业无效、班次挂起、时隙不空闲 | 查询候选；或检索后条件变更再提交 | 不将不合格时隙作为可约结果；提交复核失败时不保存预约、关联或事件。非必需资质缺失不作为必需资质失败。 | T087, T088, T093 |
| AC-UC01-S1-04 | 无候选、用户放弃、必填资料缺失、过敏资料未确认或自助资料与受保护档案冲突，分别构造样本 | 执行检索或提交 | 无候选/放弃不占位；缺项提示；冲突交前台核实，不自动覆盖已有资料或生成部分预约。 | T087, T088, T093 |
| AC-UC01-S1-05 | 多个不同请求争用同一时隙 | 并发提交 | 最多一个有效占位；其余收到业务冲突，失败请求不留下部分记录。 | T087, T088, T093 |
| AC-UC01-S1-06 | 可信主体的同一请求标识已经成功或响应超时未知 | 用相同内容重试，再以同键提交不同内容 | 相同内容返回同一预约且 BOOK 不重复；不同内容拒绝覆盖，不能以新建记录解释重试。 | T087, T088, T093 |
| AC-UC01-S2-01 | 前置条件全部成立 | 授权前台确认到诊 | SCHEDULED→IN_PROGRESS，到诊时点非空，ATTEND 的旧新状态正确。 | T094, T095, T100 |
| AC-UC01-S2-02 | 身份不符、班次 SUSPENDED、预约 CANCELLED 或非 SCHEDULED，分别构造样本 | 提交到诊 | 拒绝且不改变事实、状态或事件。 | T094, T095, T100 |
| AC-UC01-S2-03 | 同一到诊请求已成功 | 原键重试 | 返回既有结果，不重复到诊或追加相同事件。 | T094, T095, T100 |
| AC-UC01-S3-01 | 本人已绑定，SCHEDULED 且班次正常，当前早于预约开始 | 患者提交原因及请求标识取消 | 保存 PATIENT_CANCEL、取消时点和 CANCEL，释放占位，旧预约可追查且不可恢复。 | T101, T102, T107 |
| AC-UC01-S3-02 | 时间恰为预约开始或已开始但时隙尚未结束，患者未到诊 | 患者自助取消；随后授权前台核实代办 | 自助拒绝并提示联系前台；前台核实且仍为 SCHEDULED 时可登记 PATIENT_CANCEL。 | T101, T102, T107 |
| AC-UC01-S3-03 | 时隙已结束或班次挂起，分别构造样本 | 请求患者取消 | 分别转 S4 核实爽约或 S5 停诊处理，不写 PATIENT_CANCEL 混淆分类。 | T101, T102, T107 |
| AC-UC01-S3-04 | 状态为 IN_PROGRESS、COMPLETED、INVOICED，或时点/身份无法核实 | 提交取消 | 拒绝且不改变记录；同一成功取消请求的重试仅返回原结果。 | T101, T102, T107 |
| AC-UC01-S4-01 | 时隙已结束、仍 SCHEDULED，授权前台核实未到诊 | 提交爽约 | 保存 NO_SHOW、取消时点、核实人、原因及 CANCEL，释放占位；不产生第六种就诊状态。 | T108, T109, T114 |
| AC-UC01-S4-02 | 时隙未结束，或只有定时扫描而无前台核实 | 请求登记爽约 | 不登记 NO_SHOW，保留原业务事实。 | T108, T109, T114 |
| AC-UC01-S4-03 | 爽约与确认到诊并发，到诊已先提交 | 前台提交爽约 | 拒绝覆盖 IN_PROGRESS，保留 ATTEND，不追加相冲突 CANCEL；同键重复爽约不重复迁移。 | T108, T109, T114 |
| AC-UC01-S5-01 | 前置满足，新的正常时隙满足全部预约条件 | 前台确认改约 | 旧预约 CLINIC_RESCHEDULE，新预约同患者且 rescheduled_from_id 指旧记录，新旧事件齐备，旧对象不恢复。 | T115, T116, T121 |
| AC-UC01-S5-02 | 无合适新时隙；另有患者确认不再安排，分别构造样本 | 前台处理 | 前者保留原预约待处理且不占新位；后者登记 CLINIC_CANCEL 并保存原因和事件，不计患者取消或爽约。 | T115, T116, T121 |
| AC-UC01-S5-03 | 新位已被占用或在旧取消、新建立、关联、事件任一步注入保存故障 | 提交改约 | 全部回滚，旧预约仍保持原待处理状态，无孤立新预约或单边事件。 | T115, T116, T121 |
| AC-UC01-S5-04 | 已有直接后继，或请求跨患者/形成环 | 重复或冲突提交 | 已处理请求返回原结果；跨患者、环和第二个直接后继被拒绝。 | T115, T116, T121 |
| AC-UC02-01 | 授权及执业有效，09:00—10:00，时隙 20 分钟，无重叠 | 保存班次 | 成为 NORMAL，可划分为 09:00、09:20、09:40 起始的三个完整时隙；10:00 不作为该班次起点，能否预约仍按 S1 校验。 | T080, T081, T086 |
| AC-UC02-02 | 同牙医在另一诊所有 NORMAL 重叠班次，或时隙为零/不能整除/开始不早于结束 | 保存，包括并发跨诊所保存 | 冲突或非法记录拒绝；相邻半开区间可通过，SUSPENDED 历史不参加正常班次唯一及重叠检查。 | T080, T081, T086 |
| AC-UC02-03 | 旧班次已被预约引用 | 请求覆盖其归属/日期/时段/粒度，再办理停诊 | 覆盖拒绝；挂起保留历史和全部预约，列出 SCHEDULED 待 S5 处理，不自动取消进行中的就诊。 | T080, T081, T086 |
| AC-UC03-01 | 已到诊且有权限，实际实施牙医具备治疗日有效资质和执业，目录单价 10.01 | 记录 1.50 单位并完成 | 保存本人实施者、实施时间、历史价和小计 15.02；存在有效项目后保存 completed_at、COMPLETE，状态 COMPLETED。 | T122, T123, T128 |
| AC-UC03-02 | SCHEDULED、CANCELLED、COMPLETED、INVOICED；另有无效资质、停用项目、零/负单位数，分别构造样本 | 请求增加治疗 | 全部不合格请求被拒绝，无非法治疗或状态变化。 | T122, T123, T128 |
| AC-UC03-03 | IN_PROGRESS 暂无实际项目；另有实际免费咨询一项，单位数大于零 | 分别请求完成 | 无项目者保持进行中；免费咨询按合法目录零价保存后可完成，不虚构未实施治疗。 | T122, T123, T128 |
| AC-UC03-04 | 实施牙医乙不同于预约牙医甲，但乙获授权且具备有效资质/执业 | 乙记录本人治疗，目录随后调价 | 治疗保存乙及当时历史价，后续开票收入归乙；旧价格不随目录变化。 | T122, T123, T128 |
| AC-UC03-05 | 牙医试图自行覆盖单价；另有开票前经授权核实的价格纠错 | 分别提交 | 自行覆盖拒绝；授权纠错保留依据及审计，开票后治疗及明细只读。 | T122, T123, T128 |
| AC-UC04-01 | 已完成且两项有效治疗分别为 1.50×10.01、1.00×0.00 | 授权收费人员结算 | 明细分别 15.02、0.00，总价 15.02，每项一行，单号唯一，issued_at 和 INVOICE 齐备；INVOICED 不显示为已付款。 | T129, T130, T135 |
| AC-UC04-02 | 同一就诊已有单据或多个请求并发结算 | 重复提交 | 全部成功响应引用同一原单及原明细，每项实际治疗至多被开票一次。 | T129, T130, T135 |
| AC-UC04-03 | 未完成、无有效项目、跨就诊治疗或历史价/实施者缺失，分别构造样本 | 结算 | 拒绝且无单据、明细或状态部分提交。 | T129, T130, T135 |
| AC-UC04-04 | 在单据、任一明细、状态或事件写入时注入故障 | 结算后以原键重试 | 故障回滚全部变更；重试最多产生一个完整单据，历史价不改取目录现价。 | T129, T130, T135 |
| AC-UC04-05 | 单据已经生成 | 查询结果、尝试追加治疗或修改开票快照 | 返回原费用事实且写入被拒绝；不要求支付成功，不生成收款、渠道、税费、折扣或退款事实。 | T129, T130, T135 |
| AC-UC05-01 | 身份已核实，姓名、出生日期、电话、账单地址及紧急联系人姓名/电话完整，邮箱缺省 | 授权前台建档或更正 | 可保存并返回患者编号；任一必填缺失则逐项提示且不保存不完整建档。 | T136, T137, T142 |
| AC-UC05-02 | 两个患者电话相同或疑似重复 | 检索/录入资料 | 不自动合并或据电话取得他人档案，转人工核实；跨诊所读取需授权服务依据。 | T136, T137, T142 |
| AC-UC05-03 | 过敏情况未核实、经询问无已知过敏、存在有效过敏项，分别构造样本 | 保存对应确认结果 | 分别表达 NOT_REVIEWED、NO_KNOWN、RECORDED；RECORDED 有有效关联，空关联不自动表示无过敏。 | T136, T137, T142 |
| AC-UC05-04 | 已有过敏记录 | 前台更正程度或撤销误记 | 保留旧值、新值、核实人、原因、时间及历史关联；当前误记可撤销，历史证据可查。 | T136, T137, T142 |
| AC-UC06-01 | 总部获资源权限，编码唯一、日期有效、资质已核验 | 配置诊所、牙医、执业、资质、治疗要求和过敏目录 | 新配置可供排班、筛选及录入；必需与非必需资质含义保持。 | T143, T144, T152 |
| AC-UC06-02 | 编码重复、任职结束早于入职、资质到期早于授予或未核验，分别构造样本 | 保存或用于匹配 | 非法记录拒绝；未核验资质不得满足匹配，未经核实的空到期日不视作永久有效。 | T143, T144, T152 |
| AC-UC06-03 | 项目有历史引用且已有历史治疗/开票 | 调价或停用项目 | 新治疗用新价，既有治疗与凭据不重算，被引用目录及证据不删除。 | T143, T144, T152 |
| AC-UC06-04 | 有未来预约依赖某资质或执业区间 | 缩短有效期 | 列明受影响未来安排及后续处理需求，不静默修改旧预约、班次归属或诊疗事实。 | T143, T144, T152 |
| AC-UC07-01 | 个人当季开票收入 1000.00、医疗用品成本 100.00、直接及分摊运营费用合计 200.00，资料完整 | 计算并经授权独立复核发布 | 净利润 700.00，R1 激励 70.00，率 0.1000，来源/截止/名单/份额/版本可查。 | T153, T154, T159, T164 |
| AC-UC07-02 | 在职无收入、当季离职，以及此前离职但当季仍有开票收入或成本归属的牙医 | 生成核算名单 | 全部纳入；离职日计入任职区间，停用账号不删除核算资格或历史。 | T153, T154, T157, T158, T164 |
| AC-UC07-03 | 治疗在季度内但开票在下一季度；另有一单多名实际实施者和跨季成本发生时间样本 | 核算相邻自然季度 | 收入仅按 issued_at 归季且逐项归实施者，成本按 incurred_at 归季，期末边界记录进入下一季，无双计。 | T153, T154, T158, T164 |
| AC-UC07-04 | 同诊所同季公共运营费用 100.01，牙医 1、2 的有效 NORMAL 分钟相等，另有 SUSPENDED 时长 | 分摊 | 停诊时长排除；先各截 50.00，余分按同余 dentist_id 升序给牙医 1，得到 50.01/50.00，总和 100.01；负净额按同法恢复负号。 | T153, T154, T159, T164 |
| AC-UC07-05 | 分别缺少封账、零成本范围确认、直接医疗用品牙医归属，或待分摊净额非零但有效总分钟为零 | 计算并请求发布 | 保存 INCOMPLETE 和具体原因，未确定金额可为空，所有样本禁止发布，不把缺失补零。 | T153, T154, T157, T159, T164 |
| AC-UC07-06 | 资料完整，个人净利润分别为 0 和 -100.00 | 计算并复核发布 | 激励均为 0.00，允许合规发布，不出现负激励或跨季扣减。 | T153, T154, T159, T164 |
| AC-UC07-07 | 同输入摘要已计算；后修正来源形成新输入且旧版本已发布 | 重试、重算并发布新版，包括并发首次发布/替换 | 同输入复用原版本；新输入保留新旧依据；任何时点每人每季至多一个 PUBLISHED，旧版 SUPERSEDED，切换失败不出现半完成发布。 | T153, T154, T160, T164 |
| AC-UC07-08 | 已确认正成本凭证 100.00 且同归属/类型，source_reference 已存在 | 纠错、重复导入或再次冲销 | 重复来源不重复计成本；纠错须唯一引用原凭证、等额 -100.00 冲销后补正确记录；原凭证保留，跨归属或重复冲销拒绝，净额不重复分摊。 | T153, T154, T156, T164 |
| AC-UC07-09 | 来源明细汇总与个人收入合计不一致，或分摊未守恒，或只有计算权限 | 请求发布 | 拒绝发布并保留原版本/差异；计算不能绕过独立复核及发布权限。 | T153, T154, T160, T164 |
| AC-UC08-01 | 指定应诊期间及截止时点有 12 个已结束时隙预约，含 1 个 CLINIC_CANCEL、1 个 CLINIC_RESCHEDULE；余 10 个中 2 个 PATIENT_CANCEL、1 个 NO_SHOW、1 个仍 SCHEDULED | 查询取消指标 | 队列分母 10，主动取消率 20%、爽约率 10%、未履约率 30%；排除数 2、未处理数 1 单列且结果暂定，不把未处理视作到诊。 | T165, T166, T171 |
| AC-UC08-02 | 所选范围分母为 0 或来源缺失 | 查询比例指标 | 返回不可计算及原因，列明缺失数，不返回伪造的 0% 或补零金额。 | T165, T166, T171 |
| AC-UC08-03 | 同治疗同单位，两条有效治疗为 1 单位小计 10.00、3 单位小计 60.00 | 按 performed_at 所在期间比较 | 次数 2、单位数 4、加权单价 17.50；不采用两条单价简单平均，单位定义不同不混合比较。 | T165, T166, T171 |
| AC-UC08-04 | 正常时隙共 10 个，其中资质及执业有效的 6 个已有 4 个被占用 | 查询选定治疗技能时隙覆盖率 | 返回 6/10＝60%，不按未占用比例代替；全部必需资质匹配，非必需资质只展示。 | T165, T166, T171 |
| AC-UC08-05 | 同人同季存在旧发布版、当前 PUBLISHED 及未发布新版 | 查询绩效比较并请求历史或敏感下钻 | 默认仅用当前 PUBLISHED；旧口径或未发布说明状态；历史/敏感查询另校验权限；不修改来源业务。 | T165, T166, T171 |
| AC-UC08-06 | 有期间营业诊所/接入名单及完整、缺项治疗样本 | 查询统一资料覆盖及治疗可追溯指标 | 按表 A1a 分子分母计算，治疗七项追踪要素缺任一项不进分子，缺失和截止时间可核对。 | T165, T166, T171 |

## 全部 HTTP 操作

统一前缀 /api/v1；对照冻结 contracts/openapi.json。UC01 公共读取归 US1；停诊取消归 US5 的 rescheduleAppointment（Reschedule.action=CLINIC_CANCEL），患者取消仍归 US3 的 cancelAppointment。公共请求结果与审计查询归基础阶段。

| 操作 | operationId | 原需求/故事 | 实现任务 | 契约/验证任务 |
| --- | --- | --- | --- | --- |
| GET `/auth/csrf` | initializeWebCsrf | SF01 / US13 | T055 | T051 |
| POST `/auth/wechat-sessions` | createWechatSession | SF01 / US13 | T055 | T051 |
| POST `/auth/staff-sessions` | createStaffSession | SF01 / US13 | T055 | T051 |
| DELETE `/auth/session` | logout | SF01 / US13 | T055 | T051 |
| GET `/me` | getCurrentIdentity | SF01 / US13 | T055 | T051 |
| POST `/me/binding-requests` | requestPatientBinding | SF02 / US14 | T077 | T073 |
| GET `/me/binding` | getPatientBinding | SF02 / US14 | T077 | T073 |
| GET `/binding-requests` | listBindingRequests | SF02 / US14 | T077 | T073 |
| POST `/binding-requests/{requestId}/approve` | approvePatientBinding | SF02 / US14 | T077 | T073 |
| POST `/patient-bindings/{subjectId}/rebind` | rebindPatient | SF02 / US14 | T077 | T073 |
| POST `/patient-bindings/{subjectId}/revoke` | revokePatientBinding | SF02 / US14 | T077 | T073 |
| POST `/identity/staff-accounts` | createStaffAccount | SF03 / US15 | T063 | T058 |
| GET `/identity/staff-accounts` | listStaffAccounts | SF03 / US15 | T063 | T058 |
| POST `/identity/staff-accounts/{subjectId}/activate` | activateStaffAccount | SF03 / US15 | T063 | T058 |
| POST `/identity/staff-accounts/{subjectId}/deactivate` | deactivateStaffAccount | SF03 / US15 | T063 | T058 |
| POST `/identity/staff-accounts/{subjectId}/credential-recovery` | credentialrecoveryStaffAccount | SF03 / US15 | T063 | T058 |
| POST `/identity/grants` | createClinicGrant | SF04 / US16 | T070 | T066 |
| GET `/identity/grants` | listClinicGrants | SF04 / US16 | T070 | T066 |
| POST `/identity/grants/{grantId}/revoke` | revokeClinicGrant | SF04 / US16 | T070 | T066 |
| GET `/requests/{requestKey}` | getRequestResult | FR-019 / Foundation | T049 | T049 |
| GET `/appointment-candidates` | searchAppointmentCandidates | UC01-S1 / US1 | T091 | T087 |
| GET `/appointments` | listAppointments | UC01 / US1 | T091 | T087 |
| POST `/appointments` | createAppointment | UC01-S1 / US1 | T091 | T087 |
| GET `/appointments/{appointmentId}` | getAppointment | UC01 / US1 | T091 | T087 |
| POST `/appointments/{appointmentId}/attend` | attendAppointment | UC01-S2 / US2 | T098 | T094 |
| POST `/appointments/{appointmentId}/cancel` | cancelAppointment | UC01-S3 / US3 | T105 | T101 |
| POST `/appointments/{appointmentId}/no-show` | markNoShow | UC01-S4 / US4 | T112 | T108 |
| POST `/appointments/{appointmentId}/reschedule` | rescheduleAppointment | UC01-S5 / US5 | T119 | T115 |
| POST `/appointments/{appointmentId}/complete` | completeAppointment | UC03 / US7 | T126 | T122 |
| POST `/appointments/{appointmentId}/invoice` | invoiceAppointment | UC04 / US8 | T133 | T129 |
| GET `/schedules` | listSchedules | UC02 / US6 | T084 | T080 |
| POST `/schedules` | createSchedule | UC02 / US6 | T084 | T080 |
| POST `/schedules/{scheduleId}/suspend` | suspendSchedule | UC02 / US6 | T084 | T080 |
| PATCH `/appointments/{appointmentId}/clinical-notes` | updateClinicalNotes | UC03 / US7 | T126 | T122 |
| POST `/appointments/{appointmentId}/applied-treatments` | recordAppliedTreatment | UC03 / US7 | T126 | T122 |
| POST `/applied-treatments/{appliedTreatmentId}/correct-price` | correctTreatmentPrice | UC03 / US7 | T126 | T122 |
| GET `/invoices/{invoiceId}` | getInvoice | UC04 / US8 | T133 | T129 |
| POST `/patients` | createPatient | UC05 / US9 | T140 | T136 |
| GET `/patients/{patientId}` | getPatient | UC05 / US9 | T140 | T136 |
| PATCH `/patients/{patientId}` | updatePatient | UC05 / US9 | T140 | T136 |
| POST `/patients/{patientId}/allergy-reviews` | reviewPatientAllergies | UC05 / US9 | T140 | T136 |
| POST `/patients/{patientId}/allergy-records` | addPatientAllergy | UC05 / US9 | T140 | T136 |
| GET `/patients/{patientId}/allergy-records` | listPatientAllergies | UC05 / US9 | T140 | T136 |
| POST `/patients/{patientId}/allergy-records/{allergyId}/correct` | correctPatientAllergy | UC05 / US9 | T140 | T136 |
| POST `/patients/{patientId}/allergy-records/{allergyId}/retract` | retractPatientAllergy | UC05 / US9 | T140 | T136 |
| GET `/clinics` | listClinic | UC06 / US10 | T150 | T143 |
| POST `/clinics` | createClinic | UC06 / US10 | T150 | T143 |
| GET `/clinics/{resourceId}` | getClinic | UC06 / US10 | T150 | T143 |
| PATCH `/clinics/{resourceId}` | updateClinic | UC06 / US10 | T150 | T143 |
| GET `/dentists` | listDentist | UC06 / US10 | T150 | T143 |
| POST `/dentists` | createDentist | UC06 / US10 | T150 | T143 |
| GET `/dentists/{resourceId}` | getDentist | UC06 / US10 | T150 | T143 |
| PATCH `/dentists/{resourceId}` | updateDentist | UC06 / US10 | T150 | T143 |
| GET `/qualifications` | listQualification | UC06 / US10 | T150 | T143 |
| POST `/qualifications` | createQualification | UC06 / US10 | T150 | T143 |
| GET `/qualifications/{resourceId}` | getQualification | UC06 / US10 | T150 | T143 |
| PATCH `/qualifications/{resourceId}` | updateQualification | UC06 / US10 | T150 | T143 |
| GET `/treatments` | listTreatment | UC06 / US10 | T150 | T143 |
| POST `/treatments` | createTreatment | UC06 / US10 | T150 | T143 |
| GET `/treatments/{resourceId}` | getTreatment | UC06 / US10 | T150 | T143 |
| PATCH `/treatments/{resourceId}` | updateTreatment | UC06 / US10 | T150 | T143 |
| GET `/allergies` | listAllergy | UC06 / US10 | T150 | T143 |
| POST `/allergies` | createAllergy | UC06 / US10 | T150 | T143 |
| GET `/allergies/{resourceId}` | getAllergy | UC06 / US10 | T150 | T143 |
| PATCH `/allergies/{resourceId}` | updateAllergy | UC06 / US10 | T150 | T143 |
| POST `/dentists/{dentistId}/qualifications` | maintainDentistQualification | UC06 / US10 | T150 | T143 |
| POST `/dentists/{dentistId}/clinic-assignments` | maintainDentistAssignment | UC06 / US10 | T150 | T143 |
| PUT `/treatments/{treatmentId}/qualification-requirements` | setTreatmentRequirements | UC06 / US10 | T150 | T143 |
| POST `/cost-entries` | recordCostEntry | UC07 / US11 | T162 | T153 |
| GET `/cost-entries` | listCostEntries | UC07 / US11 | T162 | T153 |
| POST `/cost-entries/{costEntryId}/reverse` | reverseCostEntry | UC07 / US11 | T162 | T153 |
| POST `/performance-preparations` | prepareQuarterPerformance | UC07 / US11 | T162 | T153 |
| POST `/performance-calculations` | calculateQuarterPerformance | UC07 / US11 | T162 | T153 |
| GET `/quarterly-performances` | listQuarterPerformance | UC07 / US11 | T162 | T153 |
| GET `/quarterly-performances/{performanceId}/sources` | getQuarterPerformanceSources | UC07 / US11 | T162 | T153 |
| POST `/quarterly-performances/{performanceId}/publish` | publishQuarterPerformance | UC07 / US11 | T162 | T153 |
| GET `/analytics/{metric}` | getAnalysis | UC08 / US12 | T169 | T165 |
| GET `/audit-events` | searchAuditEvents | Q08 / Foundation | T047 | T047 |
| GET `/appointments/{appointmentId}/clinical-context` | getClinicalContext | UC03 / US7 | T126 | T122 |
| GET `/applied-treatments/{appliedTreatmentId}` | getAppliedTreatment | UC03 / US7 | T126 | T122 |
| GET `/cost-entries/{costEntryId}` | getCostEntry | UC07 / US11 | T162 | T153 |

## 实体及存储边界

| 表 | 建表/映射任务 | 功能归属 |
| --- | --- | --- |
| adc_business.Patient | T010 | US14 SF02；US1 UC01-S1；US9 UC05 |
| adc_business.Allergy | T011 | US9 UC05；US10 UC06 |
| adc_business.PatientAllergy | T012 | US1 UC01-S1；US9 UC05 |
| adc_business.Clinic | T013 | US16 SF04；US14 SF02；US6 UC02；US10 UC06；UC08 只读指标来源 |
| adc_business.Dentist | T014 | US15 SF03；US6 UC02；US10 UC06；UC08 只读指标来源；UC07 冻结来源 |
| adc_business.Qualification | T015 | US10 UC06 |
| adc_business.DentistQualification | T016 | US6 UC02；US7 UC03；US10 UC06 |
| adc_business.DentistClinicAssignment | T017 | US6 UC02；US7 UC03；US10 UC06；UC07 冻结来源 |
| adc_business.DentistSchedule | T018 | US6 UC02；US1 UC01-S1；US2 UC01-S2；US3 UC01-S3；US4 UC01-S4；US5 UC01-S5；UC08 只读指标来源；UC07 冻结来源 |
| adc_business.Treatment | T019 | US7 UC03；US10 UC06 |
| adc_business.TreatmentQualification | T020 | US10 UC06 |
| adc_business.Appointment | T021 | US1 UC01-S1；US2 UC01-S2；US3 UC01-S3；US4 UC01-S4；US5 UC01-S5；US7 UC03；US8 UC04；UC08 只读指标来源 |
| adc_business.AppointmentRequestedTreatment | T022 | US1 UC01-S1；US5 UC01-S5 |
| adc_business.AppliedTreatment | T023 | US7 UC03；US8 UC04；US11 UC07；UC08 只读指标来源；UC07 冻结来源 |
| adc_business.Invoice | T024 | US8 UC04；US11 UC07；UC08 只读指标来源；UC07 冻结来源 |
| adc_business.InvoiceItem | T025 | US8 UC04；US11 UC07；UC08 只读指标来源；UC07 冻结来源 |
| adc_business.CostEntry | T026 | US11 UC07；UC08 只读指标来源 |
| adc_business.QuarterlyPerformance | T027 | US11 UC07；UC08 只读指标来源 |
| adc_business.AppointmentEvent | T028 | US1 UC01-S1；US2 UC01-S2；US3 UC01-S3；US4 UC01-S4；US5 UC01-S5；US7 UC03；US8 UC04 |
| adc_identity.Subject | T029 | 长期可信主体；账号停用保留历史，不以患者/牙医主键代替身份；按技术模型标明 FK / APP 边界 |
| adc_identity.ExternalIdentity | T030 | 真实微信身份到内部主体的映射；OpenID 不是患者本人核验结果；按技术模型标明 FK / APP 边界 |
| adc_identity.StaffAccount | T031 | 独立工作人员账号与密码散列；非牙医员工不写入 Dentist；按技术模型标明 FK / APP 边界 |
| adc_identity.Session | T032 | ADC 自有权威会话；不启用另套框架 JDBC 会话表；按技术模型标明 FK / APP 边界 |
| adc_identity.LoginThrottle | T033 | 原子认证失败计数与限制窗口，包含不存在账号的不可枚举处理；按技术模型标明 FK / APP 边界 |
| adc_identity.BindingRequest | T034 | 人工核验待办及最小申请线索；申请本身不授患者访问权；按技术模型标明 FK / APP 边界 |
| adc_identity.CurrentPatientBinding | T035 | 仅当前有效本人关系；解绑删除当前映射，证据另存；按技术模型标明 FK / APP 边界 |
| adc_identity.BindingEvent | T036 | 追加的绑定/重绑/解绑证据历史；按技术模型标明 FK / APP 边界 |
| adc_identity.AccessGrant | T037 | 工作人员岗位、有效期及撤销事实；能力和范围用实际子表；按技术模型标明 FK / APP 边界 |
| adc_identity.GrantClinicScope | T038 | 授权实际诊所范围；非空清单不以 NULL 或 * 代表隐式全库；按技术模型标明 FK / APP 边界 |
| adc_identity.GrantCapability | T039 | 授权实际操作能力集合；按技术模型标明 FK / APP 边界 |
| adc_identity.RequestReceipt | T040 | 受保护写命令的技术防重和结果引用；原控制组件的实际表；按技术模型标明 FK / APP 边界 |
| adc_identity.flyway_schema_history | T041 | 工具实际迁移历史表；原元数据组件落点；按技术模型标明 FK / APP 边界 |
| adc_audit.AuditEvent | T042 | 可信追加审计，独立权限及至少一年保留边界；按技术模型标明 FK / APP 边界 |

## 后续事项及执行门槛

| 事项 | 当前性质 | 任务 |
| --- | --- | --- |
| C-03 | 必要解析/渲染/语义工具验证，不是业务构想待定 | T007 |
| C-04 | 身份架构已批准；真实配置/首个管理员/联调后续实施 | T062, T175 |
| C-05 | 云资源、性能、备份及隔离恢复后续实施验收 | T178, T179, T180, T181, T182 |
| TD-01 | 非审计技术资料保留清理期限，生产治理/清理启用前确认 | T183 |

C-01 已完成，C-06 非产品课程事项已移出，均不进入待办。首个完整季度任务必须等待实际上线和适用季度到来；这不表示设计不明确，也不能用演练冒充验收。

## 2026-11-09 Analyze 发现的依赖修订

| 发现 | 原定位 | 已补充的执行依赖与验证要求 |
| --- | --- | --- |
| I1 | FR-001 / UC01-S1 与 UC05 getPatient | T092、T093 → T140；真实 PatientView 生成过敏确认引用，禁止用数据夹具或 Mock 替代端到端接口。T140 沿用 FR-009/UC05 所有权，增加跨故事消费关系，不新建接口。 |
| I2 | C-04/C-05 微信与部署 | T175 → T178；先验证隔离 HTTPS 联调后端、证书、代理及微信可达性，再进行真实登录/绑定联调。 |

任务数量和原编号保持不变；实际执行顺序见 tasks.md 末节及 tasks-catalog.json 的 execution_order。此处记录已授权的任务修订，不代替后续只读 Analyze 结论。

## 数据库测试任务完成条件补充

T008只编写测试，T009及T010—T042准备迁移；T043实际执行迁移后运行结构/权限测试并取得通过证据；T050在T044—T049完成后执行基础集成门禁。此说明不改变FR-020/AC-G04或任何原业务验收标准。
