param(
    [string]$NodeDirectory = '',
    [string]$BrowserChannel = 'msedge'
)
$ErrorActionPreference = 'Stop'
$repository = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
if (-not $NodeDirectory) { $NodeDirectory = Join-Path $repository 'tmp/toolchains/node-v24.22.1-win-x64' }
$node = Join-Path $NodeDirectory 'node.exe'
$npm = Join-Path $NodeDirectory 'node_modules/npm/bin/npm-cli.js'
if (-not (Test-Path $node) -or -not (Test-Path $npm)) { throw "Node/npm toolchain missing: $NodeDirectory" }
$admin = Join-Path $repository 'apps/admin'
$evidence = Join-Path $repository 'docs/verification'
$temporary = Join-Path $repository 'tmp/build-temp'
$userConfig = Join-Path $repository 'tmp/empty-npm-user.npmrc'
New-Item -ItemType Directory -Force $temporary | Out-Null
if (-not (Test-Path $userConfig)) { Set-Content -LiteralPath $userConfig -Value '' -Encoding ASCII }
$names = @('PATH', 'TEMP', 'TMP', 'NPM_CONFIG_CACHE', 'NPM_CONFIG_PREFIX', 'NPM_CONFIG_USERCONFIG', 'PLAYWRIGHT_BROWSERS_PATH', 'ADC_BROWSER_CHANNEL')
$saved = @{}
foreach ($name in $names) { $saved[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
$steps = @()
$failure = $null
Push-Location $admin
try {
    $env:PATH = "$NodeDirectory;$env:PATH"
    $env:TEMP = $temporary
    $env:TMP = $temporary
    $env:NPM_CONFIG_CACHE = Join-Path $repository 'tmp/npm-cache'
    $env:NPM_CONFIG_PREFIX = Join-Path $repository 'tmp/npm-global'
    $env:NPM_CONFIG_USERCONFIG = $userConfig
    $env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $repository 'tmp/ms-playwright'
    $env:ADC_BROWSER_CHANNEL = $BrowserChannel
    $nodeVersion = (& $node --version).Trim()
    $npmVersion = (& $node $npm --version).Trim()
    $commands = @(
        @{ Name='ci'; Arguments=@('ci', '--no-fund') },
        @{ Name='typecheck'; Arguments=@('run', 'typecheck') },
        @{ Name='unit'; Arguments=@('run', 'test') },
        @{ Name='build'; Arguments=@('run', 'build') },
        @{ Name='browser'; Arguments=@('run', 'test:e2e') },
        @{ Name='dependencies'; Arguments=@('ls', '--depth=0', '--json') }
    )
    foreach ($command in $commands) {
        $log = Join-Path $evidence "t003-$($command.Name).log"
        $arguments = $command.Arguments
        & $node $npm @arguments 2>&1 | Tee-Object -FilePath $log
        $code = $LASTEXITCODE
        $steps += [ordered]@{ name=$command.Name; exit_code=$code; log="docs/verification/t003-$($command.Name).log" }
        if ($code -ne 0) { throw "T003 $($command.Name) failed with exit code $code" }
    }
    $reports = Join-Path $evidence 'archive/t003-success'
    New-Item -ItemType Directory -Force $reports | Out-Null
    Copy-Item -LiteralPath (Join-Path $admin 'test-results/vitest.xml') -Destination $reports
    Copy-Item -LiteralPath (Join-Path $admin 'test-results/playwright.xml') -Destination $reports
} catch {
    $failure = $_.Exception.Message
} finally {
    Pop-Location
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $saved[$name], 'Process') }
    [ordered]@{
        checked_at=(Get-Date).ToString('o'); task='T003'; success=($null -eq $failure)
        node=$nodeVersion; npm=$npmVersion; node_directory=$NodeDirectory; browser_channel=$BrowserChannel
        steps=$steps; failure=$failure
    } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $evidence 't003-build-result.json') -Encoding UTF8
}
if ($failure) { throw $failure }
