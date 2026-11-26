# UC06 组织资源批次

2026-11-12，ADC-TASKS-20261111-03：T023/T024完成。诊所、牙医、专业资质、治疗、过敏目录及原三个关联的维护/读取使用真实业务表。没有新增表、字段、岗位或自动扩权；患者与诊所不是永久所属关系。新诊所建档返回原接口允许的最小标识，不自动扩展创建者的管理范围；实际环境初始管理范围仍需受控配置。

负责人已批准ADC-CONTRACT-20261112-03，追加原执业记录标识、资源关联和未来影响投影，修正总部过敏目录响应模型；82项操作不增加路径，患者过敏投影不变。修正登记及逐文件指纹在contracts/approved-amendments/20261112-resource-projections.json，原审批保留。既有resource.read能力按原契约补齐登记；仅显式选择才授予，不作为默认权限。

实际证据（docs/verification/database）：resources-contract-green.log中10项契约测试通过，标准校验/DTO生成/构建见resources-contract-{validation,generate,build}.log；resources-page-tests-final.log记录19项Web测试通过，resources-page-types.log及resources-page-build.log记录类型/构建通过。Windows冷启动的并发SFC转换曾触发默认测试超时，现单worker执行，不提高超时、减少断言或绕过业务规则。最终浏览器使用真实构建及已安装Edge，不安装新浏览器。

resources-browser-and-backend.log记录BuildSmokeTest 3项、JsonBoundaryTest 1项、OrganizationResourcesIT 9项及AuthenticationBrowserIT 1项全部通过，BUILD SUCCESS、零失败/错误/跳过。organization-resources-browser.log记录1项真实HTTPS页面闭环通过；截图docs/verification/organization-resources.png已检查。跨schema标识比较曾遇到真实MySQL排序规则冲突，已将标识比较改为精确二进制比较；原字段、类型和数据库排序规则不修改，失败过程保留于resources-expanded.log，修复结果见resources-collation-fixed.log。

随后补齐新诊所创建、精确办公面积、同键重复及不自动扩权场景；resources-clinic-and-regression-final.log记录最终10项资源MySQL/HTTP测试全部通过，BUILD SUCCESS。未来影响原因中文化后的最终类型/构建见resources-label-{types,build}.log，实际浏览器复验见resources-label-browser-final.log（BUILD SUCCESS），当前截图已更新并再次检查。最终契约标准校验及生成漂移检查见resources-contract-{validation,drift}-final.log：82项操作、90个JSON组件模型，批准指纹一致；此计数不是物理数据库schema或表数。

Given有当前总部资源权限且编码/资料合法，When新建并维护目录、牙医资质、执业及治疗要求，Then原表/关联真实保存，页面重新读取数据库状态；同码并发创建最多一份，失败无成功回执。Given任职结束早于入职或资质到期早于授予，When提交，Then拒绝；只有精确VERIFIED且日期有效的必需资质满足匹配。Given关联记录处于别的授权诊所，When通过可见牙医伪造原assignment_id，Then拒绝且原记录不移动。对应AC-UC06-01/02。

Given已有历史实际治疗，When调默认价格/停用目录，Then原AppliedTreatment单价不变、目录行和引用保留。Given未来预约依赖执业或必需资质，When缩短有效期，Then返回当前授权范围内的实际未来引用，Appointment仍SCHEDULED、DentistSchedule仍NORMAL，待有权人员按原流程处理。Given权限范围随后变化，When重放原键，Then不返回旧范围内的影响引用或关联；原执业变更还重新验证当前目标及请求诊所。对应AC-UC06-03/04。

成功业务、必要旧新值审计及最小回执同事务；审计不可写时完整回滚。回执不复制牙医家庭地址、出生日期或整份资源资料。资源ETag由原字段及实际关联计算，未来提示不影响版本；无业务version列。稳定牙医父行→班次→预约→资源/关联的锁顺序及锁后集合复核保持不变；当前身份与范围实时检查，详情读取在取锁后再次核对对象范围。

真实页面闭环覆盖新建专业资质/牙医、核验证书、建立执业、维护治疗全部要求、过敏目录停用和修改原执业后的未来影响。未来安排是隔离MySQL的前置夹具，不作为T029预约创建已实现的证据；全链联调仍在后续任务/门禁验收。真实微信、云发布、性能与恢复演练未由本批代验。原Word、正式ERD/UML、19/163/30及三个物理schema设计不变。
