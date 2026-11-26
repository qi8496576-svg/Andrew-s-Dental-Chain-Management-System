param([switch]$Generate, [string]$NodeDirectory = '')
$ErrorActionPreference = 'Stop'
$repository = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
if (-not $NodeDirectory) { $NodeDirectory = Join-Path $repository 'tmp/toolchains/node-v24.22.1-win-x64' }
$node = Join-Path $NodeDirectory 'node.exe'
$npm = Join-Path $NodeDirectory 'node_modules/npm/bin/npm-cli.js'
if (-not (Test-Path $node) -or -not (Test-Path $npm)) { throw "Node/npm toolchain missing: $NodeDirectory" }
$names = @('PATH', 'TEMP', 'TMP', 'NPM_CONFIG_CACHE', 'NPM_CONFIG_PREFIX', 'NPM_CONFIG_USERCONFIG')
$saved = @{}
foreach ($name in $names) { $saved[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
$steps = @()
$failure = $null
Push-Location (Join-Path $repository 'packages/contracts')
try {
    $env:PATH = "$NodeDirectory;$env:PATH"
    $env:TEMP = Join-Path $repository 'tmp/build-temp'
    $env:TMP = $env:TEMP
    $env:NPM_CONFIG_CACHE = Join-Path $repository 'tmp/npm-cache'
    $env:NPM_CONFIG_PREFIX = Join-Path $repository 'tmp/npm-global'
    $env:NPM_CONFIG_USERCONFIG = Join-Path $repository 'tmp/empty-npm-user.npmrc'
    $commands = @(@{ Name='ci'; Arguments=@('ci', '--no-fund') }, @{ Name='validate'; Arguments=@('run', 'validate') })
    if ($Generate) { $commands += @{ Name='generate'; Arguments=@('run', 'generate') } }
    $commands += @(
        @{ Name='drift'; Arguments=@('run', 'check:drift') },
        @{ Name='tests'; Arguments=@('test') },
        @{ Name='typecheck'; Arguments=@('run', 'typecheck') },
        @{ Name='build'; Arguments=@('run', 'build') }
    )
    foreach ($command in $commands) {
        $arguments = $command.Arguments
        & $node $npm @arguments 2>&1 | Tee-Object -FilePath (Join-Path $repository "docs/verification/t005-$($command.Name).log")
        $code = $LASTEXITCODE
        $steps += [ordered]@{ name=$command.Name; exit_code=$code; log="docs/verification/t005-$($command.Name).log" }
        if ($code -ne 0) { throw "T005 $($command.Name) failed with exit code $code" }
    }
} catch { $failure = $_.Exception.Message }
finally {
    Pop-Location
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $saved[$name], 'Process') }
    [ordered]@{
        checked_at=(Get-Date).ToString('o'); task='T005'; toolchain_passed=($null -eq $failure)
        steps=$steps; failure=$failure; consumer_validation_record='t005-consumers-result.json'
    } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $repository 'docs/verification/t005-build-result.json') -Encoding UTF8
}
if ($failure) { throw $failure }
