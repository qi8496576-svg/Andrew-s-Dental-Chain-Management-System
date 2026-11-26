# 数据库基础批次与共享基础进度

执行依据：ADC-TASKS-20261111-03；负责人于本轮明确恢复Implement。T008—T012完成，T013进行中；T014尚未执行，不能将本文件作为基础门禁通过证据。

完成内容：复用T008—T010已有测试、迁移和映射，补齐可丢弃MySQL测试夹具、受限迁移账号及运行账号验证。V200新增原设计的30条业务FK、19条技术FK、20个普通/组合UK、28个单行CHECK；不增加字段或表。NORMAL条件唯一、跨行不重叠、唯一当前发布及12项APP引用仍由后续领域事务实现，不伪造物理键。

真实数据库为原锁定摘要的MySQL 8.4；19业务表/163字段/30FK、14技术表/110字段/19FK、3物理Schema逐项匹配。32份显式记录映射可加载，Patient仓储在真实MySQL验证日期、空值和时间点。Flyway历史由工具创建，字段、PK、普通success索引及33个迁移版本均实测；保留001形式的工具版本号。

| 验证 | 实际结果 | 证据 |
| --- | --- | --- |
| 32份MyBatis构造映射 | 1项通过 | mapping-build.log；constraints-final.log中MappingDefinitionTest |
| 结构、UK、CHECK覆盖、版本；历史表；跨连接锁与跨Schema回滚 | 6项通过、0跳过 | verified-foundation-subset.log |
| 患者映射/普通唯一、孤儿FK、排班时隙、五状态事实、治疗与明细金额、绑定双向唯一、R1非正利润零激励 | 3项通过、0跳过 | constraint-boundaries-final.log |
| 运行账号审计仅追加、历史只读、拒绝DDL和历史主体删除；允许必要INSERT | DatabasePrivilegesIT 1项通过 | constraints-green.log中该测试类；该轮整次构建曾因其他测试失败，不能称整次通过 |
| 独立迁移容器 | 1项通过、0跳过；33迁移成功 | migration-container-verified.log、migration-container-output.log |
| 精确金额、ID、R1、上海业务时区 | 4项通过、0跳过 | shared-values-green.log |

独立迁移容器使用获批Temurin摘要、10001非root用户、只读根文件系统、删除全部capability、临时/tmp及只读JAR/密钥挂载，连接仅有迁移角色的账号。测试密钥为随机隔离凭据，测试结束删除。初次镜像拉取历时约8分37秒；直接拉取同摘要后完成。初次测试复制JAR卡在Windows命名管道，后续Docker明确返回只读根文件系统不允许复制；改为与Compose一致的只读挂载后通过。未降低容器约束。

TDD记录：constraints-red.log真实捕获缺少FK/UK/CHECK的失败；后续发现并修正测试夹具MyBatis非dirty会话未强制回滚，以及迁移版本号被测试去掉前导零的问题。shared-values-red.log、transaction-locks-red.log记录实现前缺失类的编译失败。失败日志保留，最终结果使用上表指定证据。

T013已实现并验证精确十进制值/ID、上海日及季度半开区间、强制时区时间戳、同一Spring事务连接的命名锁、提交/回滚后释放及池回收；故障注入验证业务、身份、审计、回执同事务回滚。当前身份/范围授权、完整审计策略、幂等执行器、If-Match、错误投影及契约接口尚未完成，因此T013不勾选。测试锁工具尚未接入业务接口，不构成业务验收完成。

28项冻结输入SHA-256核验均未变化。Spec、Plan、Constitution、原Word/图/数据字典/API未修改。指纹及日志路径见foundation-batch-20261111.json。原tasks-validation.json是任务修订时的静态快照，保留其原记录，本批运行结果以本文件和实际日志为准。
