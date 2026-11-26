# T002 环境验收（2026-11-10）

**通过。** 22:13:09（Asia/Shanghai）完整 Wrapper clean verify 返回 BUILD SUCCESS、退出码0。3项冒烟测试和1项真实 MySQL 集成测试全部通过，0失败、0错误、0跳过。T002 已勾选，本轮不执行 T003。

- WSL 3.0.5.0、默认WSL2；Docker Desktop 4.99.0、Linux Server 29.9.3、Compose 5.7.0。
- 程序位于 `D:\ADC-Dev\Docker\app`；实际磁盘位于数据目录的 `disk/docker_data.vhdx`、`main/ext4.vhdx`，均在D盘。
- 开发 MySQL 8.4.13、Linux、InnoDB、lower_case_table_names=0，全局及会话时区均 +00:00。
- 开发容器 healthy，仅绑定127.0.0.1:13306，使用独立卷adc-dev_mysql_data；随机口令保存在D盘受限文件并只读挂载。
- Testcontainers启动独立真实MySQL容器，校验全部环境参数；临时容器已清理。开发MySQL保留运行。

首轮测试因标签与摘要并列的镜像名称解析失败。改用 `mysql@sha256:…` 后通过，摘要始终为 `72c368d898861f3b3a07af0e6d690400f44f048799ed46822783d9224cc2c86d`，未改变版本。失败记录保留在archive/t002-attempt1，成功报告归档在archive/t002-success；T001原始报告归档于archive/t001并核对原指纹。

证据：t002-local-containers.json、t002-build-result.json、t002-build.log、t002-effective-pom.xml、t002-dependency-tree.txt、t002-validation.json。

复现时先运行Verify-LocalContainers.ps1，再设置DOCKER_HOST为npipe:////./pipe/dockerDesktopLinuxEngine、DOCKER_CONFIG为D盘项目tmp/docker-config，运行Verify-BackendBuild.ps1并选新的EvidencePrefix，避免覆盖本次证据。受限沙箱访问Docker管道可能需要获准的沙箱外执行。

本次仅验收开发环境，不创建原19张业务表、不改业务设计，不代替后续迁移、权限、并发和业务验收。
