from pathlib import Path
import json,hashlib,re
R=Path(__file__).resolve().parents[2];F=R/'specs/001-system-specification'
def read(p):return json.loads((R/p).read_text('utf-8-sig'))
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n','utf-8')
local=read('docs/verification/recovery/q05-local-drill.json');p=R/'docs/verification/recovery/q05-drill.md';s=p.read_text('utf-8');s=re.sub(r'\| 本地恢复时效 \|[^\n]*',f"| 本地恢复时效 | 全量回归中重新执行，实际墙钟计时 | RTO {local['rto_seconds']:.3f}秒；恢复点至故障{local['rpo_seconds']:.3f}秒 |",s);p.write_text(s,'utf-8')
p=F/'tasks.md';s=p.read_text('utf-8').replace('按下列展示顺序执行（已是拓扑顺序）','按tasks-catalog.json中的拓扑顺序执行');p.write_text(s,'utf-8')
v=read('specs/001-system-specification/tasks-validation.json');v['scope']='当前Word、模型、Spec Kit及已批准课程虚构验收一致性核验；不构成正式发布批准';save('specs/001-system-specification/tasks-validation.json',v)
source_paths=['安德鲁牙科连锁管理系统需求分析与设计.docx','信管2402班刘阳1602240217.pdf','specs/001-system-specification/spec.md','specs/001-system-specification/plan.md','specs/001-system-specification/tasks.md','.specify/memory/constitution.md','specs/001-system-specification/contracts/openapi.json','docs/diagrams/database/schema.json','backend/src/main/java/com/adc/application/AppointmentBookingService.java','backend/src/main/java/com/adc/infrastructure/AppointmentBookingStore.java','backend/src/main/java/com/adc/application/PatientBillingService.java','backend/src/test/java/com/adc/infrastructure/CourseQuarterAcceptanceIT.java']
deploy=read('docs/verification/performance/application-update.json');save('docs/verification/course-delivery-candidate.json',{'date':'2026-11-26','scope':'approved course fictional demonstration and automated acceptance','tasks_complete':64,'production_release_authorized':False,'deployed_release':deploy['candidate']['release'],'deployed_backend_image':deploy['candidate']['images'][0]['id'],'final_word_and_pdf_pages':62,'documentation_pdf_pending_final_export':False,'fingerprints':[{'path':p,'sha256':hashlib.sha256((R/p).read_bytes()).hexdigest()} for p in source_paths]})
print('Final course candidate fingerprinted; formal release remains a separate owner decision')
