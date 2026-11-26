# T001 后端构建环境与兼容验证

日期：2026-11-10（Asia/Shanghai）。核验人：Codex，执行项目负责人已明确授权的 Implement；记录工具输出，不代替负责人业务验收。

## 已锁定的环境

| 组件 | 版本及来源 |
| --- | --- |
| 本机 JDK | Oracle Java 21.0.9，build 21.0.9+7-LTS-338，`D:\jdk-21` |
| Maven / Wrapper | Maven 3.9.16；官方 Wrapper 3.3.4，only-script；ZIP SHA-256 已写入 `.mvn/wrapper/maven-wrapper.properties` |
| Spring Boot parent / plugin | 4.1.2 |
| MyBatis Starter / MyBatis-Spring / MyBatis | 4.1.0 / 4.1.0 / 3.5.19 |
| Spring Framework / Security | Boot BOM 管理：7.0.10 / 7.1.2 |
| Connector/J / Flyway | Boot BOM 管理：9.7.0 / 12.4.0；Flyway core 与 mysql 模块同版本 |
| JUnit Jupiter / Testcontainers | Boot BOM 管理：6.0.3 / 2.0.5 |
| Linux Java 21 运行镜像 | Eclipse Temurin `21.0.9_10-jre-jammy`，Linux amd64 manifest `sha256:5cbbc80ec3f79faeba17a0551a77b260040da7a9e3b398dac0e681e84a4d8032` |

本机和容器发行版分别记录，未宣称二者是相同 vendor/build。镜像摘要已从官方 registry 核实并冻结，见 `t001-runtime-image.json`；尚未运行容器，容器行为仍须 T002/T178 实测。数据库保持 MySQL 8.4，不能将 Connector/J 客户端版本误记为数据库服务器版本。

官方工具依据：[Maven Wrapper](https://maven.apache.org/tools/wrapper/index.html)、[Wrapper checksum 参数](https://maven.apache.org/tools/wrapper/maven-wrapper-plugin/wrapper-mojo.html)、[Spring Boot 4.1 测试 API](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/webmvc/test/autoconfigure/AutoConfigureMockMvc.html)。版本线批准仍使用 ADC-PLAN-20261109-DEP01；本次未重做选型。

## 实现边界

`backend/pom.xml` 使用 Boot parent 管理依赖，不手工混配 Spring 版本。Enforcer 检查 Java 21、精确 Maven 3.9.16 和依赖收敛；Failsafe 已配置供后续真实 MySQL IT 使用。没有 Hibernate/JPA 自动建表、Spring Session JDBC 隐式表或业务迁移。

主程序为 `com.adc.AdcApplication`。身份故事尚未完成时，`BootstrapSecurityConfiguration` 拒绝全部请求，禁止默认登录页、HTTP Basic 和默认内存用户。它不是 SF01—SF04 的完成实现；后续任务按已批准身份契约替换这层启动保护。

运行配置要求外部提供数据库 URL、账号和口令，不包含默认共享密码。运行时禁 Flyway/SQL 自动初始化；迁移参数预留三个已批准 schema，实际迁移入口和权限属于 T009。

## 测试设计与已观测结果

`BuildSmokeTest` 使用 test scope 的禁止连接 DataSource，任何实际 `getConnection()` 都抛错；不连接真实数据库，不使用 H2/SQLite 假冒 MySQL。Mapper 接口和 XML 仅在 test scope，生产 JAR 不包含测试 Mapper 或测试 SQL。

| 测试 | 期望 | 首次实际结果 |
| --- | --- | --- |
| embeddedServerStartsAndRejectsAnonymousHttp | 启动真实嵌入式 HTTP 服务，匿名 GET `/api/v1/me` 返回 403 | 通过 |
| starterCreatesMapperAndParsesXmlWithoutOpeningDatabase | Starter 创建 Mapper 代理，解析 XML statement，绑定 SQL 为 SELECT 1，无数据库连接 | 通过 |
| unfinishedIdentityCannotExposeApiOrDefaultLogin | 匿名 API、默认登录页、员工登录写入口均拒绝 | 通过 |

首次测试及 Wrapper clean verify 复验均为：3 项、0 失败、0 错误、0 跳过；版本/依赖收敛检查通过。最终 Wrapper 构建于 2026-11-10 10:54:39（Asia/Shanghai）结束，退出码 0、BUILD SUCCESS，effective POM 和完整依赖树均已导出并核对上述版本。T001 完成。

打包产物：`backend/target/adc-backend-0.1.0-SNAPSHOT.jar`，SHA-256：`2b216b4f5db7a7ec9139df48f6aeb0f837efb399a7d08559c1650ef7f817cb93`。Failsafe 报告当前没有 IT 可执行，不将它计为真实数据库集成测试通过。测试框架在 Java 21 输出 Mockito 动态 agent 提示，不影响本次结果；未通过隐藏告警或放宽检查使测试通过。

## 可重复执行入口

从项目根目录运行：

```powershell
& '.\tools\verification\Verify-BackendBuild.ps1'
```

脚本显式调用项目 Wrapper、干净的项目 settings 和项目临时缓存，不依赖全局 Maven 3.9.11 或用户 settings 中的 `/opt/maven/repository`。本次为复用已验证缓存，使用了 `-Repository '<项目根目录>\tmp\maven-tls-probe\repository'`；默认新缓存位于 `tmp/maven-repository`。两种缓存都不作为版本来源，版本由 POM、BOM、Wrapper URL 和校验值确定。

Wrapper 首次下载在 Windows 沙箱中可能遇到已查明的 Schannel 凭证限制；应按 `maven-central-tls.md` 经批准在沙箱外完成引导，不关闭证书校验。引导完成后 Java/Maven 已能在沙箱内正常联网。

本次归档证据：`t001-build.log`、`t001-build-result.json`、`t001-effective-pom.xml`、`t001-dependency-tree.txt`，以及 `backend/target/surefire-reports/`。进入 T002 后脚本增加了 `-EvidencePrefix` 参数，默认 `backend-build`；后续运行用独立前缀，保留本次证据。新增的真实 MySQL IT 属于 T002，在没有 Docker 的环境中会失败，不能跳过后宣称完整构建通过。生产发布、真实身份、真实数据库、Linux 容器、业务正确性、性能和恢复均不在本次冒烟结论内。
