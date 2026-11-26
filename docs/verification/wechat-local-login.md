# 本机微信登录联调准备 — 2026-11-16

目标：不启用备案前公网DNS/HTTPS，开发者工具本机连接真实本地后端和微信官方服务。

新增显式构建命令：apps/patient-miniprogram中的npm run build:local / verify:local。普通build仍保留源config.ts中的https://andrewdental.cn；本地命令由源构建脚本生成https://localhost:19443配置，最后一次构建为本地版本。后续开发工具重新编译无需再次npm构建；如果修改TS源码，应先运行verify:local，避免普通build恢复正式域名目标。

修改：scripts/build.mjs、package.json、README.md。未修改业务服务、身份架构、API契约、数据库或合法域名校验配置。没有伪造wx.login、OpenID或ADC会话。本机测试不代表正式合法域名及真机验收通过。

已验证：普通verify通过且产物仍指向正式域名；verify:local通过且产物指向localhost。工具原生wcc已成功编译本地构建登录页。本机HTTPS使用已存在本机证书，CA核验通过，POST微信会话接口空body被400拒绝；前后端AppID匹配，后端prod配置及官方适配器、秘密文件挂载保持。后端容器可通过HTTPS访问官方jscode2session接口，不带任何秘密的探测得到HTTP200、appid missing错误，证明连接可达，不证明真实身份认证。

运行时工具设置：project.config.json仍urlCheck=true；用户已有project.private.config.json为urlCheck=false，本轮未改此设置。该条件仅用于开发工具的本机联调，不用于宣称正式域名校验通过。

负责人已手动开启开发工具服务端口。官方auto命令仍停在准备/获取AppID权限，自动化WebSocket尚不可用，未伪报自动验收成功。

首次手动复测仍报andrewdental.cn连接关闭，但本地NGINX未收到该次请求；磁盘产物确为localhost。因此通过官方cache --clean compile清理当前工程编译缓存，未清除storage/auth/session。已请负责人清空Console后重新编译，记录新请求地址和结果；真实微信登录成功尚待确认。

证据：wechat-local-default-build.log、wechat-local-build.log、wechat-local-readiness.json。未变更云端部署、DNS或开启网站。
补充：首次清编译缓存后仍报告旧公网域名，已执行官方reset-fileutils、close当前工程、open准确项目路径，均返回成功，未退出整个IDE；重新打开后的真实登录结果仍待用户反馈。

## 2026-11-17 实际恢复与验证

以上为历史记录。本次发现 Docker Desktop 未启动、Docker Engine 管道不存在；启动既有 Docker Desktop 后，原 admin、backend、MySQL 容器全部恢复 healthy，保留原镜像及持久化卷，无需重建或初始化数据。

通过官方自动化接口连接现有 adc-patient 工程，并从运行中的模块读取 API_ORIGIN，确认实际为 https://localhost:19443。点击真实微信登录按钮完成官方 wx.login 与现有后端会话交换，页面 authenticated=true、busy=false、error 为空；随后调用实际 /me 服务确认 subject_type=PATIENT。没有模拟微信 code、会话或绑定。

在实际患者资料页面另发现未绑定时出现空白资料卡和多条空白过敏记录。原生 WXML 编译后执行渲染复现断言失败（应为 0 个资料卡，实际为 2）。修复 patients、patient-bindings、appointment-cancellation 三个源 index.wxml 中遗漏的数据绑定花括号，包含 wx:if 和 wx:for；scripts/build.mjs 增加构建检查，阻止此类遗漏再次进入产物。不修改服务、字段、数据库、契约、权限、身份核验或业务状态。

验证：verify:local（类型检查及本地 build）通过；现有 6 项 mini-auth 测试通过；微信原生 wcc 对源及 dist 各 6 页编译通过；新增 6 个原生条件渲染场景通过，覆盖未绑定/已绑定资料、空/单项过敏、绑定申请显隐、空预约及仅待就诊预约允许选择。既有预约 disabled 32 种逻辑组合及 16 种原生渲染场景仍通过。

最终构建后再次真实登录成功，并以真实患者会话打开本人资料、本人档案绑定、本人预约、本人预约与取消四页，均完成加载。当前真实微信主体尚无患者绑定：资料及预约接口按既有规则拒绝读取患者隐私，绑定页正常读取服务诊所。没有提交绑定、预约或取消请求。具体运行结果见 wechat-local-runtime.json。

截图接口在部分页面切换后出现自动化超时，已如实记录，四个页面的运行加载验证不冒充完整截图验收；成功登录截图保存在本机 tmp/wechat-live-login.png。六页中 pages/index/index 为原有占位页，不列为已完成业务功能。

本次仅完成 Windows 微信开发者工具本地联调，未完成正式域名、ICP、真机及生产验收；没有开启公网 DNS/网站，没有修改用户原有的开发工具域名检查设置。

## 2026-11-18 中断后核对

现有 admin、backend、MySQL 三个容器仍为 healthy，微信开发者工具窗口为 adc-patient；未重建环境。上述四个修复源文件 SHA-256 与已验证记录一致，三个页面的源模板与 dist 完全一致，当前构建仍连接 https://localhost:19443。没有重复运行未变化的测试。

本轮重新连接官方自动化时，原端口不可用，auto 命令再次停在获取 AppID 权限，未取得新的运行截图。2026-11-17 保存的真实登录、/me 与四页加载记录仍保留，但不视作 2026-11-18 的新截图验收；完整逐页视觉复核尚未完成。当前未绑定患者档案的限制保持，不代为绑定，不提交预约。
