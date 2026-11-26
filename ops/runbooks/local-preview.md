# Windows 本机预览

后台地址：**https://localhost:19443**。仅绑定127.0.0.1，不通过公网域名，不开放云网站。浏览器首次会提示本地自签名证书；仅在确认地址是localhost:19443时继续本机预览，不把这种确认方式用于正式域名或微信验收。

登录资料在 `D:\secrets\AndrewDental\LocalPreview\预览登录资料.txt`，仅本人/SYSTEM/管理员可访问。四个岗位为preview-admin（总部）、preview-frontdesk（前台）、preview-dentist（医生）、preview-cashier（收费），各自随机独立口令，不在聊天或普通日志显示。该文件及JSON凭据不属于源码/镜像。预览使用独立数据库/签名秘密，未复用云端数据库口令。

这是当前已实现代码的实际Linux容器及真实MySQL环境，不是API模拟页面。所有员工/患者/资质均标记为本机虚构资料，请勿输入真实隐私。唯一直接写入的业务前提是明确标识的虚构初始诊所，用于既有首次总部bootstrap；后续账号、正常授权、资质/执业/治疗、患者核实/过敏、出诊班次及预约均由现有真实接口生成，不伪造治疗/结算成功。四个岗位的真实浏览器登录、对应页面及退出已核验，见docs/verification/local-preview-browser.json。

先使用前台查看独立出诊排班和预约管理，再按现有到诊→医生本人诊疗→完成→收费结算流程操作。虚构患者编号及班次/预约引用在docs/verification/local-preview.json；当前规则仍逐次校验岗位、诊所、身份、过敏及状态。总部可查看组织资源、授权、成本、季度和分析；结果仍取实际产生的来源及真实日期，不提前生成季度发布结果。结算不代表付款。

MySQL持久化卷为 `adc-local-preview_mysql_data`。窗口/Node启动脚本退出后容器继续运行；关闭浏览器不会清空数据。不要运行down -v。Docker Desktop重启后如需恢复，在项目根目录使用现有D盘Node运行：

```powershell
& .\tmp\toolchains\node-v24.22.1-win-x64\node.exe tools/preview/start-local-preview.mjs
```

该脚本复用已验证镜像（不build、不pull、不重新初始化已有业务记录），独立私密journal保留原请求键及完成步骤，不能用它重置未知卷。现有运行环境、云镜像与云持久化配置均保留。

微信开发者工具导入项目根目录：`D:\安德鲁牙科连锁管理系统——需求分析与设计文档\apps\patient-miniprogram`。不要只导入dist；project.config.json将编译目录指到dist/miniprogram。公开AppID已配置，6页TypeScript/WXML/WXSS产物已生成。使用该AppID有权限的开发者账号登录工具。

当前本机双端已完成真实微信登录、虚构档案核验绑定、预约/取消与管理端确认到诊联调。请按 [本地联调手册](local-integration.md) 启动及演示；患者端须执行 build:local 连接 https://localhost:19443。微信工具使用用户已有私有 urlCheck=false 配置，仅用于本机；正式合法域名及真机验收仍待备案。

