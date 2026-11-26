# 备份与恢复操作

云端受控目录为 `/opt/andrew-dental/private/Recovery`。systemd任务 `adc-recovery-full.timer` 每日北京时间02:00进行一次全备；`adc-recovery-archive.timer`、`adc-recovery-health.timer` 每5分钟执行归档和健康检查。失败进入systemd失败状态及日志；健康检查拒绝超过15分钟的归档链。只用现有三库，不修改业务表结构，不自动清理技术资料或备份。

手动只读健康检查：`sudo /opt/andrew-dental/private/Recovery/bin/cloud-cycle.sh status`。查看作业使用 `systemctl status adc-recovery-archive.service` 和 `journalctl -u adc-recovery-archive.service`。不要打印runtime.env、客户端选项文件、数据库口令或配置加密密钥。

本机 `ADC-Recovery-OffServer` 计划任务每5分钟调用 `tools/verification/Run-OffServerBackup.ps1`。备份存于 `D:/secrets/AndrewDental/CloudIntegration/RecoveryBackups`，加密配置的独立密钥存于受控RecoveryKeys目录。任务需要备份电脑开机、唤醒且用户登录；正式运行前须确认持续在线的独立接收主机。

备份工具的入口为：

```text
full-backup.sh MYSQL_OPTION_FILE NEW_BACKUP_DIRECTORY
verify-manifest.sh MANIFEST
archive-binlog.sh MYSQL_OPTION_FILE FULL_MANIFEST ARCHIVE_DIRECTORY
restore-to-position.sh TARGET_OPTION_FILE FULL_MANIFEST CHAIN TARGET_LOG TARGET_POSITION
verify-consistency.sh MYSQL_OPTION_FILE
```

恢复只面向全新隔离目标：UUID必须不同、三个应用库中无业务表，且先验证全备、压缩数据、每段日志摘要及完整连续链。指定位置必须位于已归档区间。恢复后先使所有旧会话失效，再还原受控配置及最小MySQL运行权限，重新登录并核对权限、原键重试与数据。不要对原云数据库执行恢复或清空。

配置包使用AES-256-GCM，密钥与密文分开保管。不要将密钥放进备份包、源码或运行日志。当前测试在内存中解密验证，并用恢复的签名秘密与数据库凭据启动独立后端验证登录。

客户端来自与固定服务镜像匹配的官方MySQL8.4 RPM，已核对官方公钥指纹及RPM签名；准备入口为 `tools/verification/Prepare-BackupTools.ps1`。依据：[MySQL定点恢复](https://dev.mysql.com/doc/refman/8.4/en/point-in-time-recovery-binlog.html)、[mysqlbinlog](https://dev.mysql.com/doc/refman/8.4/en/mysqlbinlog.html)、[官方签名检查](https://dev.mysql.com/doc/refman/8.4/en/checking-gpg-signature.html)。

执行 `tools/verification/Verify-Recovery.ps1` 会准备匹配客户端，并运行BackupRecoveryIT及CloudBackupRecoveryDrill。后者需要受控服务器外副本、单独的配置加密密钥及虚构账号，因此显式调用，不混入没有云凭据的默认CI；普通完整回归仍执行独立本地BackupRecoveryIT。演练前先运行Run-OffServerBackup.ps1，确保副本最新。所有目标均为新建测试容器，结束仅删除此次自有目标。
