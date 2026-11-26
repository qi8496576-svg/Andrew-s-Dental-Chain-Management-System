from pathlib import Path
import re,json
R=Path(__file__).resolve().parents[2]
p=R/'docs/verification/performance/q03-results.md';s=p.read_text('utf-8').replace('在部署同一已测试应用镜像后再次完成','在候选查询源码保持一致、费用列表修复另经回归的部署版本上完成');s+='\n完整负载镜像与最终部署镜像分别记录于q03-small-run.json、performance-tested-image.json及application-update.json。费用列表加锁修复不在三类负载请求中；其9项真实MySQL/HTTP回归及真实网站读回另有记录，不将两个镜像表述为同一镜像。\n';p.write_text(s,'utf-8')
p=R/'tools/verification/finalize-billing-evidence.py';s=p.read_text('utf-8').replace("date='2026-11-25'","date='2026-11-26'").replace("'date':'2026-11-25'","'date':'2026-11-26'");p.write_text(s,'utf-8')
p=R/'tools/verification/finalize-quality-evidence.py';s=p.read_text('utf-8').replace('在部署同一已测试应用镜像后再次完成','在候选查询源码保持一致、费用列表修复另经回归的部署版本上完成');p.write_text(s,'utf-8')
print('Current evidence preserves distinct performance and deployed image scopes')
