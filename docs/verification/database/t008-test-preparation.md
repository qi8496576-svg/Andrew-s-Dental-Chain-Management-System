# T008 数据库验收测试准备

2026-11-11：已编写 SchemaBaselineIT、DatabasePrivilegesIT，执行 Maven test-compile 成功（见 ../t008-test-compile.log）。未运行真实结构/权限验收，未声明业务表已创建。

测试读取已冻结的原业务 schema.json 和 technical-schema.json，不复制改写业务字段。覆盖精确表集合、类型/可空、PK、普通/组合UK、30+19 FK、无新增生成列、InnoDB、三个Schema、12项APP引用计数及迁移版本/成功状态。普通UK期待值由原DBML和技术字典生成，NORMAL条件唯一及唯一发布不伪造为无条件UK。

CHECK测试验证数据库存在已启用约束及所需字段/枚举覆盖；这不是任意等价SQL的形式证明。具体非法数据、日期/金额边界与跨表事务语义在T043及各故事测试中真实验证。禁止把仅覆盖关键词解释为所有规则执行正确。

权限测试以零行语句检查审计和迁移历史的写入拒绝，并要求MySQL权限错误码，不能用不存在表的错误冒充权限拒绝。DDL探针仅可在可丢弃测试库执行；若配置错误允许创建探针表，立即失败并丢弃整个测试实例，不能复用到生产。

T043负责建立可丢弃MySQL、执行bootstrap与全量迁移、授予测试账号角色后运行这两个IT。连接参数为adc.schemaTest.url、adc.schemaTest.isolated=true、adc.schemaTest.inspector.user/password、adc.schemaTest.runtime.user/password；不填即失败，不静默跳过。使用T006的固定MySQL镜像/UTC/大小写约定，不能指向持久开发或生产库。账号密码临时随机生成，不记录到证据。此阶段不运行完整verify以免将预期未建表失败混为T001—T006回归。
