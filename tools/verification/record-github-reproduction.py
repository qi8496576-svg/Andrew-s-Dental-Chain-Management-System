"""Summarize actual clean-checkout reports without exporting credentials or raw logs."""
from pathlib import Path
import json,xml.etree.ElementTree as ET,datetime,re,hashlib
ROOT=Path(__file__).resolve().parents[2];CHECKOUT=ROOT/'tmp/github-publication/shallow'
def suites(directory):
 rows=[]
 for file in sorted(directory.glob('TEST-*.xml')):
  item=ET.parse(file).getroot();rows.append({k:item.get(k,'0') for k in ['name','tests','errors','failures','skipped']})
 return rows
def total(rows):return {k:sum(int(r[k]) for r in rows) for k in ['tests','errors','failures','skipped']}
integration=suites(CHECKOUT/'backend/target/failsafe-reports');unit=suites(CHECKOUT/'backend/target/surefire-reports')
assert total(integration)=={'tests':175,'errors':0,'failures':0,'skipped':0}
assert total(unit)=={'tests':24,'errors':0,'failures':0,'skipped':0}
def junit(relative,expected):
 item=ET.parse(CHECKOUT/relative).getroot();row={k:int(item.get(k,0)) for k in ['tests','errors','failures','skipped']}
 assert row=={'tests':expected,'errors':0,'failures':0,'skipped':0};return row
def log(name):return (CHECKOUT/'tmp/reproduction'/name).read_text('utf8',errors='replace')
assert 'Tests run: 175, Failures: 0, Errors: 5, Skipped: 0' in log('backend-verify-initial.log')
assert 'Tests run: 17, Failures: 0, Errors: 0, Skipped: 0' in log('backend-recheck.log') and 'BUILD SUCCESS' in log('backend-recheck.log')
assert 'BUILD SUCCESS' in log('test-portability-compile.log')
assert re.search(r'pass\s+32\b',log('mini-tests.log'))
native=next(json.loads(line) for line in log('mini-verify.log').splitlines() if line.startswith('{"typescript_compiled"'))
browser=json.loads((CHECKOUT/'tmp/reproduction/browser.json').read_text('utf8'));assert browser['status']=='PASS' and len(browser['pages'])==9
report={
 'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'environment':{'host':'Windows','jdk':21,'node':'24.22.1','database':'isolated Docker Linux MySQL 8.4.13','fresh_source_outputs_and_database':True,'dependency_and_image_download_caches_reused':True,'second_physical_computer':False},
 'initial_full_integration':{'tests':175,'errors':5,'failures':0,'reason':'missing pre-existing local temporary directory'},
 'recheck':{'classes':6,'tests':17,'errors':0,'failures':0,'skipped':0},
 'final_integration':{**total(integration),'classes':len(integration),'basis':'full initial run plus repaired related tests; latest result per test class','details':integration},
 'backend_unit':total(unit),
 'admin_unit':junit('apps/admin/test-results/vitest.xml',53),
 'admin_browser':junit('apps/admin/test-results/playwright.xml',19),
 'real_https_authentication_browser':junit('apps/admin/test-results/authentication.xml',2),
 'mini_unit':{'tests':32,'failures':0},'mini_compilation':native,
 'independent_demo_browser':browser,
 'test_portability_compile':'PASS',
 'source_published_commit':'d677b9d14405715d9f69600614e1d57836a2e6e5',
 'source_integrity':{'files_compared':1206,'mismatches':0,'original_erd_extra_file_preserved':True},
 'cloud_last_read_only_check':'2026-11-26T05:21:03.888600Z',
 'cloud_containers_healthy':3,'cloud_database_overwritten':False,'new_cloud_deployment':False,
 'new_phone_wechat_test_performed':False,'production_payment':'not enabled; DEMO only','tags_created':False,
 'raw_log_directory':'tmp/github-publication/shallow/tmp/reproduction/'
}
(ROOT/'docs/verification/github-test-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf8')
print(json.dumps({k:v for k,v in report.items() if k in ['backend_unit','admin_unit','admin_browser','real_https_authentication_browser','mini_unit','test_portability_compile']}))
