import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs'
import { resolve, basename, extname } from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const out = resolve('docs/verification/models')
mkdirSync(out, { recursive:true })
mkdirSync(resolve(out,'rendered'), { recursive:true })
mkdirSync(resolve(out,'sources'), { recursive:true })
const hash = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const figures=JSON.parse(readFileSync('docs/diagrams/figure-index.json','utf8'))
const sources = [...figures.map(f=>f.source).filter(f=>/\.(puml|mmd|svg)$/.test(f)).map(f=>resolve(f)),...readdirSync('specs/001-system-specification/diagrams').filter(f=>f.endsWith('.mmd')).map(f=>resolve('specs/001-system-specification/diagrams',f))]
const before = Object.fromEntries(sources.map(p=>[p,hash(p)]))
const browserConfig = resolve(out,'puppeteer.json')
writeFileSync(browserConfig, JSON.stringify({ executablePath:process.argv[2], headless:true }))
const results = []
for (const source of sources) {
  const copy = resolve(out,'sources',basename(source))
  copyFileSync(source,copy)
  const target = resolve(out,'rendered',basename(source,extname(source))+'.svg')
  if(source.endsWith('.svg')) {
    const svg=readFileSync(source,'utf8')
    if(!svg.includes('<svg') || !svg.includes('http://www.w3.org/2000/svg')) throw Error('Invalid native SVG source: '+source)
    copyFileSync(source,target)
    results.push({source:source.slice(root.length+1).replaceAll('\\','/'),sha256:before[source],exit_code:0,error:null,renderer:'owner-approved native SVG; XML and raster checked by tools/diagrams/verify.py',output:target.slice(root.length+1).replaceAll('\\','/')})
    writeFileSync(resolve(out,'tool-results.json'),JSON.stringify({plantuml:'1.2026.9',mermaid_cli:'12.2.0',native_svg:18,results},null,2))
    console.log('PASS '+basename(source));continue
  }
  let command,args
  if (source.endsWith('.puml')) {
    command='java'
    args=[`-Djava.io.tmpdir=${resolve('tmp/build-temp')}`,'-jar',resolve('tmp/model-tools/plantuml-1.2026.9.jar'),'-charset','UTF-8','-tsvg','-failfast2','-o',resolve(out,'rendered'),copy]
  } else {
    command=process.execPath
    args=[resolve('tools/model-validation/node_modules/@mermaid-js/mermaid-cli/src/cli.js'),'-i',copy,'-o',target,'-p',browserConfig,'-b','white','--size','1800','--no-font-embed']
  }
  const run=spawnSync(command,args,{encoding:'utf8',timeout:120000,windowsHide:true})
  const log=(run.stdout??'')+(run.stderr??'')+(run.error?.message??'')
  writeFileSync(resolve(out,'rendered',basename(source)+'.log'),log)
  const result={source:source.slice(root.length+1).replaceAll('\\','/'),sha256:before[source],exit_code:run.status,error:run.error?.message??null,output:target.slice(root.length+1).replaceAll('\\','/')}
  if (hash(source)!==before[source]) throw Error('Original source changed: '+source)
  results.push(result)
  writeFileSync(resolve(out,'tool-results.json'),JSON.stringify({plantuml:'1.2026.9',mermaid_cli:'12.2.0',results},null,2))
  console.log(`${result.exit_code===0?'PASS':'FAIL'} ${basename(source)}`)
}
if(results.some(x=>x.exit_code!==0)) process.exitCode=1
