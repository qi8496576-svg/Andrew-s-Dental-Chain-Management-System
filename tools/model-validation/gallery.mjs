import { readFileSync, writeFileSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const figures=JSON.parse(readFileSync('docs/diagrams/word-image-audit.json','utf8')).figures
const out=resolve('docs/verification/models')
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;')
let html='<meta charset="utf-8"><title>C-03 图面比较</title><style>body{font:16px Arial;margin:16px}section{border-bottom:2px solid #ccc;padding:8px}article{display:flex;gap:16px}img{width:49%;height:680px;object-fit:contain}h2{margin:4px}</style><h1>左：Word正式嵌图；右：专用工具渲染（布局不要求像素一致）</h1>'
for(const f of figures){
 const rendered=f.id==='D1'?'D1-derived.svg':basename(f.editable_source,extname(f.editable_source))+'.svg'
 html+=`<section id="${f.id}"><h2>${f.id}</h2><article><img src="${escape(pathToFileURL(resolve(f.official_image)).href)}"><img src="${escape(pathToFileURL(resolve(out,'rendered',rendered)).href)}"></article></section>`
}
writeFileSync(resolve(out,'comparison.html'),html)
console.log("Updated comparison gallery from current sources")
