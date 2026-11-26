# 受控首个总部账号初始化

仅供环境管理者在负责人核实实际人员、初始范围及凭据后使用；本轮只在隔离数据库运行了虚构夹具，没有创建真实管理员。无公开注册入口、内置账号或默认口令。重复运行不能扩大权限；已有总部初始化记录时必须使用授权凭据恢复流程。

前置：执行获批迁移及runtime-grants.sql；实际诊所须已通过受控资源初始化建立，所列clinic_id必须真实存在。本命令不生成虚构诊所或牙医，不改业务表。使用只具必要DML权限的运行账号；数据库密码、初始个人口令分别放入访问受限文件，不放命令参数、仓库或日志。Windows可放D盘受限目录，Linux/Docker使用受控秘密挂载。

通过ADC_BOOTSTRAP_INPUT_FILE指定UTF-8 JSON，字段为username、staff_reference、operator_reference、clinic_ids（十进制字符串数组）、capabilities（显式能力数组）、valid_until（带时区时间或明确null）。全部填写真实核实资料，不照抄测试夹具。能力限已批准总部能力集合，不能使用通配符；valid_until必须显式给出，null表示无预定结束，仍受撤权与停用控制。

配置ADC_DB_URL、ADC_DB_USERNAME、ADC_BOOTSTRAP_DB_PASSWORD_FILE、ADC_BOOTSTRAP_PASSWORD_FILE、ADC_BOOTSTRAP_INPUT_FILE后，运行已构建后端包：

```powershell
java '-Dloader.main=com.adc.identity.bootstrap.HeadquartersBootstrap' -cp backend/target/adc-backend-0.1.0-SNAPSHOT.jar org.springframework.boot.loader.launch.PropertiesLauncher
```

初始化使用同一连接、显式事务和全局命名锁，创建内部SYSTEM操作主体、独立STAFF账号及明确岗位/诊所/能力授权，追加含操作者核实引用的AuditEvent；只输出新主体标识。无效范围、审计失败或其他错误整体回滚，结束后释放命名锁。SYSTEM不能通过公开登录取得会话。秘密文件处理和保留由环境管理者控制；命令不会自动删除实际秘密文件。
