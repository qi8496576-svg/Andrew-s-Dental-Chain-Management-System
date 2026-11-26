param([switch]$OpenWeChat)
$ErrorActionPreference = 'Stop'
$repository = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$node = Join-Path $repository 'tmp/toolchains/node-v24.22.1-win-x64/node.exe'
Push-Location $repository
try {
    & $node tools/preview/start-local-preview.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Local services did not start' }
    & $node apps/patient-miniprogram/scripts/build.mjs --local-preview
    if ($LASTEXITCODE -ne 0) { throw 'Patient build failed' }
    Write-Host '管理端：https://localhost:19443；患者端：导入 apps/patient-miniprogram 后重新编译。'
    if ($OpenWeChat) {
        & 'D:/Users/APPdata/微信web开发者工具/cli.bat' auto --project (Join-Path $repository 'apps/patient-miniprogram') --auto-port 9420 --trust-project --disable-gpu
        if ($LASTEXITCODE -ne 0) { throw 'WeChat developer tools did not start' }
    }
} finally { Pop-Location }
