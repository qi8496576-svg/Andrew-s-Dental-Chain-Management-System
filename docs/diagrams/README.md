# 正式图源

当前Word的22幅正式图、根目录“图源”及本目录采用同一套图面。[打开正式图总览](official/index.html)。

18幅业务、用例、类、分析序列及状态机图采用已确认的可编辑SVG；修改时保留黑白符号、激活框及分栏画法。A1、C1、D1、D2保留当前有效来源，数据库模型维持24表、209字段和44外键。PNG用于Word排版，SVG保留文字、线条及对象的编辑能力。

| 图号 | 名称 | 图片 | 源文件 |
| --- | --- | --- | --- |
| A1 | 图 A1  ADC 业务用例图 | [正式PNG](official/A1.png) | [可编辑源](uml/A1-业务用例图.puml) |
| A2 | 图 A2  现状业务序列图 | [正式PNG](official/A2.png) | [可编辑源](uml/A2-现状业务序列图.svg) |
| A3 | 图 A3  改进业务序列图 | [正式PNG](official/A3.png) | [可编辑源](uml/A3-改进业务序列图.svg) |
| B1 | 图 B1  系统用例图 | [正式PNG](official/B1.png) | [可编辑源](uml/B1-系统用例图.svg) |
| C1 | 图 C1  ADC 信息系统实体类图 | [正式PNG](official/C1.png) | [可编辑源](uml/C1-实体类图.puml) |
| C2 | 图 C2  ADC 信息系统边界类图 | [正式PNG](official/C2.png) | [可编辑源](uml/C2-边界类图.svg) |
| C3 | 图 C3  ADC 信息系统控制类 | [正式PNG](official/C3.png) | [可编辑源](uml/C3-控制类图.svg) |
| C4 | 图 C4  UC01-S1 创建预约分析序列图 | [正式PNG](official/C4.png) | [可编辑源](uml/C4-UC01分析序列图.svg) |
| C5 | 图 C5  UC02 管理出诊排班分析序列图 | [正式PNG](official/C5.png) | [可编辑源](uml/C5-UC02分析序列图.svg) |
| C6 | 图 C6  UC03 记录治疗分析序列图 | [正式PNG](official/C6.png) | [可编辑源](uml/C6-UC03分析序列图.svg) |
| C7 | 图 C7  UC04 结算就诊分析序列图 | [正式PNG](official/C7.png) | [可编辑源](uml/C7-UC04分析序列图.svg) |
| C8 | 图 C8  UC05 维护患者资料分析序列图 | [正式PNG](official/C8.png) | [可编辑源](uml/C8-UC05分析序列图.svg) |
| C9 | 图 C9  UC06 维护组织资源分析序列图 | [正式PNG](official/C9.png) | [可编辑源](uml/C9-UC06分析序列图.svg) |
| C10 | 图 C10  UC07 核算季度绩效分析序列图 | [正式PNG](official/C10.png) | [可编辑源](uml/C10-UC07分析序列图.svg) |
| C11 | 图 C11  UC08 运营分析序列图 | [正式PNG](official/C11.png) | [可编辑源](uml/C11-UC08分析序列图.svg) |
| C13 | 图 C13 UC01-S2 确认到诊分析序列图 | [正式PNG](official/C13.png) | [可编辑源](uml/C13-UC01-S2分析序列图.svg) |
| C14 | 图 C14 UC01-S3 取消预约分析序列图 | [正式PNG](official/C14.png) | [可编辑源](uml/C14-UC01-S3分析序列图.svg) |
| C15 | 图 C15 UC01-S4 登记爽约分析序列图 | [正式PNG](official/C15.png) | [可编辑源](uml/C15-UC01-S4分析序列图.svg) |
| C16 | 图 C16 UC01-S5 停诊改约分析序列图 | [正式PNG](official/C16.png) | [可编辑源](uml/C16-UC01-S5分析序列图.svg) |
| C12 | 图 C12  就诊分析状态机图 | [正式PNG](official/C12.png) | [可编辑源](uml/C12-就诊状态机.svg) |
| D1 | 图 D1  ADC 数据库 ER 图 | [正式PNG](official/D1.png) | [可编辑源](database/D1-database.dbml) |
| D2 | 图 D2 系统分层与前端入口 | [正式PNG](official/D2.png) | [可编辑源](architecture/D2-系统分层.mmd) |

索引和哈希见[figure-index.json](figure-index.json)与[word-image-audit.json](word-image-audit.json)。18幅原生SVG可由tools/diagrams/export.py导出PNG；Word、PNG及SVG一致性由tools/diagrams/verify.py核对。正式文档由根目录Word维护，PDF与两个文档副本使用同一内容。
