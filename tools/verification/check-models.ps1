param([string]$EdgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$names = @('TEMP','TMP','PATH','PUPPETEER_CACHE_DIR')
$saved = @{}
foreach ($name in $names) { $saved[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
Push-Location $root
try {
    $env:TEMP = Join-Path $root 'tmp/build-temp'
    $env:TMP = $env:TEMP
    $env:PATH = "$(Join-Path $root 'tmp/toolchains/node-v24.22.1-win-x64');$env:PATH"
    $env:PUPPETEER_CACHE_DIR = Join-Path $root 'tmp/puppeteer'
    & node tools/model-validation/render.mjs $EdgePath
    if ($LASTEXITCODE -ne 0) { throw 'Model rendering has failures; inspect docs/verification/models/tool-results.json' }
    & node tools/model-validation/dbml.mjs
    if ($LASTEXITCODE -ne 0) { throw 'DBML baseline comparison failed' }
    & node tools/model-validation/node_modules/@mermaid-js/mermaid-cli/src/cli.js -i docs/verification/models/sources/D1-derived.mmd -o docs/verification/models/rendered/D1-derived.svg -p docs/verification/models/puppeteer.json -b white --size 1800 --no-font-embed
    if ($LASTEXITCODE -ne 0) { throw 'Derived DBML diagram rendering failed' }
    & node tools/model-validation/audit.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Source identity or technical diagram audit failed' }
    & node tools/model-validation/gallery.mjs $EdgePath
    if ($LASTEXITCODE -ne 0) { throw 'Comparison gallery failed' }
} finally {
    Pop-Location
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $saved[$name], 'Process') }
}
