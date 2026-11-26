# 受控虚构完整季度演练

结果：PASS。评价期间为2026-07-01/2026-10-01 Asia/Shanghai，全部两个虚构营业门店及两个参与核算的牙医均在演练范围内。初始历史是明确标记的受控夹具，不是逐笔历史API的真实营业记录；随后核算、独立复核、分析和保存使用实际服务、鉴权、事务与MySQL。

R1核算得到收入1000.00、医疗用品100.00、运营费用200.00，净利润700.00、激励70.00。计算身份hq与复核发布身份quarter-reviewer分离，两名牙医均成功发布当前版本。

模拟业务时钟固定在2026-11-11，模拟工作日历计算为0个工作日；实际执行墙钟耗时0.499秒。两者分开披露，结果不代表真实营业季度、真实吞吐或实际运营效果。

缺成本时结果为INCOMPLETE并拒绝发布；刻意构造某门店缺少当季治疗使用记录时，返回DATA_USAGE_EVIDENCE_INCOMPLETE，未伪报100%。比例及来源见coverage-traceability.md与course-quarter.json。

重复入口：tools/verification/Verify-BillingRegression.ps1 -Cases CourseQuarterAcceptanceIT。需要已就绪的Docker、Java21及项目依赖；仅新建和清理本次拥有的隔离MySQL，不修改云端数据、结构或生产业务时钟。原始结果位于course-quarter-tests.log及后端对应JUnit报告。
