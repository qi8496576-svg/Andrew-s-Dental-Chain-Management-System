# T003 管理后台工程初始化验证

验证时间：2026-11-10T23:27:26.4814437+08:00。状态：PASS。T003 已完成，未实现员工登录、后台业务页面或业务 API，不替代后续故事验收。

Node v24.22.1、npm 11.19.1 均位于项目 D 盘 `tmp/toolchains/node-v24.22.1-win-x64`。官方归档 SHA-256：`d2046d28c2c3dcd211ac5145c0bf30e2047ef9dfb306693c8c6e2eccd8b95fa5`，已逐字核对；来源：[Node 校验清单](https://nodejs.org/dist/v24.22.1/SHASUMS256.txt)。缓存、依赖、构建产物及浏览器临时目录均位于 D 盘；浏览器复用机器已有 Edge，不另安装浏览器。

| 包 | 精确版本 |
| --- | --- |
| element-plus | 2.14.8 |
| pinia | 3.0.4 |
| vue | 3.5.45 |
| vue-router | 4.6.4 |
| @playwright/test | 1.65.0 |
| @types/node | 24.19.2 |
| @vitejs/plugin-vue | 6.0.10 |
| typescript | 5.9.3 |
| vite | 8.3.7 |
| vitest | 5.1.0 |
| vue-tsc | 3.3.14 |

版本由官方 npm registry 解析并经 npm 实测；根依赖使用精确版本，传递依赖及 integrity 由 package-lock.json 锁定。Vite/插件/Vitest 的 peerDependencies 与 Node engines 在 npm engine-strict 检查下无冲突。参见 [Vite](https://vite.dev/guide/)、[Vitest](https://vitest.dev/guide/)；官方说明不替代以下运行结果。

| 验证 | 实际结果 |
| --- | --- |
| npm ci | 退出码 0；按锁文件安装 |
| vue-tsc --noEmit | 退出码 0 |
| Vitest | 2 项通过；首页延迟组件加载、未知嵌套路径路由 |
| Vite build | 退出码 0，生成 dist |
| Playwright / msedge | 2 项通过；生产构建可加载、无页面运行错误、Pinia/Element Plus 导航切换、直接访问/返回首页/刷新 |
| npm ls --depth=0 | 退出码 0；根依赖无 missing/invalid |

完整日志：`t003-ci.log`、`t003-typecheck.log`、`t003-unit.log`、`t003-build.log`、`t003-browser.log`、`t003-dependencies.log`。浏览器实际版本见 browser 日志。机器结果见 `t003-build-result.json`，XML 存档见 `archive/t003-success/`，文件指纹见 `t003-validation.json`。

环境问题与复核：首次沙箱内浏览器用例通过，但框架关闭 Vite 子进程时停滞，需要在沙箱外核对进程身份并终止该测试服务；该次日志保留在 `archive/t003-sandbox-run/`。最终在获准的沙箱外环境完整重跑，2项浏览器测试约5.5秒正常结束，退出码0且自动清理成功。没有改用跳过测试或复用未知服务来掩盖退出问题。上述成功结论取最终重跑结果。

仅验证工程骨架与工具链；没有真实业务数据、权限验证或正式后台导航设计。所有 31 项冻结输入指纹保持不变；tasks.md 仅更新 T003 勾选，186 项内容、编号和依赖不变。T092/T093→T140、T175→T178 仍保留。

负责人提供的产品参考登记于 [reference-brief.md](../ui/reference-brief.md)，后续按依赖顺序使用，在批量业务页面开发前先展示导航及关键页设计。

复现：项目根目录执行 `tools/verification/Verify-AdminBuild.ps1`。这不是全系统或业务验收通过的声明。
