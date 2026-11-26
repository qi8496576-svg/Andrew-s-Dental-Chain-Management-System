# ADC HTTP操作与追踪目录

统一前缀 /api/v1；本文件定义当前接口与需求、权限及验收的对应关系。完整行为见 [api.md](api.md)，身份见 [identity.md](identity.md)，机器契约见 [openapi.json](openapi.json)。

| 方法与路径 | operationId | 原需求 | 权限/关键条件 | 验收导航 |
| --- | --- | --- | --- | --- |
| GET /auth/csrf | initializeWebCsrf | SF01 | 匿名技术上下文；只初始化CSRF，不授业务身份；禁止缓存 | AC-SF01-01 |
| POST /auth/wechat-sessions | createWechatSession | SF01 | 微信真实代码交换；code2Session失败不建会话，不自动绑定患者 | AC-SF01-01 |
| POST /auth/staff-sessions | createStaffSession | SF01 | 个人账号及预认证CSRF；Web成功Set-Cookie并轮换CSRF；5错限15分钟 | AC-SF01-01 |
| DELETE /auth/session | logout | SF01 | 有效会话；注销当前会话；下一受保护请求拒绝 | AC-SF01-01 |
| GET /me | getCurrentIdentity | SF01 | 当前主体；只读自身可信上下文，不能覆盖角色范围 | AC-SF01-01 |
| POST /me/patient-registration | registerSelfPatient | SF02 / UC01-S1 | 微信患者首次登记，无需编号或人工核验；只新建并关联本人档案 | AC-SF02-03 |
| POST /me/binding-requests | requestPatientBinding | SF02 | 已登录患者；仅申请，不自动取得档案 | AC-SF02-01 |
| GET /me/binding | getPatientBinding | SF02 | 已登录患者；只查当前本人绑定，未绑定404 | AC-SF02-01 |
| GET /binding-requests | listBindingRequests | SF02 | 授权前台核验范围；按前台服务依据过滤申请 | AC-SF02-02 |
| POST /binding-requests/{requestId}/approve | approvePatientBinding | SF02 | 授权前台核验；核实本人及双向当前唯一；冲突409不覆盖 | AC-SF02-01 |
| POST /patient-bindings/{subjectId}/rebind | rebindPatient | SF02 | 授权前台人工核验；原子旧失效新有效及审计，旧会话失去本人依据 | AC-SF02-02 |
| POST /patient-bindings/{subjectId}/revoke | revokePatientBinding | SF02 | 授权前台人工核验；解绑保留核验历史和原因，撤销旧本人访问依据 | AC-SF02-02 |
| POST /identity/staff-accounts | createStaffAccount | SF03 | HQ account.manage；创建/关联不自动授权，非牙医不写Dentist | AC-SF03-01 |
| POST /identity/staff-accounts/{subjectId}/activate | activateStaffAccount | SF03 | HQ account.manage；核实后办理；停用/恢复撤销旧会话，凭据不入回执日志 | AC-SF03-02 |
| POST /identity/staff-accounts/{subjectId}/deactivate | deactivateStaffAccount | SF03 | HQ account.manage；核实后办理；停用/恢复撤销旧会话，凭据不入回执日志 | AC-SF03-02 |
| POST /identity/staff-accounts/{subjectId}/credential-recovery | credentialrecoveryStaffAccount | SF03 | HQ account.manage；核实后办理；停用/恢复撤销旧会话，凭据不入回执日志 | AC-SF03-02 |
| POST /identity/grants | createClinicGrant | SF04 | HQ authorization.manage；仅在自身可授范围配置岗位/诊所/期限 | AC-SF04-01 |
| POST /identity/grants/{grantId}/revoke | revokeClinicGrant | SF04 | HQ authorization.manage；下一受保护请求拒绝旧范围 | AC-SF04-02 |
| GET /requests/{requestKey} | getRequestResult | FR-019 | 原主体及原操作当前权限；超时原键查询；回执不绕过撤权，只返有权对象引用 | AC-UC01-S1-06 |
| GET /appointment-candidates | searchAppointmentCandidates | UC01-S1 | 患者/授权前台；全部必需资质/执业/NORMAL/占位满足，提交仍复核 | AC-UC01-S1-03 |
| GET /appointments | listAppointments | UC01 | 本人或岗位诊所对象范围；参数不扩大可信范围 | AC-G02 |
| POST /appointments | createAppointment | UC01-S1 | 本人绑定患者/核验代办前台；原子预约/期望治疗/BOOK/审计/回执，同键复用 | AC-UC01-S1-01 |
| GET /appointments/{appointmentId} | getAppointment | UC01 | 本人或获授权岗位对象；五状态投影，临床风险/收费所需字段分别控制 | AC-G02 |
| POST /appointments/{appointmentId}/attend | attendAppointment | UC01-S2 | 授权前台；NORMAL且SCHEDULED核实本人，原子ATTEND | AC-UC01-S2-01 |
| POST /appointments/{appointmentId}/cancel | cancelAppointment | UC01-S3 | 本人患者/授权前台；自助开始前NORMAL；开始后至结束前仅前台；结束转S4/停诊转S5 | AC-UC01-S3-02 |
| POST /appointments/{appointmentId}/no-show | markNoShow | UC01-S4 | 授权前台；时隙结束核实未到诊，NO_SHOW为分类，不覆盖到诊 | AC-UC01-S4-03 |
| POST /appointments/{appointmentId}/reschedule | rescheduleAppointment | UC01-S5 | 授权前台；停诊旧约，旧新/来源/两端事件原子，失败保留待处理 | AC-UC01-S5-03 |
| POST /appointments/{appointmentId}/complete | completeAppointment | UC03 | 获授权牙医；进行中且有有效项目，原子COMPLETE | AC-UC03-03 |
| POST /appointments/{appointmentId}/invoice | invoiceAppointment | UC04 | 授权诊所收费；已完成有效诊疗唯一开票，重复原单，不处理付款 | AC-UC04-02 |
| GET /schedules | listSchedules | UC02 | 授权前台/总部资源；按授权范围读取 | AC-UC02-01 |
| POST /schedules | createSchedule | UC02 | 授权前台；稳定Dentist锁内校验跨诊所NORMAL不重叠及粒度 | AC-UC02-02 |
| POST /schedules/{scheduleId}/suspend | suspendSchedule | UC02 | 授权前台；只挂起和返回影响，不自动取消 | AC-UC02-03 |
| PATCH /appointments/{appointmentId}/clinical-notes | updateClinicalNotes | UC03 | 获授权牙医；只在IN_PROGRESS登记问题/特殊需求 | AC-UC03-02 |
| POST /appointments/{appointmentId}/applied-treatments | recordAppliedTreatment | UC03 | 获授权本人实施牙医；实施者可不同于预约牙医，治疗日资格/执业有效，冻结目录价 | AC-UC03-04 |
| POST /applied-treatments/{appliedTreatmentId}/correct-price | correctTreatmentPrice | UC03 | 另授price.correct能力；仅开票前核实纠错并保留旧新价审计 | AC-UC03-05 |
| GET /invoices/{invoiceId} | getInvoice | UC04 | 授权收费/来源读取总部；只读费用凭据，不含付款标识及临床全文 | AC-UC04-05 |
| POST /patients | createPatient | UC05 | 授权前台核实本人；查重后建档，电话不唯一，邮箱可空 | AC-UC05-01 |
| GET /patients/{patientId} | getPatient | UC05 | 本人有效绑定/授权前台服务范围；牙医/收费另从本次就诊最小投影读取 | AC-UC05-02 |
| PATCH /patients/{patientId} | updatePatient | UC05 | 授权前台核实本人；只改允许字段，ETag不新增业务列 | AC-UC05-04 |
| POST /patients/{patientId}/allergy-reviews | reviewPatientAllergies | UC05 | 授权前台核实；NO_KNOWN须询问，RECORDED须有效关联，空关系不推无过敏 | AC-UC05-03 |
| POST /patients/{patientId}/allergy-records | addPatientAllergy | UC05 | 授权前台核实；选共享目录，追加核实历史 | AC-UC05-04 |
| POST /patients/{patientId}/allergy-records/{allergyId}/correct | correctPatientAllergy | UC05 | 授权前台核实；更正当前值及追加旧新值/主体/时间/依据 | AC-UC05-04 |
| POST /patients/{patientId}/allergy-records/{allergyId}/retract | retractPatientAllergy | UC05 | 授权前台核实；撤销误记保留历史，不改共享目录 | AC-UC05-04 |
| GET /clinics | listClinic | UC06 | 按用途核验目录读取；牙医名单仅员工；最小代码/名称投影，不披露牙医家庭联系资料 | AC-UC06-01 |
| POST /clinics | createClinic | UC06 | HQ resource.write；编码/日期/引用验证并留痕 | AC-UC06-01 |
| GET /clinics/{resourceId} | getClinic | UC06 | HQ resource.read及诊所范围；仅总部资源详情，不从目录读取权推导 | AC-UC06-01 |
| PATCH /clinics/{resourceId} | updateClinic | UC06 | HQ resource.write；停用不删历史，调价只影响未来，缩短区间列未来影响 | AC-UC06-03 |
| GET /dentists | listDentist | UC06 | 按用途核验目录读取；牙医名单仅员工；最小代码/名称投影，不披露牙医家庭联系资料 | AC-UC06-01 |
| POST /dentists | createDentist | UC06 | HQ resource.write；编码/日期/引用验证并留痕 | AC-UC06-01 |
| GET /dentists/{resourceId} | getDentist | UC06 | HQ resource.read及诊所范围；仅总部资源详情，不从目录读取权推导 | AC-UC06-01 |
| PATCH /dentists/{resourceId} | updateDentist | UC06 | HQ resource.write；停用不删历史，调价只影响未来，缩短区间列未来影响 | AC-UC06-03 |
| GET /qualifications | listQualification | UC06 | 按用途核验目录读取；牙医名单仅员工；最小代码/名称投影，不披露牙医家庭联系资料 | AC-UC06-01 |
| POST /qualifications | createQualification | UC06 | HQ resource.write；编码/日期/引用验证并留痕 | AC-UC06-01 |
| GET /qualifications/{resourceId} | getQualification | UC06 | HQ resource.read及诊所范围；仅总部资源详情，不从目录读取权推导 | AC-UC06-01 |
| PATCH /qualifications/{resourceId} | updateQualification | UC06 | HQ resource.write；停用不删历史，调价只影响未来，缩短区间列未来影响 | AC-UC06-03 |
| GET /treatments | listTreatment | UC06 | 按用途核验目录读取；牙医名单仅员工；最小代码/名称投影，不披露牙医家庭联系资料 | AC-UC06-01 |
| POST /treatments | createTreatment | UC06 | HQ resource.write；编码/日期/引用验证并留痕 | AC-UC06-01 |
| GET /treatments/{resourceId} | getTreatment | UC06 | HQ resource.read及诊所范围；仅总部资源详情，不从目录读取权推导 | AC-UC06-01 |
| PATCH /treatments/{resourceId} | updateTreatment | UC06 | HQ resource.write；停用不删历史，调价只影响未来，缩短区间列未来影响 | AC-UC06-03 |
| GET /allergies | listAllergy | UC06 | 按用途核验目录读取；牙医名单仅员工；最小代码/名称投影，不披露牙医家庭联系资料 | AC-UC06-01 |
| POST /allergies | createAllergy | UC06 | HQ resource.write；编码/日期/引用验证并留痕 | AC-UC06-01 |
| GET /allergies/{resourceId} | getAllergy | UC06 | HQ resource.read及诊所范围；仅总部资源详情，不从目录读取权推导 | AC-UC06-01 |
| PATCH /allergies/{resourceId} | updateAllergy | UC06 | HQ resource.write；停用不删历史，调价只影响未来，缩短区间列未来影响 | AC-UC06-03 |
| POST /dentists/{dentistId}/qualifications | maintainDentistQualification | UC06 | HQ resource.write；复合主键维护当前资质，续期旧依据留审计 | AC-UC06-02 |
| POST /dentists/{dentistId}/clinic-assignments | maintainDentistAssignment | UC06 | HQ resource.write；保留随时间执业，列未来影响 | AC-UC06-04 |
| PUT /treatments/{treatmentId}/qualification-requirements | setTreatmentRequirements | UC06 | HQ resource.write；必需/非必需含义固定及引用校验 | AC-UC06-01 |
| POST /cost-entries | recordCostEntry | UC07 | HQ cost.verify；核验来源唯一，确认主体/时点由服务端取得 | AC-UC07-08 |
| POST /cost-entries/{costEntryId}/reverse | reverseCostEntry | UC07 | HQ cost.verify；核验冲销发生时点及新来源，原正额生成同归属/类型等额负数唯一冲销 | AC-UC07-08 |
| POST /performance-preparations | prepareQuarterPerformance | UC07 | HQ cost.verify及人员核验范围；原QuarterlyPerformance的DRAFT/source_snapshot准备，不加业务表 | AC-UC07-05 |
| POST /performance-calculations | calculateQuarterPerformance | UC07 | HQ performance.calculate/可信内部季度触发；结束季度系统人员/来源/R1计算，缺依据INCOMPLETE，不自动发布 | AC-UC07-01 |
| GET /quarterly-performances | listQuarterPerformance | UC07 | HQ获授核算/分析范围；内部可查状态，普通分析仅当前PUBLISHED | AC-UC07-07 |
| GET /quarterly-performances/{performanceId}/sources | getQuarterPerformanceSources | UC07 | HQ sensitive.drilldown及来源权限；读取冻结依据前保存敏感查询审计 | AC-UC07-09 |
| POST /quarterly-performances/{performanceId}/publish | publishQuarterPerformance | UC07 | HQ performance.publish；独立事务锁稳定Dentist，校验摘要完整性守恒，原子唯一发布切换 | AC-UC07-07 |
| GET /analytics/{metric} | getAnalysis | UC08 | HQ analysis.read及范围；统一期间/cutoff/版本；零分母不可计算，未处理暂定 | AC-UC08-01 |
| GET /audit-events | searchAuditEvents | Q08 | HQ audit.read；只读可信审计，无改删接口，无秘密/无关临床 | AC-Q08 |
| GET /appointments/{appointmentId}/clinical-context | getClinicalContext | UC03 | 获授权本次就诊牙医；返回必要过敏风险、问题及实际诊疗，不因知道就诊ID获得无关档案 | AC-UC03-01 |
| GET /applied-treatments/{appliedTreatmentId} | getAppliedTreatment | UC03 | 获授权接诊/另授价格纠错对象范围；读取历史价及ETag，开票后只读 | AC-UC03-05 |
| GET /patients/{patientId}/allergy-records | listPatientAllergies | UC05 | 当前有效关联本人/授权前台服务范围；核对当前及撤销项；核验审计历史须另授权读取，不把空关联视为无过敏 | AC-UC05-04 |
| GET /cost-entries | listCostEntries | UC07 | HQ cost.verify及范围；按发生期间/来源查询已确认凭证，不提供覆盖删除 | AC-UC07-08 |
| GET /cost-entries/{costEntryId} | getCostEntry | UC07 | HQ cost.verify及范围；已确认凭证及冲销引用只读 | AC-UC07-08 |
| GET /identity/staff-accounts | listStaffAccounts | SF03 | HQ account.manage；仅账号管理者读取必要账号信息，无密码/令牌 | AC-SF03-01 |
| GET /identity/grants | listClinicGrants | SF04 | HQ authorization.manage及可授范围；只读自身有权管理的授权，不扩大诊所范围 | AC-SF04-01 |
| POST /patients/lookup | lookupPatient | UC05 | 当前授权前台、编号/生日精确核对、实际服务诊所和人工依据；可信核验/审计/回执原子保存，不按电话取得档案 | AC-UC05-01、AC-UC05-02 |

| POST /booking-holds | createBookingHold | FR-026 | 收费预约的五分钟号源保留；本人/岗位与诊所范围由后端校验 | AC-PB-01、AC-PB-02 |
| GET /patient-bills | listPatientBills | FR-026 | 本人或授权诊所费用列表；本人/岗位与诊所范围由后端校验 | AC-PB-01、AC-PB-02 |
| GET /patient-bills/{billId} | getPatientBill | FR-026 | 费用详情及演示支付退款记录；本人/岗位与诊所范围由后端校验 | AC-PB-01、AC-PB-02 |
| POST /patient-bills/{billId}/demo-payments | payDemoBill | FR-026 | 演示缴费并确认收费预约，不扣真实款；本人/岗位与诊所范围由后端校验 | AC-PB-01、AC-PB-02 |
| POST /patient-bills/{billId}/close | closePatientBill | FR-026 | 取消未付号源，不登记爽约；本人/岗位与诊所范围由后端校验 | AC-PB-01、AC-PB-02 |
| POST /patient-bills/{billId}/refunds | refundPatientBill | FR-026 | 符合退号事实或收费人员授权的全额演示退款；本人/岗位与诊所范围由后端校验 | AC-PB-01、AC-PB-02 |
| GET /registration-fees/{clinicId}/{dentistId} | getRegistrationFee | FR-026 | 查询门店医生挂号费；本人/岗位与诊所范围由后端校验 | AC-PB-01、AC-PB-02 |
| PUT /registration-fees/{clinicId}/{dentistId} | setRegistrationFee | FR-026 | 按resource.write配置演示门店挂号费；本人/岗位与诊所范围由后端校验 | AC-PB-01、AC-PB-02 |
