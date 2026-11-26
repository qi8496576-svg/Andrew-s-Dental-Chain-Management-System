# Windows 本地开发环境（T002）

2026-11-10 晚间：T001 构建通过。负责人已重启，WSL2 已就绪；Docker Desktop 4.99.0 已安装到 D 盘并启动进程，已完成首次交互；22:13:09 Linux引擎、D盘数据位置、开发MySQL和真实Testcontainers全部通过，T002已完成。以下安装步骤保留为复现说明，不要重复安装。最新实测见 `docs/verification/t002-environment-status.md`。

## 安装位置约束（负责人新增要求）

能配置位置的程序、工具、依赖缓存、容器虚拟磁盘、镜像、数据库卷和下载文件均放在 **D 盘**。Windows 自身管理且必须依赖系统位置的组件/注册信息为例外；不得因此把所有工具的默认 C 盘目录都视为例外。不得移动或卸载用户已有的无关程序。

路径登记见 `ops/config/local-storage.json`。Docker 安装时必须显式使用官方支持的 `--installation-dir=D:\ADC-Dev\Docker\app` 和 `--wsl-default-data-root=D:\ADC-Dev\Docker\data`，后者承载 Linux 容器磁盘中的镜像与 named volumes。不能只修改 Docker 程序目录而遗漏数据盘。完成后先核对实际磁盘路径，再拉取镜像/启动数据库。上述程序与实际虚拟磁盘路径现已核对通过。

可选 Linux 发行版的安装/导入位置也必须位于 `D:\ADC-Dev\WSL`；本项目当前只需 Docker Desktop 自身的 WSL2 后端，未另装 Ubuntu。WSL 核心与 Windows 虚拟化组件由 Windows 安装机制管理，作为系统组件例外。本次使用 `--no-distribution`，没有创建默认 Linux 发行版磁盘。

本项目 Maven/Wrapper/依赖缓存已位于 D 盘项目 `tmp/`，构建输出在 D 盘 `backend/target/`。后续 npm/浏览器下载缓存和可控临时目录同样显式指向 D 盘，不沿用 C 盘默认缓存。仅复用已有工具不等于重新安装；不改动 Codex 自身的既有运行环境。

## 系统准备

日常进程不是 Windows 管理员。WSL 前置安装已通过获准的 UAC 管理员进程执行，退出码 0，日志明确要求重启。项目脚本只执行 `wsl.exe --install --no-distribution --web-download`，不自动重启、不安装额外 Linux 发行版、不删除或注销已有发行版。负责人已完成重启，当前不要重复执行安装。

在获准的管理员 PowerShell 中，从项目根目录执行：

```powershell
& '.\ops\scripts\Install-WslPrerequisite.ps1' -Install
```

安装输出和退出码写入 `docs/verification/t002-wsl-install.log` 与 `t002-wsl-install-result.json`。根据 Windows 的实际提示完成必要的重启，再检查 `wsl --version` 和 `wsl --status`。仅执行了安装命令不代表 Docker 已就绪。

使用 [Docker 官方 Windows 安装说明](https://docs.docker.com/desktop/setup/install/windows-install/) 安装 Docker Desktop，使用 **WSL 2 backend / Linux containers**。首次启动的系统权限和交互步骤必须实际完成；不要把仅下载的安装包当作已安装。WSL 操作依据 [Microsoft 官方安装说明](https://learn.microsoft.com/windows/wsl/install)及[命令选项](https://learn.microsoft.com/windows/wsl/basic-commands)。

验收入口：

```powershell
docker version
docker info --format '{{.OSType}}'
docker compose version
```

必须包含 Docker **Server** 信息、OSType 为 `linux`，以及可用的 Compose。没有满足这些条件时停止后续数据库步骤，记录实际错误。

## 隔离的开发数据库

Compose 入口为 `ops/compose/compose.dev.yaml`（以实际文件为准，规划阶段的 `.yml` 示例不构成另一个文件）。MySQL 8.4 的 Linux amd64 镜像已锁定摘要，来源见 `docs/verification/t002-mysql-image.json`。仅绑定 Windows 本地回环 13306 端口，独立 named volume；不连接生产资料。

先在仅当前用户可读的本地文件中存放随机开发专用 root 口令，不把实际值写入命令、代码、文档或日志；设置其绝对路径：

```powershell
$env:ADC_DEV_MYSQL_ROOT_PASSWORD_FILE = '<本地开发秘密文件的绝对路径>'
docker compose -f ops/compose/compose.dev.yaml config --quiet
docker compose -f ops/compose/compose.dev.yaml up -d --wait mysql
docker compose -f ops/compose/compose.dev.yaml ps
```

root 只用于本地环境初始化和检查，未来应用使用 T009 的最小权限账号。T002 不创建业务表；三个 schema、迁移账号与 runtime 权限由 T009/T043 负责。默认配置禁止更改已有卷的大小写策略来掩盖旧环境差异，禁止无证据清空旧卷。使用 `stop` 可停止服务并保留卷。

## Testcontainers 实际验收

`backend/src/test/java/com/adc/infrastructure/MySqlEnvironmentIT.java` 会创建独立、一次性的真实 MySQL 容器和随机测试口令，验证 MySQL 8.4、Linux、InnoDB、大小写敏感及 UTC。不写真实患者数据、不加业务表、不与开发卷共享存储。Docker 缺失时测试失败，不配置 `disabledWithoutDocker` 或模拟通过。

运行 Wrapper 构建入口 `tools/verification/Verify-BackendBuild.ps1 -EvidencePrefix t002` 将同时执行当前已有的单元测试和 `*IT`。T001 原始结果作为当时版本证据保留；新增 IT 后的 T002 运行使用独立日志，不覆盖 T001 已归档结果。只有 Docker Server/Compose 检查、开发数据库健康与上述真实容器测试都通过后才勾选 T002。

后续数据库结构、权限、并发和业务验收仍须执行 T008/T043/T050 及各故事测试，不能用 T002 的环境查询替代。

实测复现可运行 tools/verification/Verify-LocalContainers.ps1；然后设置 DOCKER_HOST=npipe:////./pipe/dockerDesktopLinuxEngine 和指向项目tmp/docker-config的 DOCKER_CONFIG，再运行构建脚本（采用新的EvidencePrefix保留历史证据）。开发数据库保持运行，停止时使用compose stop，保留数据卷。
