# 安德鲁牙科连锁管理系统

安德鲁牙科连锁管理系统由员工 Web 管理端、患者微信小程序和统一后端组成，支持多门店的预约、诊疗、费用与经营管理。两端共用 MySQL，预约、排班、就诊和账单数据保持一致。

## 在线访问

**管理端：https://andrewdental.cn**

管理员登录信息在登录页查看，支持复制账号、复制密码及一键填入。管理员可访问各业务管理模块，其他工作人员按照岗位和门店权限访问系统。

缴费与退款当前不扣真实款。

## 主要功能

| 模块 | 功能 |
| --- | --- |
| 门店与医生 | 门店资料、医生职称与擅长、任职关系、资质及服务项目 |
| 排班与预约 | 出诊排班、可约时段、在线预约、取消和改约、到诊处理 |
| 患者与诊疗 | 首次登记、本人档案关联、过敏声明与核实、诊疗记录 |
| 费用管理 | 挂号费、诊疗费用凭据、账单、缴费与退款 |
| 经营管理 | 成本记录、季度绩效计算与复核、经营分析 |
| 权限与审计 | 员工账号、角色授权、门店范围控制、操作审计 |

管理端主导航组织日常业务，左下角齿轮入口管理基础资料和权限。患者端按门店、就诊需求、医生及实际排班预约；首次患者不需要先取得诊所患者编号，地址和紧急联系人可后补。已有档案通过安全关联访问本人信息。

## 项目资料

| 内容 | 入口 |
| --- | --- |
| 需求分析与设计（62页） | [PDF](信管2402班刘阳1602240217.pdf)、[Word](安德鲁牙科连锁管理系统需求分析与设计.docx) |
| 数据库 ERD | [ERD](D1_数据库ER图.pdf)、[字段基线](docs/diagrams/database/schema.json) |
| UML 与可编辑图源 | [22幅正式图](docs/diagrams/official/index.html)、[图源说明](图源/说明.md) |
| 系统规约 | [需求](specs/001-system-specification/spec.md)、[实施方案](specs/001-system-specification/plan.md)、[任务](specs/001-system-specification/tasks.md) |
| 测试结果 | [复现记录](docs/verification/github-reproduction.md)、[测试汇总](docs/verification/github-test-results.json) |

## 技术与目录

- 后端：Java 21、Spring Boot、MyBatis、Flyway，位于 `backend/`。
- 管理端：Vue 3、TypeScript、Vite、Element Plus，位于 `apps/admin/`。
- 患者端：原生微信小程序、TypeScript，位于 `apps/patient-miniprogram/`。
- 数据与部署：MySQL 8.4、Docker Compose，位于 `ops/`。
- 接口契约：`packages/contracts/`；测试：`tests/`。

## 本地运行

运行环境：JDK 21（设置 `JAVA_HOME`）、Node.js 24.12+、npm 11、Docker Linux 容器与 Compose v2。Maven Wrapper 固定为 3.9.16，无需单独安装 Maven。建议内存8GB，Docker可用内存4GB，空闲磁盘10GB。

在项目根目录执行：

```sh
git clone https://github.com/qi8496576-svg/Andrew-s-Dental-Chain-Management-System.git
cd Andrew-s-Dental-Chain-Management-System
node tools/demo/build.mjs
node tools/demo/demo.mjs up
node tools/demo/demo.mjs status
```

打开 **https://localhost:19444/**，在登录页查看账号和密码。管理员具备总部、前台、牙医和收费员的业务管理权限。

脚本创建独立数据库和命名卷，运行现有迁移，并初始化虚构门店、医生、资质、口腔检查项目及未来七天排班。重复启动保留数据，不覆盖已有云端数据库。

本地使用 localhost 自签名证书，首次访问可仅对该本地站点确认继续。Windows 使用 PowerShell；Linux/macOS 可先执行 `chmod +x backend/mvnw`。Docker 不在 PATH 时使用 `ADC_DOCKER` 指定路径。端口和网段可分别通过 `ADC_DEMO_PORT`、`ADC_DEMO_NETWORK` 配置。

## 小程序运行

构建后，在微信开发者工具中导入 `apps/patient-miniprogram/`，编译目录为 `dist/miniprogram/`。

日常扫码查看使用开发者工具“预览”生成的二维码；“真机调试”用于连接电脑调试会话。

- 默认构建连接 `https://andrewdental.cn`，与在线管理端共用后端。
- `miniprogram/config.ts` 中的 `API_ORIGIN` 指定后端地址。
- `npm run build:local` 连接 `https://localhost:19443`，用于本机模拟器；对应本地环境可设置 `ADC_DEMO_PORT=19443`。
- 微信登录使用小程序 AppID 和后端受控 AppSecret，服务端完成身份交换。独立本地环境与线上数据库相互隔离。

## 业务流程

1. 在齿轮菜单查看门店、医生、资质和治疗项目，在主导航查看或新增出诊排班。
2. 患者端登录，登记本人资料，选择门店、就诊需求、医生和时段，提交预约。
3. 管理端查看同一预约，办理到诊；牙医记录实际诊疗项目并完成就诊。
4. 收费岗位生成费用凭据和账单，患者端查看并处理缴费；管理端可查看支付结果及办理退款。
5. 经营管理模块记录成本，计算、复核季度绩效，并查看分析结果。

支付、退款与诊疗费用凭据分别记录，支付状态不改变原有开票及绩效核算口径。

## 测试

`node tools/demo/build.mjs` 执行依赖安装、契约检查、前端类型检查与单测、小程序编译与单测，以及后端单测和打包。日志位于 `tmp/reproduction/`。

完整 MySQL 集成测试：

```sh
cd apps/admin
npx playwright install chromium
cd ../..
node tools/demo/prepare-backup-tools.mjs
cd backend
./mvnw --batch-mode --no-transfer-progress --settings .mvn/settings.xml verify
```

Windows 使用 `.\mvnw.cmd`。集成测试通过 Testcontainers 创建隔离数据库，备份工具脚本验证 MySQL 官方软件包签名。管理端浏览器测试在 `apps/admin` 中执行 `npm run test:e2e`。

仓库不包含数据库快照、部署密钥、微信 AppSecret、SSH/TLS 私钥及个人开发工具配置。应用登录账号与部署凭据分开管理；本地运行数据位于被 Git 忽略的 `.local-demo/`。
