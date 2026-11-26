# Maven Central TLS 排查记录

排查日期：2026-11-10（Asia/Shanghai）。范围：继续 T001 的环境阻塞排查；本记录不代表 T001 完成，不变更已批准版本、业务设计、审批历史或任务勾选状态。

## 结论与修复方式

原先的 “The SSL connection could not be established” 来自 Windows 沙箱内的 PowerShell HTTPS 请求。展开内部异常为 `System.ComponentModel.Win32Exception: 安全包中没有可用的凭证`；同一环境下 Windows curl 进一步定位到 `schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS (0x8009030E)`。

在获准的沙箱外执行同样的 PowerShell 和 curl HEAD 请求，两者均返回 HTTP 200，未更改证书、TLS 协议、代理或 URL。由这组对照实验可将本次失败定位到沙箱执行上下文中 Schannel 获取凭证的环节；没有证据支持把它归因于 Maven Central 证书失效。未进一步确定沙箱底层具体令牌或安全策略，不将该推断写成已证实事实。

处理方式：需要 Windows Schannel 的联网命令通过工具的 `require_escalated` 审批机制在沙箱外执行；用户在普通 PowerShell 中可直接运行诊断脚本。不关闭沙箱全局保护，不使用 `-k`、`SkipCertificateCheck` 或 Maven 的 insecure/allowall 参数，不导入未知根证书，不切换 HTTP 或第三方镜像。

Microsoft 对该错误码的定义见 [AcquireCredentialsHandle (Schannel)](https://learn.microsoft.com/windows/win32/secauthn/acquirecredentialshandle--schannel)。错误码定义与本机实测需区分：沙箱相关性来自本次相同请求的对照结果。

## 已取得的网络证据

| 检查 | 执行环境 | 结果 |
| --- | --- | --- |
| DNS 解析 repo.maven.apache.org | 沙箱内 | 成功，IPv4 104.18.18.12 / 104.18.19.12 |
| PowerShell HEAD Maven Central 根目录 | 沙箱内 | TLS 初始化失败，内部错误“安全包中没有可用的凭证” |
| Windows curl HEAD 同一 URL | 沙箱内 | curl 35，Schannel 0x8009030E |
| PowerShell HEAD 同一 URL | 经批准的沙箱外 | HTTP 200 |
| Windows curl HEAD 同一 URL | 经批准的沙箱外 | HTTP 200，证书校验保持开启 |
| 以下五个制品 HEAD | 经批准的沙箱外 | 全部 HTTP 200 |

制品基址为 `https://repo.maven.apache.org/maven2/`：

- `org/springframework/boot/spring-boot-starter-parent/4.1.2/spring-boot-starter-parent-4.1.2.pom`
- `org/mybatis/spring/boot/mybatis-spring-boot-starter/4.1.0/mybatis-spring-boot-starter-4.1.0.pom`
- `org/mybatis/mybatis-spring/4.1.0/mybatis-spring-4.1.0.pom`
- `org/mybatis/mybatis/3.5.19/mybatis-3.5.19.pom`
- `org/apache/maven/apache-maven/3.9.16/apache-maven-3.9.16-bin.zip`

WinHTTP 显示 Direct access；当前进程没有代理环境变量。以上不排除网络基础设施中的透明代理，也不需要该假设解释本次对照结果。

## 工具隔离与复现

发现系统命令 `mvn` 指向 `D:\java\apache-maven-3.9.11\bin\mvn.cmd`，而 `MAVEN_HOME` 指向 `D:\java\apache-maven-3.9.11-bin`；用户 Maven settings 的 localRepository 为 `/opt/maven/repository`。这些是额外的环境一致性问题，不是已证实的 Schannel 故障原因。本次未修改用户 settings、PATH、MAVEN_HOME 或全局 Maven 安装。

项目内诊断目录为 `tmp/maven-tls-probe/`：

- `Get-ApprovedMaven.ps1`：从官方 Central 下载已批准的 Maven 3.9.16 与 SHA-512，核对一致后才解压；仅写入本目录。
- `Test-MavenResolution.ps1`：显式调用该 Maven，使用本目录的干净 settings 与独立 repository，启用 strict-checksums，运行依赖解析和依赖树输出。保留 Java 默认的 HTTPS 主机名和信任链验证。
- `pom.xml`：仅用于诊断的隔离 POM，使用 Boot 4.1.2 parent 和 MyBatis Starter 4.1.0；不属于应用业务实现。
- `maven-download.json`、`resolution.log`、`resolution-result.json`、`dependency-tree.txt`：下载校验及解析实测证据。

在项目根目录的普通 PowerShell 中复现：

```powershell
& '.\tmp\maven-tls-probe\Get-ApprovedMaven.ps1'
& '.\tmp\maven-tls-probe\Test-MavenResolution.ps1'
```

Codex 内第一条命令须通过获准的沙箱外执行方式运行；第二条命令以实际 Java/Maven 网络结果为准，不能把 Schannel 探测失败直接当成 Maven 下载失败。

Maven 3.9.16 ZIP 的实测 SHA-512（已与官方 `.sha512` 一致）：

```text
ed41650d42485cfc243fad22158caf9cbb5dc408ce7a09ddb94dd42a019de929ca43065bfa450612cf12bf78b5cafa3884b96c090de326ff590448c933454af3
```

## Java/Maven 实测结果

Java 21.0.9 + Maven 3.9.16 在沙箱内运行 `dependency:resolve` 和 `dependency:tree` 成功，退出码 0，日志为 `BUILD SUCCESS`。开始时间 10:30:10，结束时间 10:34:25（Asia/Shanghai），Maven 报告耗时 04:12 min。首次使用独立空缓存，最终包含 83 个 JAR（含诊断插件依赖，不等于应用直接依赖数量）；所有 `_remote.repositories` 的制品来源标识均为 `central`。

实际依赖树确认：

| 组件 | 实际解析版本 |
| --- | --- |
| Spring Boot starter / autoconfigure | 4.1.2 |
| Spring Framework core / context / JDBC | 7.0.10 |
| MyBatis Spring Boot Starter / autoconfigure | 4.1.0 |
| MyBatis-Spring | 4.1.0 |
| MyBatis | 3.5.19 |

没有 `MAVEN_OPTS`、`JAVA_TOOL_OPTIONS`、`_JAVA_OPTIONS` 或 `JDK_JAVA_OPTIONS` 环境覆盖。没有为成功结果放宽 TLS 校验。部分传递 POM 声明了其他仓库，其未命中记录存在于缓存；最终下载来源均为 Central，不能把这些 `.lastUpdated` 文件单独视为 TLS 失败。

归档证据（本目录）：`maven-central-resolution.log`、`maven-central-resolution-result.json`、`maven-central-dependency-tree.txt`、`maven-central-download.json`；`maven-central-tls-validation.json` 记录证据文件 SHA-256、静态检查及未变更基线核对结果。

本次网络问题已定位，并验证了安全可用的下载路径。未修改全局安全策略，所以沙箱中的 Schannel 调用仍应使用上述获准的执行方式。不得将 HTTP 200、下载校验通过或依赖解析通过等同于应用编译、启动、Mapper 加载或数据库集成测试通过；T001 仍需其完整验收证据。
