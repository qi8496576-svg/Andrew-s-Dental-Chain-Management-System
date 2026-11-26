# T050 部署执行与当前就绪状态

## 2026-11-24 当前状态：T050 已实际完成

负责人确认域名 ICP 通过并授权 T050/T051。正式联调入口现为 https://andrewdental.cn，域名解析、Let’s Encrypt 可信证书、443 入口、证书续期 dry-run、四类员工页面及权限验收均已通过。现有云端项目名仍为 `adc-isolated-loopback`，沿用同一 MySQL 容器和卷；名称不再表示仅回环访问。最新候选见 `docs/verification/cloud-integration-20261124/candidate.json`。

变更前的三个 schema 一致备份保存在服务器私密目录，并通过加密 SSH 复制到本机独立设备，SHA-256 一致；完整 Q05 恢复链、RPO/RTO 实测仍属于 T054，不据此宣称通过。业务结构仍为19/163/30，33份迁移指纹前后相同。本次没有迁移或清空已有业务卷。

当前用途为负责人批准的**公开域名上的虚构资料联调**，没有完成 T055 生产发布审核，不接入真实患者资料。小程序 ICP 提交由负责人办理。

服务器运行配置在 `/opt/andrew-dental/private/IntegrationRuntime/runtime.env`，版本指针在同目录 `release`；文件只由受控运维读取，禁止输出展开环境。正常服务使用 Docker 的 `unless-stopped` 重启策略，管理端域名不依赖本机 Docker 或 SSH 隧道。本机 `Start-LocalIntegration.ps1` 仍只用于 localhost，不能用于启动云端。

证书由 `/etc/letsencrypt/live/andrewdental.cn` 管理，Certbot 定时续期；部署钩子 `/etc/letsencrypt/renewal-hooks/deploy/andrew-dental.sh` 更新已挂载文件并 reload Nginx。80端口供 standalone HTTP-01 验证，443服务业务，3306/8080/9091不发布到公网。

应用回滚入口为服务器 `/opt/andrew-dental/private/IntegrationRuntime/rollback.sh`，会恢复变更前应用镜像及127.0.0.1:24443入口，保留当前数据库；它不是数据库回滚，也不会删除测试资料或更改迁移历史。前端时间修复另保存了更新前的 `runtime.env.before-<candidate>`。回滚按具体故障范围执行，不能运行首次启动脚本或 `down -v`。

全模块演示账号 `cloud-demo`，密码见本机 `D:\secrets\AndrewDental\CloudIntegration\云端联调登录资料.txt`。独立岗位账号及首位虚构总部账号也在该私密文件中；与旧 localhost 演示口令不同。

证据：`docs/verification/cloud-integration-20261124/readiness.json`、`runtime-finalization.json`、`certificate-renewal.json`。微信步骤见 [正式域名联调手册](wechat-integration.md)。以下11月14日记录为历史准备阶段，保留追踪，不代表当前公网状态。

**最新负责人指令（2026-11-14）**：ICP审核中，不配置指向大陆服务器的正式A/AAAA、不开放正式网站。正式DNS、公网HTTPS及真实微信合法域名验收等待ICP；保留全部已有云镜像、SSH及持久化配置，不重部署。可继续本机预览和性能准备；TXT证书准备见certificate-dns01.md，本机地址/账号资料/小程序导入见local-preview.md。

2026-11-14：本地隔离Linux/Docker完整启动、真实MySQL迁移、运维命令、HTTPS会话、Vue新诊所排班预约及数据库故障就绪检查通过（`docs/verification/database/container-smoke.json`）。T048/T049完成，当前49/56；这不等于云HTTPS、真实微信或生产发布通过。

云目标及只读核对登记在 `ops/config/tencent-environment.json`。Ubuntu24.04.4、2核/约2GB/50GB；原`/opt/andrew-dental`不存在，已创建专用目录并安装官方Docker29.9.3/Compose5.7.1。未覆盖旧项目。首次SSH密钥仅按TOFU记录，不虚称已通过云控制台独立核对。

候选 `adc-20261114-1794653395719` 位于 `/opt/andrew-dental/releases/`。约395.5MB镜像包SHA-256为 `0090a9def88c3cedd7c2bdf16ed1f17ed21e76332737cff8e471ab9f42cca30c`。文件摘要及三个镜像ID/架构实际核对通过，日志 `docs/verification/tencent-candidate-offline-verified.log`。云端实际执行版本命令为Java21.0.13、MySQL8.4.13、Nginx1.30.6；未运行持久应用/数据库，最终容器/卷列表为空。

服务器到Docker Hub是TCP连接超时，不是已证实的TLS证书错误。已从本地获批来源导出同一镜像，经加密SSH传输、共同归档SHA核对后离线导入。MySQL导入后仓库引用丢失，但完整不可变ID仍为原 `sha256:72c368d898861f3b3a07af0e6d690400f44f048799ed46822783d9224cc2c86d`。只允许对此精确ID核验后使用 `compose.offline.yaml`，配合 `--pull never`；不换镜像、不放宽摘要、不用latest。原candidate.json及失败日志保留，离线补充清单为candidate-offline.json。

操作及配置边界见 [隔离部署细则](isolated-deployment.md)。真实微信、独立数据库及签名文件已通过SSH存入 `/opt/andrew-dental/private/Deployment/`；父目录0700，秘密逐文件只读挂载，未写入镜像、源码或日志。原始微信输入仍在本机D盘私密目录。78份Web/小程序构建文件已做不显示秘密内容的实际比较，结果无AppSecret（frontend-secret-boundary.json）。小程序已配置公开AppID及目标HTTPS域名，类型/6页构建通过，但wechat_runtime_verified=false。

当前状态：正式DNS、公网HTTPS和真实wx.login合法域名联调按负责人决定等待ICP；此前服务器resolver无域名记录是历史检查事实，当前不要求立即添加解析。备案通过并获准继续正式联调后，再添加 `@ / A / 43.139.92.113` 并实际验证HTTPS。不用localhost自签名通过勾选正式HTTPS。独立备份介质、Q03规定资源、Q05完整恢复、规定人员及真实季度仍按原任务验收，现主机不满足Q03各4核8GB条件。

后续只在实际输入齐备后执行：

1. 再核实新版本目录、文件/镜像摘要、主机路由与172.29.217.0/24无冲突、证书链/主机名/私钥匹配和秘密文件权限；不要打印展开配置或秘密。
2. 显式配置真实域名、文件路径和已验证候选镜像。普通线上路径用compose.prod.yaml；当前离线目标再加compose.offline.yaml，并禁止自动拉取。默认127.0.0.1:8443不对公网开放；真实公网联调需核实主机/云访问规则及实际443入口，不擅自改SSH或关闭防火墙。
3. 按MySQL健康→独立migrator→原runtime-grants→后端就绪→代理的既有顺序启动。应用不自动迁移；运行时无DDL。先验证 `/live` 与 `/ready` 的区别、可信代理范围、匿名拒绝及秘密无泄漏，再做真实HTTPS和微信联调；不得为联调使用假AppSecret、跳过urlCheck或冒充真实提供方。
4. 首份真实总部管理初始化及新诊所管理初始化须有实际核验文件。新诊所只能按已批准运维契约首次执行，禁止借此默认建管理员、虚构员工/诊所或自动扩展创建者权限。

发布/回滚：本候选未获生产发布授权。按T055审核前保持隔离；保留上一候选镜像、非秘密清单和可用备份链。兼容性得到验证时才切换应用镜像，数据库迁移不能随意向下回退；若数据库/审计/回执一致性有风险，停止受影响写入并先在新隔离目标恢复验证，按负责人批准的恢复步骤处理，不覆盖现有业务数据。禁止down -v、Flyway clean/repair、删除迁移历史或凭据重置来制造回滚成功。未完成Q05实测不能声称具备已验收恢复能力。
