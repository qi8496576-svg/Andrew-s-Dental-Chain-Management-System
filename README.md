# 安德鲁牙科连锁管理系统

患者微信小程序、员工 Web 管理端与 Spring Boot 后端共用 MySQL。包含门店与医生资源、排班预约、本人登记与旧档案安全关联、诊疗及费用凭据、演示支付退款、季度绩效与经营分析、授权和审计。

当前支付为 **DEMO 演示支付，不扣真实款**，不包含微信商户收款能力。线上演示使用虚构资料，请勿录入真实患者信息。本仓库继续迭代，本次不创建版本标签。

## 文档与目录

| 内容 | 入口 |
| --- | --- |
| 最终需求分析与设计（62 页） | [PDF](信管2402班刘阳1602240217.pdf)、[Word](安德鲁牙科连锁管理系统需求分析与设计.docx) |
| 原仓库 ERD（原样保留） | [D1_数据库ER图.pdf](D1_数据库ER图.pdf) |
| 当前正式图源与字段基线 | [图源](图源/说明.md)、[22 幅图](docs/diagrams/official/index.html)、[字段](docs/diagrams/database/schema.json) |
| 既有 Spec Kit | [spec.md](specs/001-system-specification/spec.md)、[plan.md](specs/001-system-specification/plan.md)、[tasks.md](specs/001-system-specification/tasks.md) |
| 后端 / 管理端 / 患者端 / 共享契约 | `backend/`、`apps/admin/`、`apps/patient-miniprogram/`、`packages/contracts/` |
| 运维、测试与复现结果 | `ops/`、`tests/`、[本次复现记录](docs/verification/github-reproduction.md) |

根目录 ERD 按要求保留原仓库文件。当前实现的业务表、技术表及迁移对应 `docs/diagrams/database/`、`specs/001-system-specification/technical-schema.json` 和 `backend/src/main/resources/db/migration/`。没有重新生成 Spec Kit。

## 独立复现

准备 Git、**JDK 21**（设置 `JAVA_HOME`）、**Node.js 24.12+ / npm 11**、Docker Engine 或 Docker Desktop（Linux containers、Compose v2）。Maven Wrapper 固定 3.9.16，无需另装 Maven。建议电脑至少 8GB 内存，Docker 可用内存至少 4GB、磁盘空闲 10GB。首次下载依赖和镜像需要网络，以下命令在项目根目录执行。

```sh
git clone https://github.com/qi8496576-svg/Andrew-s-Dental-Chain-Management-System.git
cd Andrew-s-Dental-Chain-Management-System
node tools/demo/build.mjs
node tools/demo/demo.mjs up
node tools/demo/demo.mjs status
```

Linux/macOS 若 Maven Wrapper 没有执行权限，先执行 `chmod +x backend/mvnw`。Windows 使用 PowerShell；脚本自动选用 `mvnw.cmd`。Docker 不在 PATH 时可设置环境变量 `ADC_DOCKER` 为可执行文件路径。

打开 **https://localhost:19444/**，从本机生成的 `.local-demo/login.txt` 读取 `teacher-admin` 及随机口令。该账号通过真实授权 API 获得总部、前台、牙医、收费员角色，方便验收全部业务菜单；后台仍执行权限和门店校验。普通账号须单独创建、授权，仓库没有默认口令。

本地证书只用于 localhost，首次访问会提示不受信任，可仅对该本地演示确认继续；无需关闭浏览器全局证书检查。正式域名使用受信任证书。端口冲突可设置 `ADC_DEMO_PORT`；网段冲突可设置 `ADC_DEMO_NETWORK`（如 `172.30.220`），已有环境不要随意切换这些值。

脚本采用独立 Compose 项目、命名卷和随机数据库口令，自动运行原有 Flyway 迁移；只初始化自己新建且为空的数据库，不连接或覆盖云端数据库。首次生成虚构门店、医生、资质、口腔检查项目和未来七天排班，再次执行保留数据并补齐未来日期。口令与状态保存在被 Git 忽略的 `.local-demo/`。

构建不会调用云端业务 API。应用 Dockerfile 使用已构建的 JAR / dist，必须先执行构建。生产配置见 [Compose](ops/compose/compose.prod.yaml) 和 [运维手册](ops/runbooks/)，须提供自己的域名、证书与密钥。旧 `tools/preview/` 及部分 PowerShell 脚本保留历史环境用途，教师复现使用上述 `tools/demo/` 入口。

## 业务演示

1. 登录管理端，通过左下齿轮管理门店、医生、治疗项目、资质与授权，主导航处理日常业务和排班。
2. 查看未来出诊，或为医生新增排班。患者时段由真实排班、资质和号源占用计算。
3. 前台建立虚构患者、确认过敏信息后预约和到诊；牙医录入实际诊疗并完成就诊；收费员生成费用凭据和账单。后端执行角色权限。
4. 患者在小程序查看自己的预约、账单并完成演示支付；支付、退款及审计真实落库。挂号费与诊疗账单独立，未配置挂号费时不会凭空收费。

首次患者微信登录后填写姓名、生日、联系电话及过敏声明即可登记预约，无需先取得患者编号；地址及紧急联系人可后补。旧档案关联须走安全关联流程，不能输入他人编号直接取得其就诊信息。

## 微信小程序

构建后用微信开发者工具导入 **`apps/patient-miniprogram/`**，编译目录 `dist/miniprogram/`。项目 AppID 不是密钥，但实际微信登录、扫码预览需要开发成员权限。自行部署时改成自己的 AppID，并在后端配置对应 AppSecret（不得提交 Git）。

默认小程序构建连接 `https://andrewdental.cn`，仅用于本项目已授权的在线演示。**独立本地管理端与线上患者端不会共享数据库。** 联调自己的后端时，修改 `apps/patient-miniprogram/miniprogram/config.ts` 的 `API_ORIGIN` 为自己的受信任 HTTPS 域名，重新构建，配置微信 request 合法域名，并给后端提供相同小程序的 AppID/AppSecret。手机不能通过 localhost 访问电脑。

`npm run build:local` 使用 localhost:19443，供本机模拟器使用，不能直接连接默认 19444 教学环境；可在首次启动前设置 `ADC_DEMO_PORT=19443`，并自行配置开发工具对本地证书的信任。代码不伪造微信身份，不建议关闭域名及证书校验。缺少 AppSecret 时管理端可演示，微信身份登录不能离线伪造。

小程序 ICP 备案由负责人自行办理；真实微信支付须另行接入商户。本次不提交备案、不发布小程序正式版。

## 验证

`build.mjs` 全新安装锁定依赖，验证共享契约、管理端类型与单测、小程序类型/构建及单测，运行后端单测并打包。日志位于 `tmp/reproduction/`。完整 MySQL 集成测试通过 Testcontainers 创建隔离数据库：

```sh
cd apps/admin
npx playwright install chromium
cd ../..
node tools/demo/prepare-backup-tools.mjs
cd backend
# Windows 用 .\mvnw.cmd 替换 ./mvnw
./mvnw --batch-mode --no-transfer-progress --settings .mvn/settings.xml verify
```

备份恢复测试需要签名验证过的 MySQL 8.4.13 mysqlbinlog，准备脚本从 MySQL 官方 RPM 获取并验证。云端恢复、微信真机、独立性能验收各有受控环境前提，不应将离线构建称为真机验收。

管理端浏览器测试：先在 `apps/admin` 执行 `npx playwright install chromium`，再执行 `npm run test:e2e`。默认 UI 测试与需要真实 API 的专项场景分别配置，详见现有 Playwright 配置。

## 数据与配置保护

仓库不含数据库快照、生产口令、微信 AppSecret、SSH/TLS 私钥、开发工具个人配置或 node_modules。勿提交 `.local-demo/`、`.secrets/`、`tmp/` 或真实患者资料。停止演示可在 `.local-demo` 中运行 `docker compose --project-name <status中项目名> --env-file compose.env -f compose.yaml stop`；不要用 `down -v` 删除需保留的数据。

线上演示：[https://andrewdental.cn](https://andrewdental.cn)。登录资料由负责人私下提供，不写入公开仓库。后续正常修改、提交更新即可。
