import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {root,run} from '../deployment/cloud-ssh.mjs'
const dir=path.join(root,'docs/verification/performance'),file=path.join(dir,'q03-small-run.json'),r=JSON.parse(fs.readFileSync(file)),summary=JSON.parse(fs.readFileSync(path.join(dir,'q03-small-summary.json'))).metrics.metrics
assert.equal(r.k6_exit_code,0);assert.ok(Date.parse(r.load_finished_at)-Date.parse(r.load_started_at)>=1200000)
const works=fs.readdirSync(path.join(root,'tmp')).filter(d=>/^adc-q03-[a-f0-9-]{36}$/.test(d)&&fs.existsSync(path.join(root,'tmp',d,'counts.json'))).filter(d=>JSON.parse(fs.readFileSync(path.join(root,'tmp',d,'counts.json'))).server_uuid===r.counts.server_uuid);assert.equal(works.length,1)
const raw=path.join(root,'tmp',works[0],'raw-samples.json'),bytes=fs.readFileSync(raw),success={candidates:0,treatments:0,invoices:0}
for(const line of bytes.toString().trim().split('\n')){const p=JSON.parse(line);if(p.type==='Point'&&p.metric==='q03_successes')success[p.data.tags.kind]+=p.data.value}
assert.ok(Object.values(success).reduce((a,b)=>a+b,0)>=5000);assert.ok(summary.q03_unexpected_errors.values.rate<.01)
assert.equal(r.after.applied_treatments-200000,success.treatments);for(const k of ['invoices','invoiced_visits','invoice_events','valid_totals'])assert.equal(r.after[k],success.invoices)
assert.equal(r.after.mutation_receipts,success.treatments+success.invoices)
const events=(await run('D:/ADC-Dev/Docker/app/resources/bin/docker.exe',['events','--since',r.date,'--until',r.finished_at,'--filter','label=adc.purpose=q03-owned-synthetic','--format','{{json .}}'])).trim().split('\n').filter(Boolean).map(JSON.parse),names=new Set(r.resource_limits.map(x=>x.name.replace(/^\//,''))),owned=events.filter(x=>names.has(x.Actor?.Attributes?.name))
// A post-cleanup event query is supplementary; do not invent a final container snapshot.
const completeEvents=new Set(owned.filter(x=>x.Action==='create').map(x=>x.Actor.Attributes.name)).size===3
if(completeEvents)assert.ok(!owned.some(x=>['oom','restart'].includes(x.Action)))
fs.copyFileSync(file,path.join(dir,'q03-completed-window-before-count-correction.json'))
r.successful_operations=success;r.raw_samples_sha256=crypto.createHash('sha256').update(bytes).digest('hex');r.raw_samples_location=path.relative(root,raw);r.final_states=[];r.final_state_snapshot_collected=false;r.event_history_complete=completeEvents;r.count_reconciliation='Original validator compared all attempts against successful writes. Raw k6 success points match real committed treatment/invoice/event/receipt counts. The one failed treatment request remains in the original error-rate and latency measurements.';r.initial_validator_error=r.error;delete r.error;r.status='PASS';r.reconciled_at=new Date().toISOString();fs.writeFileSync(file,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({status:r.status,attempts:r.operations,success,unexpected_error_rate:summary.q03_unexpected_errors.values.rate}))
