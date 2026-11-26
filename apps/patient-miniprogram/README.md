# ADC 原生微信患者端工程

2026-11-23：管理后台使用周课表查看和设置排班；患者端继续按天选择门店、项目、医生和可约时段。同步的是筛选条件变化后清空旧结果、重新选择后再次确认、提交结果待确认时复用原请求、预约状态和业务提示。保留原主题色 `#17778b`。27 项单元测试、原生模板样式编译和真实微信模拟器联调通过；详见[本次交互同步记录](../../docs/ui/patient-interactions-20261123.md)。未上传或发布小程序。

2026-11-18：本机真实微信登录、虚构档案核验绑定、患者预约/取消和管理端确认到诊双向联动已通过。启动、访问、演示与外部阻塞项以 [本地联调手册](../../ops/runbooks/local-integration.md) 为准；下方早期准备记录保留为历史。

本机开发者工具联调：运行 `npm run verify:local`，生成明确连接 `https://localhost:19443` 的模拟器构建；继续使用真实 wx.login、真实本机后端与官方微信身份交换，不模拟患者身份。此构建仅适用于当前 Windows 电脑的开发者工具，不用于真机或发布。普通 `npm run build` 仍生成正式域名目标；两种构建都不修改域名/证书校验设置，AppSecret仍只在后端。真实本机登录须由开发者工具实际操作验证，不计作正式合法域名或真机验收。

当前已实现登录、患者资料、本人绑定、预约和取消等六页及真实后端调用；2026-11-14已配置负责人提供的公开AppID与目标域名，类型检查及六页构建通过。微信开发者工具导入此项目目录，详见[本机预览说明](../../ops/runbooks/local-preview.md)。实际微信登录/合法域名联调等待ICP备案，未虚报通过。

以下保留T004建项时的工程说明；其中“当时AppID留空”是历史状态，当前配置已完成。AppSecret始终只在受控后端文件，不在小程序内。

使用与管理端相同的 Node 24/npm 11 D 盘工具链。运行 `npm ci`、`npm run verify`，TypeScript 先编译到 `dist/miniprogram`，WXML/WXSS/JSON 原样复制，微信开发者工具读取这个生成目录。因此导入前及修改源码后均需重新 `npm run build`；不要编辑生成文件。缓存与临时目录设置沿用 `tools/verification/Verify-AdminBuild.ps1` 的 D 盘配置。

在微信开发者工具中导入本目录，使用负责人已配置AppID对应且有开发权限的账号。T004时appid曾留空，后续已由负责人提供文件配置，没有借用官方示例AppID或伪造身份。实际开发工具编译/预览仍需开发者登录；未执行时不得记为通过。AppID是公开标识，AppSecret、session_key、上传私钥、会话令牌绝不能放入客户端。真实身份和HTTPS联调仍属C-04及T051，当前等待ICP。

本地工程编译使用 TypeScript 5.9.3；[微信官方 API 类型包](https://github.com/wechat-miniprogram/api-typings)固定 5.3.1。项目配置结构参考[微信官方原生示例](https://github.com/wechat-miniprogram/miniprogram-demo/blob/master/project.config.json)，本工程自行预编译 TypeScript，不另启用开发工具的 TypeScript 编译插件。不关闭域名校验，不添加云开发或支付功能。

Node 编译与文件结构校验不是微信 WXML/WXSS 编译、开发工具预览或真机验收。基础库版本将在首次实际开发工具验证时记录，本任务不虚构已经运行的版本。


2026-11-18患者端UI改版：现在以首页启动，原生底部导航为首页/预约/记录/我的，共七页。原登录、绑定、资料、预约与取消入口保留；新增个人中心与预约状态筛选。详见 docs/ui/patient-redesign-20261118.md；最终验证边界见 docs/verification/patient-ui/final-result.json。

