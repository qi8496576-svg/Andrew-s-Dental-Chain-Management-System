# 统一教师演示账号与管理中心交付

完成日期：2026-11-16。实际系统：https://localhost:19443。

## 登录

唯一教师演示账号：admin-demo。密码仅保存在 D:/secrets/AndrewDental/LocalPreview/教师演示登录.txt，与原私密目录继承相同访问控制；不写入源码、镜像、普通报告或 DentalPin 研究目录。授权截至 2026-12-16 16:41:33（北京时间）。本次没有修改原 admin/preview-admin 或其他员工密码及权限。

此账号仅在 adc-local-preview 的虚构数据数据库创建，限 LOCAL-PREVIEW-C1（诊所1）。脚本开始前读取实际 MySQL，拒绝存在非预览诊所或未识别患者的环境。没有在云端或正式环境建立该账号。不要向该环境导入真实患者隐私。

## 权限与业务验证

使用现有 SF03 创建员工账号、设置密码，关联既有虚构医生；使用 SF04 分别授予 HEADQUARTERS、RECEPTION、DENTIST、CASHIER 的现有能力及有效期。无超级角色、通配权限或鉴权旁路。各 API 仍自行校验实际岗位/能力/诊所/对象及状态。

一个会话即可显示四岗位已有功能；服务端按所调用的业务接口判断相应岗位，无须切换账号、冒充患者或增加前端身份切换。该员工账号不代表微信患者身份，真实患者小程序认证仍走原微信流程。

使用该账号真实完成：新建虚构患者→本人核验→过敏核实→新出诊班次→预约→到诊→本人实施治疗→完成诊疗→费用凭据。全部经既有 HTTP API，未直接写业务表。新病例专供此次演示，不覆盖原预览病例。费用凭据为150.00的实际目录价计算结果，已结算不代表已付款。

admin-demo-api.json：真实 MySQL/API 读取及闭环，16个成功写命令的持久化回执与对应审计均核对。原有员工授权前后对比不变；原前台查询员工管理仍403，admin-demo请求诊所2仍403。初次验收的治疗时间因包含毫秒被422明确拒绝，已按原契约改为整秒，使用新请求键更正；没有削弱时间规则或把拒绝当成功。

admin-demo-browser.json：一次教师登录，20个既有Web路由、14个主导航业务入口、8个管理链接全部验证，实际读取已结算病例的临床上下文及原费用凭据；API未模拟。随后另验原前台仍无管理入口及员工管理访问权。

## 管理入口

左下角的整块“管理中心”按钮可点击，齿轮图标有明确文字、展开状态及对话框语义。打开实际管理菜单后，可进入诊所、医生/执业资质、治疗项目、专业资质、过敏基础资料、员工账号/密码、角色/岗位/诊所授权及总览。

组织资源沿用同一个已实现页面，通过经过白名单验证的kind查询参数准确定位分类；已挂接同页分类切换，办理未完成时阻止分类跳转。没有虚假床位、牙椅或动态角色编辑页面。岗位/角色仍是原四岗位，权限维护走原授权页。

## 修改文件与验证

前端：src/App.vue、components/ManagementMenu.vue、management-navigation.ts及测试、views/ManagementView.vue、views/organization-resources/index.vue、api/grant-capabilities.ts、style.css（均位于apps/admin）。其中getInvoice仅同步后端原已支持的总部能力选项，不扩展注册表或契约。

运维与验收：tools/preview/provision-admin-demo.mjs（私密journal保留请求键、已完成步骤及凭据，重跑不重复创建/重置）；tools/preview/check-admin-demo.mjs。

类型检查通过；11项受影响前端测试通过；Vite生产构建通过。本地只重建前端容器，后端/MySQL容器与持久化卷保留。非前端3149个既有文件指纹比对无变化，见ui-stage1-preservation.json。Spec Kit任务、原始Word/ERD、业务表及字段、数据库迁移、后端、API契约保持原样。没有将本次整改勾为T050—T056验收完成。

## 文件

- admin-demo-api.json：权限、接口、回执、审计、独立病例引用。
- admin-demo-browser.json：20路由和8个管理目的地实际浏览器结果。
- admin-demo-unit.log、admin-demo-build.log：测试和构建。
- admin-demo-management.png、admin-demo-invoice.png：实际页面截图。
- 私密登录说明：D:/secrets/AndrewDental/LocalPreview/教师演示登录.txt。

季度绩效页面与经营分析遵守原始来源和期间要求，不伪造完整季度发布数据。真实微信合法域名、ICP和云端验收仍按原进度，不在本次单账号Web演示范围内。
