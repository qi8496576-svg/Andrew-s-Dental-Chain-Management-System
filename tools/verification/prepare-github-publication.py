"""Curate a clean source tree for the owner's explicitly requested GitHub publication.

Never copies credentials, databases, caches or private development state. Existing
remote root ERD is left untouched. Run from the original workspace, not the clone.
"""
from pathlib import Path
import os, shutil, json, hashlib, re, zipfile

ROOT=Path(__file__).resolve().parents[2]
DEST=ROOT/'tmp/github-publication/shallow'
assert DEST.resolve().is_relative_to((ROOT/'tmp/github-publication').resolve())
assert (DEST/'.git').is_dir()
SKIP={'tmp','node_modules','target','dist','build','coverage','test-results','__pycache__','.git','.agents','.codex','.workbuddy','.secrets','secrets','.local-demo','参考资料','图稿待确认'}
TOP={'backend','apps','packages','specs','tests','tools','ops','docs','图源','.specify'}
ROOT_FILES={'.gitignore','.gitattributes','.dockerignore','README.md','信管2402班刘阳1602240217.pdf','安德鲁牙科连锁管理系统需求分析与设计.docx'}
copied=[];excluded=[]
for folder,dirs,files in os.walk(ROOT):
    dirs[:]=[d for d in dirs if d not in SKIP]
    for name in files:
        p=Path(folder)/name;rel=p.relative_to(ROOT);parts=rel.parts
        if (len(parts)==1 and name not in ROOT_FILES) or (len(parts)>1 and parts[0] not in TOP):continue
        reason=None
        if name.startswith('~$') or name=='project.private.config.json':reason='private editor configuration'
        if name.startswith('.env') and name!='.env.example':reason='local environment'
        if p.suffix.lower() in {'.log','.key','.pem','.p12','.pfx','.pyc'} or '.log.' in name:reason='runtime log or secret material'
        if parts[:2]==('ops','config') and not name.endswith('.example.json'):reason='owner-specific operator configuration'
        if parts[:2]==('docs','verification'):
            if p.suffix.lower() not in {'.json','.md','.xml'} or 'archive' in parts or name.endswith('-raw.json'):reason='raw runtime evidence; summarized results retained'
        if reason:excluded.append({'path':rel.as_posix(),'reason':reason});continue
        out=DEST/rel;out.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,out);copied.append(rel.as_posix())
report={'source_files':len(copied),'excluded_files':len(excluded),'source_bytes':sum((DEST/p).stat().st_size for p in copied),'original_erd_untouched':True,'files':copied,'exclusions':excluded}
(ROOT/'tmp/github-publication/inventory.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),'utf8')
print(json.dumps({k:v for k,v in report.items() if k not in ('files','exclusions')},ensure_ascii=False))
