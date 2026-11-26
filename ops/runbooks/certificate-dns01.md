# ICP等待期间：只准备DNS TXT证书验证

2026-11-24 状态更新：负责人确认域名 ICP 通过，完成 A 记录及80/443配置，并同意 Let’s Encrypt 条款、选择不填邮箱。实际已采用 **Certbot standalone HTTP-01** 签发正式证书，正常TLS及自动续期 dry-run通过；没有使用以下历史手动DNS-01预案。当前操作见 [部署手册](deployment.md) 及 `docs/verification/cloud-integration-20261124/certificate-renewal.json`。以下为等待备案阶段的历史方案，不再作为当前阻塞。

2026-11-14负责人明确：备案审核中，暂不将正式域名解析到大陆服务器、不开放正式网站；保留已完成镜像/SSH/持久化配置。正式DNS、HTTPS公网访问与真实微信合法域名验收均等待ICP。这里不执行申请、不开放80/443，也不表示已经获得证书。

DNS-01使用 `_acme-challenge.andrewdental.cn` 的TXT记录验证域名控制权，验证流程查询DNS而不是访问网站。因此可以在不把A记录指向大陆主机、不开网站端口的情况下准备/办理证书；实际仍要能管理权威DNS并完成TXT验证。[Let's Encrypt官方DNS-01说明](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge)

可选执行方案为Certbot的交互式`certonly --manual --preferred-challenges dns`：指定andrewdental.cn、实际联系人邮箱，以及本地D盘或服务器私密目录内的独立config/work/log路径。操作前由负责人确认ACME账号/服务条款和实际DNS管理权限；目前没有虚构邮箱、账号、TXT值或签发结果，也未安装/运行新证书工具。

1. 在受控运维环境生成申请，工具给出本次真实TXT名称和值；不得照抄示例或重用过期挑战。
2. 负责人在实际DNS管理控制台添加指定TXT，保持正式A/AAAA不指向服务器。通过权威DNS和外部查询核对传播，再继续ACME验证。
3. 成功后核实证书链、SAN为andrewdental.cn、有效期及私钥匹配。私钥只保存在私密目录，按既有Compose秘密挂载使用，不写源码/镜像/聊天。
4. 证书成功也不启动公网网站。备案通过、负责人允许正式解析和访问后，才继续T050公网证书/代理/健康检查与T051合法域名/wx.login真实联调。

手动DNS挑战续期也需要DNS操作；后续是否采用DNS服务商API自动续期另按实际权限配置，不假定已有DNSPod API密钥或擅自给全域名写权限。本地localhost自签名证书仅供Windows预览，不作为正式域名或微信验收证据。
