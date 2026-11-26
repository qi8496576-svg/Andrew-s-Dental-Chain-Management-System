# SF01 登录与退出批次

2026-11-11，ADC-TASKS-20261111-03：T015、T016完成。真实微信平台/开发者工具联调尚未执行，保留T051；本地临时自签名HTTPS用于浏览器测试，不代表生产TLS或部署验收。

| 实际验收 | 结果 | 证据（docs/verification/database/） |
| --- | --- | --- |
| 限流边界、成熟Argon2id、官方HTTP适配器及生产拒绝测试提供方 | 4项通过 | wechat-adapter-green.log |
| CSRF签名/到期/Origin及无默认账号启动 | 5项通过 | web-protection-green.log |
| 员工/患者身份、并发首次登录、二进制精确匹配、5错15分钟、到期、停用、注销、审计故障回滚 | 真实MySQL 5项通过 | authentication-final.log |
| 完整Security链与真实MySQL的Cookie、CSRF轮换、严格输入和注销闭环 | 1项通过 | authentication-http.log |
| Web类型、构建及单元测试 | 类型/构建通过，8项测试通过 | admin-auth-types.log、admin-auth-build.log、admin-auth-tests.log |
| 小程序页面/资产构建及SDK边界测试 | 构建通过，5项测试通过；未使用真实AppID | mini-auth-build.log、mini-auth-tests.log |
| HTTPS页面→真实后端→真实MySQL浏览器闭环，无API Mock | 4项通过，0跳过 | authentication-browser.log、authentication-browser-integration.log |

Given已核实员工与有效口令，When经签名预认证CSRF及精确Origin登录，Then签发Secure/HttpOnly/SameSite=Lax Cookie、轮换CSRF且只存令牌摘要；刷新后仍能读取当前最小身份。Given错误/未知/停用账号，When登录，Then统一拒绝且第5次失败限制15分钟；不泄露账号存在性。Given真实提供方边界的受控测试返回成功/错误，When服务端交换代码，Then只采用可信OpenID、精确匹配同一主体，未绑定不取得患者档案，失败无会话。Given已登录会话，When注销/停用/到期，Then下一请求拒绝；审计故障时不部分提交身份或会话。对应AC-SF01-01、AC-SF01-02及共享安全要求。

后端采用Spring Security的CSRF过滤器及Argon2id编码器；补齐其所需bcprov-jdk18on 1.86，沿用批准的19456KiB/迭代2/并行1/盐16字节/输出32字节。版本已实际解析和运行，不更改Java/Boot/MyBatis基线。依据：[Spring Security密码存储](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html)、[Bouncy Castle官方版本](https://www.bouncycastle.org/download/bouncy-castle-java/)。微信官方页面本轮访问失败，未虚构页面内容；适配器依据已批准code2Session契约，真实平台验证留T051。

截图：../authentication-login.png。正式Vue页面按已批准导航方案继续扩展；当前只显示实际已实现、已获授权的入口。小程序API_ORIGIN仍需实际合法HTTPS服务域名，未填假地址或放宽域名校验。
