# T051 正式域名微信联调

2026-11-24，负责人确认 andrewdental.cn 域名 ICP 已通过，并授权推进 T050/T051。小程序自身的 ICP 备案提交由负责人办理，本轮没有代办、提交身份证件或发布正式小程序版本。

## 当前已执行

- 正式入口为 https://andrewdental.cn，管理端与患者端 `/api/v1` 共用同一个云端后端及 `adc-isolated-loopback_mysql_data` 持久化库。项目名称是历史名称，当前 443 域名入口已启用。
- DNS A 指向 43.139.92.113；负责人完成云防火墙 TCP 80/443 配置和小程序后台 request 合法域名配置。
- Let’s Encrypt 正式证书签发、正常 TLS 校验及续期 dry-run 通过。AppSecret 只在后端受控文件挂载中。
- 患者端普通构建使用 `https://andrewdental.cn`。公共和私有项目设置均为 `urlCheck=true`，不使用 localhost 构建或跳过域名校验充当正式验收。
- 通过真实 `wx.login` 和后端 `code2Session` 登录；真实云库中的虚构患者申请、前台批准绑定、患者预约/取消、管理端读取、浏览器确认到诊、患者刷新状态及到诊后取消拒绝均已执行。
- 解绑后旧登录会话直接请求患者资料得到 403；正常重新申请及前台批准后恢复同一虚构档案。测试会话退出后旧令牌返回 401。全过程无伪造微信主体或患者会话。
- 开发预览二维码已生成，负责人手机确认“能进入，登录、本人档案和预约记录均正常”。这是手机基础访问结果，不等于手机端已重新执行全部预约业务分支。

证据：`docs/verification/cloud-integration-20261124/patient-admin.json`、`identity-edges.json`、`device-confirmation.json`。仅使用负责人明确批准的虚构资料；账号、诊所、牙医、患者等均带云端联调或虚构标记，不是实际机构/人员核验记录。

## 演示操作

管理端访问 https://andrewdental.cn，全模块演示使用 `cloud-demo`。独立角色为 `cloud-frontdesk`、`cloud-dentist`、`cloud-cashier`；`cloud-admin` 是初始总部配置账号。所有密码独立生成，见本机 `D:\secrets\AndrewDental\CloudIntegration\云端联调登录资料.txt`，不能使用本机旧演示密码。

微信开发工具导入原 `apps/patient-miniprogram` 项目。正式域名构建命令：

```powershell
& .\tmp\toolchains\node-v24.22.1-win-x64\node.exe apps/patient-miniprogram/scripts/build.mjs
```

不能使用 `--local-preview` 测试正式域名；它会把产物重新指回 localhost。`Start-LocalIntegration.ps1` 是之前的本机联调入口，不用于启动当前云端演示。

用有开发权限的微信扫描开发预览二维码。已绑定的测试微信可直接查看本人资料及记录；其他微信登录成功后仍需单独申请并由前台核验，不能因为登录成功而自动获得原测试患者资料。二维码过期时重新执行 CLI `preview`，不把扫码过期视为业务接口失败。

需要复验自动化时，先确认调试端口 9420 连接当前正式域名版本。以下首绑/业务复验脚本要求工具当前微信持有该测试患者的绑定：本轮换号后绑定已转到第二个微信，应使用第二个微信授权工具，或由前台按正常流程核验换回后再执行，不能直接批准覆盖当前关系。

```powershell
& .\tmp\toolchains\node-v24.22.1-win-x64\node.exe tools/deployment/check-cloud-patient-admin.mjs
& .\tmp\toolchains\node-v24.22.1-win-x64\node.exe tools/deployment/check-cloud-identity.mjs
```

这两个脚本会在专用云端虚构资料上创建预约、处理状态和测试绑定，请勿对真实业务库运行。身份测试正常结束会恢复当前测试患者的本人绑定，保留全部审计与历史。出现中断须核对已提交结果，不能直接修改映射表。

## 剩余验收

两个真实微信之间的换号已实际通过。第二个微信提交申请，前台正常 rebind 后，原微信仍登录但资料和预约接口403；负责人确认第二个手机微信能看到原档案与预约记录。当前档案保留在第二个微信，没有自动换回。证据 `rebind.json` 已记录手机读回结果。

绑定页提交后的状态及重复提交控制已修复，30项患者端测试和原生编译通过；清理本项目编译缓存后，真实微信工具已确认等待核验界面显示明确、加载结束且不会自动绑定。截图与状态见 `binding-pending.png`、`binding-ui.json`。开发预览包是生成时的快照，旧二维码不会自动获得后续界面修复，新预览见 `tmp/cloud-integration-20261124/device-preview-final.png`。

T051本轮在虚构资料云端联调范围已通过。尚未完成的是后续T052—T056及负责人自行办理的小程序ICP；小程序正式版发布仍按后续发布审核推进。

首个真实诊所/员工的初始化需另行提交实际核实资料。当前虚构总部初始化不能当作真实运营人员核验。后续生产发布、真实资料启用和 T055 发布审核仍按原任务处理。
