#Requires -RunAsAdministrator
[CmdletBinding()]
param([switch]$Install)
$ErrorActionPreference = 'Stop'
if (-not $Install) { throw 'Explicit -Install is required. This enables the Windows WSL prerequisite; it never restarts Windows.' }
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$evidence = Join-Path $root 'docs/verification'
$started = [DateTimeOffset]::Now.ToString('o')
$code = -1
Start-Transcript -LiteralPath (Join-Path $evidence 't002-wsl-install.log') -Force
try {
    & "$env:WINDIR\System32\wsl.exe" --install --no-distribution --web-download
    $code = $LASTEXITCODE
} finally {
    [ordered]@{
        started_at = $started
        finished_at = [DateTimeOffset]::Now.ToString('o')
        command = 'wsl.exe --install --no-distribution --web-download'
        exit_code = $code
        automatic_restart_requested = $false
        docker_runtime_verified = $false
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $evidence 't002-wsl-install-result.json') -Encoding utf8
    Stop-Transcript
}
exit $code
