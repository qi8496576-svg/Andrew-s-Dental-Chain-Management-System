# Linux 隔离联调部署

2026-11-24 当前运行状态已更新：同一云端数据库及项目已切到正式域名 https://andrewdental.cn，可信证书、443入口及当前候选验证通过；仍仅承载明确标记的虚构联调资料，不代表 T055 生产发布。当前运行/回滚与证据见 [部署手册](deployment.md)。以下为此前隔离准备与11月18日回环阶段的历史记录，不要再次运行拒绝已有卷的首次启动脚本。

目标登记在 `ops/config/tencent-environment.json`；2026-11-14只读检查为Ubuntu24.04.4/x86_64，2核/约2GB/50GB盘，目录原不存在，已通过官方签名仓库安装Docker并创建专用目录。没有覆盖旧项目，没有开放新端口或启动生产服务。SSH首次主机密钥指纹已记录，仅TOFU，未虚称与云控制台独立核对。

该主机用于功能联调，不满足Q03的应用、数据库各4核8GB条件。备案审核期间继续本地业务开发、构建与隔离准备；尚未验证备案完成、域名解析、实际公网证书或微信合法域名。不能用localhost自签名证书的本地通过代替这些项目。

先使用现有工具完成后端定向测试并`mvn -DskipTests package`，以及已通过类型/构建的Web产物；随后以 `ops/compose/compose.prod.yaml` 构建。Docker上下文仅包含打包主程序、Web dist和Nginx模板，不包含测试类、Word、秘密、node_modules或本机缓存。Java21和非root Nginx基础镜像以实际拉取的不可变摘要固定；不改变已批准Java/Spring/MyBatis/MySQL版本。

必须从受控外部目录配置以下环境，不把秘密写入仓库、命令参数或聊天：

| 输入 | 用途 |
| --- | --- |
| ADC_BACKEND_IMAGE / ADC_ADMIN_IMAGE | 已验证候选镜像，发布时锁定候选ID/摘要 |
| ADC_MYSQL_ROOT_PASSWORD_FILE | 独立数据库操作密码文件 |
| ADC_MIGRATION_PASSWORD_FILE | 独立迁移密码文件 |
| ADC_BACKEND_SECRETS_DIR | 仅含spring.datasource.password、adc.auth-secret、adc.wechat.app-secret三个配置树文件的绝对目录 |
| ADC_WECHAT_APP_ID | 实际小程序AppID；不接受本地smoke标记作为云联调配置 |
| ADC_DOMAIN | 精确域名，不含协议/路径 |
| ADC_TLS_CERTIFICATE_FILE / ADC_TLS_PRIVATE_KEY_FILE | PEM链及匹配私钥 |
| ADC_HTTPS_BIND / ADC_HTTPS_PORT | 默认127.0.0.1:8443；对外启用前显式核实主机/云防火墙及备案可达条件 |
| ADC_HTTPS_ORIGIN_PORT_SUFFIX | 默认空；仅非443联调显式填写端口，与Origin一致 |

数据库密码使用至少32随机字节的Base64。认证签名秘密同样至少32字节Base64。Linux宿主秘密父目录0700，只给运维读取；挂载给非root的文件须有容器UID可读权限（本机Compose文件挂载不会替你实现uid/gid重映射），可采用父目录0700、只挂载指定文件的0444权限，确保其他宿主用户无法穿过父目录。禁止为解决权限问题开放宿主秘密目录。后端将三个秘密文件分别挂到/run/secrets的配置树，不把0700宿主父目录整个挂给非root进程；operator为仅database网络的独立一次性作业，不复用有固定代理地址的backend服务，也不读取微信/签名秘密。Compose本身只保留路径和非秘密标识；不要把展开后的运行环境发到聊天。

启动顺序为MySQL健康→仅空卷初始化三个schema及原数据库角色/独立用户→独立migrator完成33份既有迁移→一次性runtime-grants应用原逐表权限→后端就绪→Web代理。应用始终flyway.enabled=false、SQL init never；runtime无DDL、审计无修改/删除、迁移历史只读。数据库只在内部网络，root秘密只在数据库及一次性权限作业挂载，后端只获runtime密码。mysql/data为显式命名卷，不发布3306；不执行down -v、clean或repair来处理真实环境故障。

后端10001、Web101运行，只读根目录、仅/tmp临时写入、drop ALL/no-new-privileges。MySQL官方入口仅初始化阶段使用其必要的root流程。小主机的内存限额是联调配置，不是降低Q03标准。独立备份介质和Q05恢复链仍须落实，命名卷本身不是备份。

HTTPS唯一入口为Web8443。Nginx覆盖X-Forwarded-For/Proto并清除其他转发链；后端只信任独立ingress网络172.29.217.10的原生转发，后端8080和运维9091不映射宿主。启用前核对该子网与现有Docker/云网络没有冲突；如必须变更，应同时修改精确代理地址并重新验证，不能改为信任所有代理。`/live`和`/ready`只存在独立运维端口，不新增公开业务API，前者区分进程、后者检查真实数据库迁移就绪；错误不返回SQL/连接/秘密。

本地可用 `tools/verification/container-smoke.mjs` 创建自己的随机项目/测试秘密/自签名localhost证书，实际运行Linux镜像、迁移、生产配置校验、打包运维命令、HTTPS会话及真实Vue排班预约，再仅销毁自己刚创建的容器/卷。该脚本不能接受外部数据库或拿真实配置替代测试配置；产物明确real_wechat_verified=false。

真实隔离目标先检查目录、监听端口、现有卷/容器和需要保留的数据，再上传新候选到独立版本目录，校验文件/镜像摘要；没有完整秘密/证书时不启动伪造生产配置的应用。部署就绪需在真实域名验证证书/主机名、HTTPS、可信转发、健康检查、真实微信连通性，保存脱敏结果后才勾选T050/T051。生产发布仍需后续发布审核，不由本手册自动授权。

参考：[Docker官方Ubuntu安装](https://docs.docker.com/engine/install/ubuntu/)、[Spring Boot可信代理与部署](https://docs.spring.io/spring-boot/how-to/deployment/cloud.html)。实际本地/远端日志与状态分别在docs/verification/database/container-smoke.*及tencent-*.log；未通过项目不得写成通过。

## 2026-11-18：备案前的云端本机隔离联调

负责人已批准继续推进不依赖正式域名的T050—T053。先只读核实服务器没有旧容器/业务卷，再复用已归档候选 adc-20261114-1794653395719（不是重新打包后的最新本地UI），以项目 adc-isolated-loopback 启动。33份迁移、逐表权限及前端/后端/MySQL健康检查通过，原镜像ID不变。受控首次启动脚本 ops/scripts/start-loopback-integration.sh 拒绝已有项目/数据库卷/证书目录，不充当覆盖或重初始化入口。

仅开放服务器自身127.0.0.1:24443；没有新增80/443公网监听、DNS解析或云防火墙规则。证书为 /opt/andrew-dental/private/LoopbackTLS 内新建的 localhost 本机测试证书，不是正式域名证书。命名卷 adc-isolated-loopback_mysql_data 已开始持久化；不执行 down -v，不因未初始化员工账号而重建卷。配置/秘密仍来自原Deployment受控目录。

tools/verification/check-cloud-loopback.mjs 以严格主机密钥检查创建临时本机SSH隧道，使用服务器测试证书作CA并验证localhost主机名：页面200、匿名/me为401、空微信凭证为400。验证后关闭它创建的隧道；不会留下无期限本机监听。结果见 docs/verification/tencent-loopback-readiness.json，启动过程见 tencent-loopback-start.log。必要时复测该只读检查，不要重跑首次启动来维护已有环境。

如需人工访问，可由负责人使用既有私钥及 tmp/tencent-known-hosts 建立 `ssh -N -T -o ExitOnForwardFailure=yes -L 127.0.0.1:24443:127.0.0.1:24443 ubuntu@43.139.92.113`，同时显式指定既有私钥和known_hosts，核实服务器指纹；访问 https://localhost:24443。仅为测试证书，不将浏览器例外当作正式HTTPS或微信域名验收。云库尚无业务员工账号或患者，不提供假的默认管理员；首位总部须按已批准受控初始化流程另行核验，不能复制本地演示密码或自动授予云端权限。

暂停隔离服务时只停止 adc-isolated-loopback 的admin/backend，保留MySQL和卷；恢复时按MySQL健康→backend健康→admin的顺序启动既有容器，不重新迁移/改秘密。若迁移失败，保留失败现场并按database-migrations.md处理，不自动clean/repair，不覆盖已有库。正式升级仍使用候选审核与独立迁移流程；本次不授权生产发布。

T050仅本阶段子项通过，正式域名/证书/公网可达及独立备份介质待完成；T051正式合法域名/真机与完整身份链仍待验收，不能将空凭证400当作真实微信登录通过。
