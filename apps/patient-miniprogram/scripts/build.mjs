import { copyFile, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises'
import { resolve, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'

const project = fileURLToPath(new URL('..', import.meta.url))
const source = resolve(project, 'miniprogram')
const output = resolve(project, 'dist/miniprogram')
const arguments_ = process.argv.slice(2)
assert.ok(arguments_.every(value => value === '--local-preview'), 'Unknown build option')
const localPreview = arguments_.includes('--local-preview')
// Only remove this project's fixed generated output, never a caller-supplied path.
assert.equal(relative(project, output), ['dist', 'miniprogram'].join(sep))
await rm(output, { recursive: true, force: true })
const compiled = spawnSync(process.execPath, [resolve(project, 'node_modules/typescript/bin/tsc'), '-p', resolve(project, 'tsconfig.json')], { stdio: 'inherit' })
if (compiled.error) throw compiled.error
if (compiled.status !== 0) process.exit(compiled.status ?? 1)
// Explicit simulator build only. Normal builds retain the approved public origin.
// This does not change domain/TLS checks, fabricate wx.login, or ship local secrets.
if (localPreview) {
  await writeFile(resolve(output, 'config.js'), '"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nexports.API_ORIGIN = "https://localhost:19443";\n')
}

async function copyAssets(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) await copyAssets(path)
    else if (/\.(json|wxml|wxss|png)$/.test(entry.name)) {
      if (entry.name.endsWith('.wxml')) {
        const template = await readFile(path, 'utf8')
        for (const directive of template.matchAll(/wx:(?:if|elif|for)\s*=\s*"([^"]*)"/g)) {
          assert.ok(/^\s*\{\{[\s\S]*\}\}\s*$/.test(directive[1]),
            `WXML directive is missing data-binding braces: ${relative(source, path)}`)
        }
        for (const binding of template.matchAll(/\{\{([\s\S]*?)\}\}/g)) {
          assert.ok(!/&(?:amp|lt|gt);/.test(binding[1]),
            `WXML expression contains an HTML-escaped operator: ${relative(source, path)}`)
        }
      }
      const target = resolve(output, relative(source, path))
      await mkdir(resolve(target, '..'), { recursive: true })
      await copyFile(path, target)
    }
  }
}
await copyAssets(source)
const app = JSON.parse(await readFile(resolve(output, 'app.json'), 'utf8'))
const config = JSON.parse(await readFile(resolve(project, 'project.config.json'), 'utf8'))
assert.equal(resolve(project, config.miniprogramRoot), output)
assert.equal(config.compileType, 'miniprogram')
assert.equal(config.setting.urlCheck, true)
for (const page of app.pages) {
  const base = resolve(output, page)
  assert.ok(base.startsWith(output + sep))
  for (const extension of ['js', 'json', 'wxml', 'wxss']) await readFile(`${base}.${extension}`)
  JSON.parse(await readFile(`${base}.json`, 'utf8'))
}
await readFile(resolve(output, 'app.js'))
for (const tab of app.tabBar?.list ?? []) {
  assert.ok(app.pages.includes(tab.pagePath), 'Tab route must exist')
  for (const icon of [tab.iconPath, tab.selectedIconPath]) {
    const asset = resolve(output, icon)
    assert.ok(asset.startsWith(output + sep))
    const bytes = await readFile(asset)
    assert.ok(bytes.length < 40 * 1024, 'Native tab icon exceeds 40 KB')
  }
}
const nativeDirectory = process.env.ADC_WECHAT_COMPILER_DIR ?? 'D:/Users/APPdata/微信web开发者工具/resources/app.asar.unpacked/node_modules/wcc-exec'
let nativeCompiled = false
if (process.platform === 'win32' && existsSync(resolve(nativeDirectory, 'wcc.exe')) && existsSync(resolve(nativeDirectory, 'wcsc.exe'))) {
  for (const tree of [source, output]) {
    const wxml = spawnSync(resolve(nativeDirectory, 'wcc.exe'), app.pages.map(page => page + '.wxml'), { cwd: tree, encoding: 'utf8', windowsHide: true })
    assert.equal(wxml.status, 0, wxml.stderr || 'Native WXML compilation failed')
    for (const file of ['app.wxss', ...app.pages.map(page => page + '.wxss')]) {
      const wxss = spawnSync(resolve(nativeDirectory, 'wcsc.exe'), [file], { cwd: tree, encoding: 'utf8', windowsHide: true })
      assert.equal(wxss.status, 0, wxss.stderr || `Native WXSS compilation failed: ${file}`)
    }
  }
  nativeCompiled = true
}
console.log(JSON.stringify({ typescript_compiled: true, page_assets_present: app.pages.length, native_wxml_wxss_compiled: nativeCompiled, devtools_root: config.miniprogramRoot, appid_configured: Boolean(config.appid), local_preview: localPreview, wechat_runtime_verified: false }))
