# 独立数据库迁移

运行应用不会自动建表：application.yaml 已禁用 Flyway 与 SQL init。迁移由独立 MigrationMain + compose.migrate.yaml 执行，复用获批 Boot BOM 的 Flyway 12.4.0，不另选CLI版本。固定三个Schema，历史位于adc_identity，禁止createSchemas、clean与baselineOnMigrate；入口不接受clean/repair参数。

1. 在隔离环境由数据库管理员运行mysql/bootstrap.sql，建立三个Schema和两个最小权限角色。初始化不创建业务表。账号和随机密码通过受控秘密供应建立：adc_migrator授予adc_migration_role并设为默认角色；应用账号授予adc_runtime_role并设为默认角色。不得将管理员账号提供给应用或迁移进程，不将真实密码写入SQL源文件。
2. 构建backend的Boot JAR；配置ADC_MIGRATION_URL、ADC_MIGRATION_PASSWORD_FILE、ADC_DATABASE_NETWORK。容器通过数据库内网名连接，密码通过文件挂载。Windows开发秘密和Docker数据继续存D盘。
3. 执行`docker compose -f ops/compose/compose.migrate.yaml run --rm migrate`。保存退出状态、Flyway版本/迁移清单与结构导出，不保存秘密。所有业务DDL须使用adc_business限定表名；技术DDL使用各自Schema。
4. 迁移成功后由管理员运行mysql/runtime-grants.sql；应用仅SELECT迁移历史，审计仅INSERT/SELECT。执行T043结构/权限测试，任一失败不得启动业务交付。T008的测试准备通过不代表本步骤通过。

MySQL DDL会隐式提交，迁移失败不能依靠事务整体回滚。失败后停用应用写入，保留Flyway失败行、日志、SHOW CREATE TABLE及备份点；先判断已提交DDL与预期差异，再由负责人审批恢复备份或前向修复。不得自动clean、盲目repair、删除迁移历史或改写已应用脚本。生产迁移前完成备份与恢复验证，独立迁移账号使用后收回/禁用。TD-01未确定前不启用技术记录清理。

当前入口和权限脚本属于T009准备产物，业务/技术建表由T010—T042提供，完整迁移运行与结构验收属于T043。
