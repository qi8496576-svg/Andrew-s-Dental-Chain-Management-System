import {mkdir, writeFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {chromium} from '../../apps/admin/node_modules/playwright/index.mjs'

// Reuse the existing website A+ brand and shared patient/admin palette.
const output = new URL('../../docs/brand/', import.meta.url)
await mkdir(output, {recursive:true})
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#17778b"/><path fill="#fff" fill-rule="evenodd" d="M253 791 433 259H568L748 791H621L584 672H410L373 791ZM441 570H553L497 385Z"/><path fill="#d5c18a" d="M752 204H788V262H846V298H788V356H752V298H694V262H752Z"/></svg>`
await writeFile(new URL('andrew-dental-icon.svg',output),svg)
const browser=await chromium.launch({channel:'msedge',headless:true})
try {
 const page=await browser.newPage({viewport:{width:1024,height:1024},deviceScaleFactor:1})
 await page.setContent(`<style>html,body{margin:0;width:1024px;height:1024px;overflow:hidden}</style>${svg}`)
 await page.screenshot({path:fileURLToPath(new URL('andrew-dental-icon.png',output))})
} finally {await browser.close()}
console.log(JSON.stringify({size:1024,primary:'#17778b',accent:'#d5c18a',output:fileURLToPath(output)}))
