# Vue UI 第一阶段 — 2026-11-16

本阶段直接更新正式 apps/admin，不生成独立演示应用。DentalPin 内部截图仍保留在 D:/ADC_DentalPin_UI_Research，不参与本次构建。

## 已完成

- App.vue：固定深蓝侧栏、分组导航、当前项高亮、顶部路径/岗位/范围提示、左下角齿轮管理中心、原退出流程及无障碍跳转。
- navigation.ts / navigation.spec.ts：复用当前 canAccess，只显示已有岗位和能力允许的模块；预约与排班保持独立，原路由及后端校验保留。
- ManagementView.vue / router/index.ts：新增纯前端管理导航页，连接既有组织资源、员工账号和诊所授权；未新增业务 API 或伪造床位功能。
- style.css：统一字体、颜色、间距、表格、按钮、输入框、弹窗、反馈与响应式登录页。
- authentication/index.vue / api/authentication.ts / staff-accounts/index.vue：品牌登录、统一“密码”文案及直观密码管理入口；核验要求、原因、审计、原键重试、会话保护保持。
- 同步已有 E2E 登录标签及 tools/preview/check-local-preview.mjs 的定位器；未删断言。
- tools/preview/refresh-admin-preview.mjs：只更新本地 admin，保留 backend/mysql 容器及数据；原云候选清单未覆盖。
- tools/preview/check-ui-shell.mjs：真实四岗位浏览器检查，不拦截 API 或模拟成功。

## 验证

- vue-tsc --noEmit：通过。
- 21 个测试文件 / 40 项前端测试：全部通过，见 ui-stage1-unit.log。首轮一次旧授权页路由加载超时，单独复跑及最终全量均通过；未提高超时或减弱断言。
- Vite 生产构建通过，见 ui-stage1-build.log。
- 四岗位真实 MySQL 后端下的登录、导航无下划线/深色固定侧栏、折叠、非总部越权路由拦截、退出、390px 登录页无横向溢出通过，见 ui-stage1-browser.json。移动端各业务页的完整适配尚未验收。
- ui-stage1-preservation.json：对研究阶段记录的 3149 个非前端文件比较，变更为 0，涵盖已记录后端、数据库、契约、Spec/Plan/Tasks、宪章和原始设计。
- ui-stage1-deployment.json：当前本机 https://localhost:19443，前端镜像 adc/admin:ui-20261116，仅 admin 重建，原后端及 MySQL 容器保留。

## 范围与后续

第一阶段框架已完成；业务页面的日历/详情/流程布局改造为第二阶段，组织资源细分及授权表单深化为第三阶段。现有页面已使用公共框架与基础样式，不能据此声称后续阶段全部完成。

教师与普通员工已共用统一登录入口。尚未创建或扩大一个跨岗位教师演示账号；当前四账号及合法 RBAC 保留。新账号如后续配置，必须经现有账号/授权接口明确授予所需岗位、诊所和有效期，不能把前端入口当作权限。

没有新增床位/牙椅、支付等原业务外功能；没有修改数据库、API、业务规则或 Spec Kit 任务。本地密码仍在原受控文件，不进入代码、镜像或报告。

补充验收：原有 shell Playwright 两项通过（ui-stage1-shell-e2e.log）。Windows 临时 Vite 4173 测试服务器退出阶段挂起，经核对 PID 后使用 taskkill 清理，仅停止该测试进程，测试命令最终退出码为 0；真实 Docker 19443 预览保持运行。
