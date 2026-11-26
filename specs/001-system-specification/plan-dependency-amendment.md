# 已批准的依赖版本补充变更

| 项目 | 记录 |
| --- | --- |
| 变更编号 | ADC-PLAN-20261109-DEP01 |
| 日期 | 2026-11-09 |
| 原批准基线 | ADC-PLAN-20261107-01，原plan-approval.md/json保留 |
| 批准主体 | 本聊天项目负责人 |
| 授权依据 | 上一轮提交的兼容核实结果和最小修改方案；用户明确回复“批准” |
| 批准范围 | Starter 4.0.0→4.1.0，明确传递依赖MyBatis-Spring 4.1.0、MyBatis 3.5.19；保留Java21/Boot4.1.2，Maven3.9线锁定3.9.16；同步R-D01、Plan、指南、T001及其机器目录、校验指纹 |
| 实施授权 | 尚未授权；本次批准仅针对依赖版本及相关文档修改 |
| 验证边界 | 官方依据已核实；本次仅静态一致性检查，未解析依赖、构建、启动或执行业务测试 |
| 阶段边界 | 未重新执行Specify、Clarify、Plan、Tasks、Analyze；此前Analyze结论保留为旧版本记录，不宣称覆盖本次新依赖组合 |

推荐完整组合：Java 21 LTS + Spring Boot 4.1.2 + MyBatis Spring Boot Starter 4.1.0 + MyBatis-Spring 4.1.0 + MyBatis 3.5.19 + Maven 3.9.16。JDK发行版补丁/镜像摘要在T001锁定，Spring依赖由Boot4.1.2 parent/BOM管理。

官方依据：[兼容分支说明](https://github.com/mybatis/spring-boot-starter#requirements)、[4.1.0正式发布说明](https://github.com/mybatis/spring-boot-starter/releases/tag/mybatis-spring-boot-4.1.0)、[4.1.0发布POM](https://raw.githubusercontent.com/mybatis/spring-boot-starter/mybatis-spring-boot-4.1.0/pom.xml)、[Boot系统要求](https://docs.spring.io/spring-boot/system-requirements.html)、[Maven版本记录](https://maven.apache.org/docs/history.html)。发布POM使用Boot4.1.0构建；Boot4.1.2属于对应4.1线，具体应用组合待T001及后续既定集成验证。

总体架构、三物理Schema、原19表/163字段/30业务外键、业务规则/验收及186项任务依赖保持。没有新增业务代码、业务需求或数据库字段。旧任务生成脚本保留历史内容并禁止直接运行，避免覆盖现行人工修订。

历史批准与状态同步记录不重写；本次独立记录文件前后指纹，见 [plan-dependency-amendment.json](plan-dependency-amendment.json)。本变更记录是文档变更批准凭据，不代替后续最终Implement授权。
