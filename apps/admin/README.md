# ADC 管理后台工程

Vue、Router、Pinia、Element Plus 管理端，已接入真实员工会话、诊所授权及既有业务 API。日常业务位于左侧主导航；系统配置及人员权限位于左下角独立齿轮。最新改版与实际验证见[2026-11-23 审查落地说明](../../docs/ui/admin-design-review-20261123.md)，此前工作区见[2026-11-19 说明](../../docs/ui/admin-workspace-20261119.md)。

本机演示从仓库根目录运行 `tools/preview/Start-LocalIntegration.ps1`，访问 https://localhost:19443；该入口和患者端共用已有后端及持久化 MySQL。账号资料及微信工具操作见[本机联调手册](../../ops/runbooks/local-integration.md)。修改前端后使用项目 Node 执行 `tools/preview/refresh-admin-preview.mjs`，会先构建当前源码，再仅更新管理端容器。启动入口会保留这个新版镜像。

使用 Node 24 LTS（≥24.12，<25）与 npm 11；完整补丁和传递依赖由 package.json/package-lock.json 锁定。当前 Windows 工具链位于项目的 `tmp/toolchains/node-v24.22.1-win-x64`，npm 缓存、临时目录和可选浏览器下载放在项目 D 盘 tmp 下，不全局安装。

从项目根目录执行 `tools/verification/Verify-AdminBuild.ps1` 可复现 npm ci、类型检查、Vitest、生产构建和 Playwright。Windows 默认复用已有 Edge（msedge），不自动安装浏览器。其他环境可设置 ADC_BROWSER_CHANNEL 或留空使用 Playwright Chromium；下载时必须把 PLAYWRIGHT_BROWSERS_PATH 指向 D 盘（Windows）或指定开发存储目录。

在本目录使用 npm：`npm run dev`、`npm run typecheck`、`npm test`、`npm run build`、`npm run test:e2e`。运行前为当前终端配置所选 Node/npm 的 PATH、D 盘 TEMP/TMP、NPM_CONFIG_CACHE、NPM_CONFIG_PREFIX 和 PLAYWRIGHT_BROWSERS_PATH；验证脚本已统一处理这些设置。

开发服务器只绑定 127.0.0.1。本机 HTTPS 容器已配置 history 回退和 `/api/v1` 反向代理，独立配置页支持直接访问与刷新。路由与菜单依照当前会话能力展示，后端仍逐次检查真实岗位、诊所、有效期和操作能力；管理员演示账号使用正常授权，不绕过服务端权限。
