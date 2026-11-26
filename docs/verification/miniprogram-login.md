# 小程序首次登录排查 — 2026-11-16

截图已显示错误提示，点击事件确实触发；截图本身不能区分wx.login失败还是后端连接失败。

只读DNS查询andrewdental.cn返回SOA、没有A地址。当前小程序API_ORIGIN仍为https://andrewdental.cn、urlCheck=true，项目环境记录为负责人要求等待ICP，不开放正式DNS/公网HTTPS。实际后端会话交换因当前连通条件尚未落实而不能作为已完成验收。

修正源文件：
- miniprogram/pages/authentication/index.wxml：wx:if补齐动态绑定，未登录不再显示本人资料/绑定/预约入口。
- miniprogram/pages/authentication/index.ts：防重复点击，区分微信凭证与服务连接失败，失败清除绑定提示；原账号限制提示保持。
- miniprogram/services/authentication.ts：微信凭证获取和后端请求分别产生客户端分类错误，15秒超时；不记录code/令牌、不自动重试、不改服务端契约。
- tests/unit/mini-auth.test.mjs：平台失败、空code、网络失败不认证、限流不重试及页面反馈/防重复点击回归。

npm run verify、npm run build通过。6项相关单元测试通过（wx接口为测试桩，不代表真实微信联调）；开发工具原生wcc对源/dist各6页编译通过，编译产物验证未登录只有登录按钮、无业务导航，登录后恢复相应入口。

没有修改AppID/后端/数据库/业务规则，没有切换localhost、关闭合法域名校验或开放公网域名。真实微信登录及模拟器成功登录未验收。回到开发工具点击编译即可加载新的状态提示，真实登录仍须先完成原定域名/HTTPS/微信合法域名部署条件。
