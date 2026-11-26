# 新诊所首次管理范围：受控运维契约

2026-11-14负责人在当前会话有限批准，原提案及批准边界见 `docs/verification/decisions/new-clinic-authority-initialization-proposal.md`。这是一项运维入口补充，公开API仍为82操作/91模型，原identity.md、SF04、Spec、Plan、Constitution及三Schema/19业务表均不修改。

负责人必须逐次明确核实操作依据、目标在职总部员工、目标诊所和授权截止时间；经核验的文件交给具备环境运维资格的操作者。文件位置/宿主权限承担控制平面准入，不能用普通Web会话、请求头或任意客户端传入资料触发。代码检查记录完整性及当前数据库事实，不能证明纸面审批真实性，运维须核实审批原件。不得把数据库运行账号泄露给业务客户端。

`com.adc.identity.bootstrap.NewClinicManagement` 只通过显式命令启动，不注册Spring组件、Web路由或应用启动钩子。禁止在启动时自动执行。仅对已有 `createClinic` 成功审计、启用且从未有任何授权范围历史的新诊所执行；旧诊所接管、恢复和一般扩权不适用。已有首次成功审计也会永久关闭再次初始化，即使授权撤销/过期或范围被移除。

受控UTF-8 JSON必须且仅包含以下字段（全部显式填写；示例值不是实际审批）：

```json
{
  "clinic_id": "由UC06返回的诊所ID",
  "target_subject_id": "已核实总部员工Subject",
  "target_staff_reference": "与StaffAccount一致的员工核验引用",
  "owner_reference": "有权负责人核验引用",
  "verification_reference": "本次具体批准原件引用",
  "operator_reference": "本次运维操作者引用",
  "valid_until": "明确带时区的未来截止时间",
  "idempotency_key": "本次唯一且重试不变的键"
}
```

目标必须是有效STAFF、当前可独立登录且具有有效HEADQUARTERS/authorization.manage。只新增一份独立、仅含新诊所的HEADQUARTERS授权，能力固定为authorization.manage/resource.read/resource.write；不改写或扩大任何既有AccessGrant/范围，不自动授权创建者，不授临床/费用/核算/发布能力。之后通过普通SF04在明确的有效期内配置岗位。首次总部bootstrap的防重复保护保持不变。

环境只给文件路径和非秘密连接标识：`ADC_NEW_CLINIC_INPUT_FILE`、`ADC_BOOTSTRAP_DB_PASSWORD_FILE`、`ADC_DB_URL`、`ADC_DB_USERNAME`。数据库秘密不放命令参数。以独立运维作业运行：

```sh
java -Dloader.main=com.adc.identity.bootstrap.NewClinicManagement -cp /app/app.jar org.springframework.boot.loader.launch.PropertiesLauncher
```

复用首次总部初始化的有效SYSTEM身份、原表和同一连接事务。先取诊所初始化命名锁，再按稳定Subject顺序锁定目标，复核当前授权、诊所与历史。新增授权/范围/固定能力、完整成功审计（负责人/操作者/依据/有效期/目标）和回执一并提交；失败全部回滚，条件允许时另留失败审计。审计/回执不可写时不授予权限。相同键同内容只能读取既有且仍有效的结果，不延长、恢复或再授予；不同内容冲突。不要为重试换键。

失败或提交结果未知时保留原文件/键并核对审计和回执；禁止删除历史后再跑。普通服务仍逐次检查原岗位、能力和诊所范围。该入口不能成为通用授权命令。
