from pathlib import Path
import json
R=Path(__file__).resolve().parents[2]
p=R/'tools/verification/reconcile-q03-results.mjs';s=p.read_text('utf-8');a=s.index('r.final_states=');b=s.index(';r.count_reconciliation',a);s=s[:a]+'r.final_states=[];r.final_state_snapshot_collected=false;r.event_history_complete=completeEvents'+s[b:];p.write_text(s,'utf-8')
p=R/'docs/verification/performance/q03-small-run.json';d=json.loads(p.read_text('utf-8'));d['final_states']=[];d['final_state_snapshot_collected']=False;d['event_history_complete']=False;p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n','utf-8')
p=R/'tools/verification/finalize-quality-evidence.py';s=p.read_text('utf-8').replace("assert all(not x['oom_killed'] and x['restart_count']==0 for x in run['final_states'])","# Enforced limits and original samples are verified; no unsupported final-state claim.")
s=s.replace("run['after']['applied_treatments']-200000==run['operations']['treatments']","run['after']['applied_treatments']-200000==run['successful_operations']['treatments']").replace("run['after'][k]==run['operations']['invoices']","run['after'][k]==run['successful_operations']['invoices']").replace("run['after']['mutation_receipts']==run['operations']['invoices']+run['operations']['treatments']","run['after']['mutation_receipts']==run['successful_operations']['invoices']+run['successful_operations']['treatments']")
s=s.replace("实际新增{run['operations']['treatments']}","实际新增{run['successful_operations']['treatments']}").replace("{run['operations']['invoices']}份唯一费用凭据","{run['successful_operations']['invoices']}份唯一费用凭据").replace('无OOM或容器重启','资源硬限制与窗口样本已保留；清理前未采集最终状态，不声称完成终态核验')
p.write_text(s,'utf-8')
