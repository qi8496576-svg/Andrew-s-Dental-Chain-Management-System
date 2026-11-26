# T004 原生微信小程序工程初始化

状态：PASS（仅 T004 工程范围）。2026-11-10 已完成原生 TypeScript/WXML/WXSS 目录、微信开发工具项目配置、npm 锁文件、类型检查和编译入口。

使用 D 盘既有 Node 24.22.1/npm 11.19.1。TypeScript 5.9.3、微信官方 miniprogram-api-typings 5.3.1 固定版本；package-lock.json 保留完整性校验。npm ci、tsc --noEmit、原生 TypeScript 编译与 1 个页面的 JS/JSON/WXML/WXSS 输出完整性检查、npm ls 全部退出码 0。官方 API 类型依据：https://github.com/wechat-miniprogram/api-typings 。

源码在 apps/patient-miniprogram/miniprogram，生成目录为 dist/miniprogram，project.config.json 指向生成目录。没有新增业务功能、客户端业务规则、身份模拟器或服务端秘密。urlCheck 保持 true。

**未执行**：微信开发者工具实际编译/预览、WXML/WXSS 运行校验、真机及真实微信身份联调。AppID 留空，尚无负责人确认的真实测试 AppID；不能把类型检查或 Node 编译解释为这些验证已经完成。对应真实环境工作仍由 C-04 及后续任务落实，不变更业务架构。

复现入口：tools/verification/Verify-MiniProgramBuild.ps1。实际命令、退出码、未执行项见 t004-build-result.json，各步完整日志为 t004-ci/typecheck/build/dependencies.log；文件指纹见 t004-validation.json。31 项冻结输入未变，任务只勾选 T004，原 186 项和依赖不变。
