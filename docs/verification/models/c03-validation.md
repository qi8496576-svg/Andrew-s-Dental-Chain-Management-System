# 当前图源校验

2026-11-25。当前Word、正式PNG、根目录中文命名PNG及18幅已确认SVG一致；旧图源、历史副本及待确认目录已清理。当前文档为62页，逐页检查完成。

- 22幅Word嵌图及正式PNG逐字节一致，三个Word文件内容一致。
- 18幅可编辑SVG通过XML、黑白颜色及PNG一致性核对，采用已确认的符号、嵌套激活框及类操作可见性。
- 项目图源检查工具实际通过23项来源处理，包括原生SVG和保留的PlantUML、Mermaid来源；数据库DBML派生图另行生成。
- 业务结构为24表、209字段和44外键，技术模型为14表、110字段和19技术外键，结构比较无差异。

正式入口见[图源总览](../../diagrams/official/index.html)，机器结果见tool-results.json、dbml-check.json、technical-check.json和source-identity.json。图源检查不代替剩余业务质量及发布验收。
