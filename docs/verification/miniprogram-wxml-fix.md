# 小程序预约页 WXML 修复（2026-11-16）

根因：源预约模板 disabled 内含 HTML 实体 &amp;&amp;、&lt;，微信工具自带 wcc.exe 将分号作为代码解析，修复前已实际复现 `Bad attr disabled ... unexpected ; at pos22`（退出码2）。构建仅复制 WXML，TypeScript 检查不会发现此问题。

源文件改动仅两处：
1. miniprogram/pages/appointment-booking/index.wxml：禁用条件改为等价的 `busy || (unknown ? false : (!confirmed || 0 > selected))`，避免实体编码；同页 wx:if / wx:for 中的 data 字段补上动态绑定双大括号。事件处理仍通过 bindtap / bindchange；未发现模板内函数调用。
2. scripts/build.mjs：复制 WXML 前阻止绑定表达式包含 amp/lt/gt HTML 实体，防止同类问题再次被静默打包。此检查不代替微信编译器。

源文件修改后运行项目原有 npm run verify 及 npm run build，均通过；dist 为重新生成，未直接修补。

已使用安装在 D:/Users/APPdata/微信web开发者工具 的真实 wcc-exec/wcc.exe 编译器：修复后预约页成功；源目录六页和 dist 六页全部成功；源与生成预约模板一致。对禁用逻辑32组输入比较一致；执行原生编译生成的预约渲染函数，16组按钮状态及无患者时的条件渲染通过，无渲染诊断。

证据：miniprogram-wxml-verify.log、miniprogram-wxml-build.log、miniprogram-wxml-native.log、miniprogram-wxml-native.json。

没有操作微信开发者工具模拟器窗口，也未执行真实微信登录/合法域名联调。请在已打开的同一工程点击“编译”，重新载入生成文件；若保留旧报错，可清除编译缓存后再编译。未修改业务 TypeScript、API、数据库、AppID、域名校验或 Spec Kit 任务。
