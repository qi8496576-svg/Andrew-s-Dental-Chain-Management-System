# T006 隔离测试夹具与证据约定

2026-11-11，T006 PASS。新增共享虚构患者、STAFF岗位及诊所范围、三种过敏核验状态、八个独立预约场景（五状态/四取消分类）及正常/停诊班次视图；元数据仅描述测试场景，不是业务表字段或完整数据库种子。

真实执行结果：Maven clean verify通过，3项原启动测试、1项原MySQL环境测试、2项新增夹具测试共6项通过；新增集成测试验证真实MySQL事务回滚、临时表连接隔离、UTC/大小写设置和关闭后的连接拒绝。前端npm ci、TypeScript检查通过，3项数据隔离/状态集合/身份分离测试通过；8份AppointmentView载荷经冻结契约校验通过。首次前端测试发现预期数组排序顺序错误，已修复并重跑通过，没有改业务状态集合。

生产JAR检查确认不含MySqlFixture及adc-fictional.json。无业务表迁移/建表；探针只在临时容器连接创建TEMPORARY TABLE fixture_probe，不接触Compose持久库。暂未验证真实业务、微信身份或性能恢复指标。固定镜像摘要和D盘缓存沿用T002。

原31项冻结输入指纹未变；tasks仅勾选T006，186项编号、内容及依赖保持。T007/C-03尚未执行，不跳过直接进入T008。

复现：设置DOCKER_HOST=npipe:////./pipe/dockerDesktopLinuxEngine及D盘DOCKER_CONFIG后运行 tools/verification/Verify-BackendBuild.ps1 -Repository tmp/maven-tls-probe/repository -EvidencePrefix t006；使用D盘Node工具链在tests/e2e执行npm ci、npm run typecheck、npm test。证据格式和隔离约定见README.md。XML归档在archive/t006-success及t006-frontend-tests.xml；完整构建日志在t006-build.log，机器结果/指纹见t006-validation.json。核验者：Codex自动执行，不代表负责人批准业务验收。
