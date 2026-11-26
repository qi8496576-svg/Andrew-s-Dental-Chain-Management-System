import fs from 'node:fs'
import {chromium} from '../../apps/admin/node_modules/playwright/index.mjs'
const settingsOnly=process.argv.includes('--settings'),remaining=process.argv.includes('--remaining');const directory=remaining?'docs/verification/dentalpin-remaining':settingsOnly?(process.argv.includes('--focus')?'docs/verification/dentalpin-focus':'docs/verification/dentalpin-settings'):'docs/verification/dentalpin-research';fs.mkdirSync(directory,{recursive:true})
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1536,height:1050}}),network=[],observations=[],blocked=[]
await page.route('**/*',route=>{const r=route.request(),url=new URL(r.url());if(['GET','HEAD','OPTIONS'].includes(r.method())||r.method()==='POST'&&/\/auth\//.test(url.pathname))return route.continue();blocked.push({method:r.method(),path:url.pathname});return route.abort()})
page.on('response',r=>{if(r.request().resourceType()==='xhr'||r.request().resourceType()==='fetch')network.push({method:r.request().method(),host:new URL(r.url()).host,path:new URL(r.url()).pathname,status:r.status()})})
async function capture(name){await page.waitForTimeout(1000);const observation={name,url:page.url(),headings:await page.locator('h1,h2,h3').allTextContents(),text:(await page.locator('body').innerText()).slice(0,18000),links:await page.locator('a[href]').evaluateAll(items=>items.map(a=>({text:a.innerText,href:a.getAttribute('href')}))),buttons:await page.getByRole('button').allTextContents(),fields:await page.locator('input,select,textarea').evaluateAll(items=>items.map(x=>({tag:x.tagName,type:x.type,name:x.name,placeholder:x.placeholder,required:x.required,options:x.tagName==='SELECT'?Array.from(x.options).map(o=>o.text):undefined}))),tableHeaders:await page.locator('th').allTextContents()};observations.push(observation);await page.screenshot({path:directory+'/'+name+'.png',fullPage:true});fs.writeFileSync(directory+'/observations.json',JSON.stringify({date:new Date().toISOString(),observations,network,blocked},null,2));console.log(JSON.stringify({name,url:observation.url,headings:observation.headings,links:observation.links,buttons:observation.buttons,tableHeaders:observation.tableHeaders,text:observation.text.slice(0,4500)}))}
try{
 await page.goto('https://demo.dentalpin.com/',{waitUntil:'networkidle',timeout:60000})
 if(page.url().includes('login')){await page.locator('input[name=email]').fill('admin@demo.clinic');await page.locator('input[name=password]').fill('demo1234');await page.getByRole('button',{name:/sign in/i}).click();await page.waitForTimeout(7000)}
 await page.locator('a[href="/settings"]').waitFor({timeout:35000});await capture('home')
 if(page.url().includes('login')){console.log(JSON.stringify({login_not_completed:true,network,blocked}));process.exitCode=1}
 else{
  const trigger=page.getByRole('button',{name:/admin demo/i});if(await trigger.count())await trigger.click();else{const text=page.getByText('Admin Demo',{exact:true});if(await text.count())await text.click()}
  await capture('admin-menu')
  const links=await page.locator('a[href]').evaluateAll(items=>items.map(x=>({text:x.innerText,href:x.getAttribute('href')})))
  const mainPaths=[...new Set(links.map(x=>x.href).filter(x=>x?.startsWith('/')&&!/logout|login/.test(x)))];let paths=settingsOnly?(process.argv.includes('--focus')?['/settings/people/users','/settings/workspace/professional-schedules','/settings/catalog']:['/settings']):mainPaths
  if(remaining){const prior=JSON.parse(fs.readFileSync('docs/verification/dentalpin-settings/observations.json','utf8'));const previous=fs.existsSync(directory+'/prior.json')?JSON.parse(fs.readFileSync(directory+'/prior.json','utf8')).observations:[];const seen=new Set([...prior.observations,...previous].map(o=>new URL(o.url).pathname));paths=[...new Set(prior.observations.flatMap(o=>o.links).map(l=>l.href).filter(h=>h.startsWith('/settings/')&&!seen.has(h)))]}
  for(const [i,target] of paths.entries()){
   await page.goto(new URL(target,'https://demo.dentalpin.com/').href,{waitUntil:remaining?'domcontentloaded':'networkidle',timeout:45000});await page.waitForTimeout(4000);await capture('page-'+i);if(settingsOnly && !remaining && !process.argv.includes('--focus') && target.startsWith('/settings')){const extra=await page.locator('a[href]').evaluateAll(items=>items.map(a=>a.getAttribute('href')));for(const link of extra)if(link?.startsWith('/settings/')&&!mainPaths.includes(link)&&!paths.includes(link)&&paths.length<40)paths.push(link)}
   const add=page.getByRole('button',{name:/^(add|create|new)\b/i}).first();if(await add.count()&&await add.isEnabled()){await add.click();await capture('page-'+i+'-add');await page.keyboard.press('Escape')}
  }
 }
}finally{await browser.close()}


