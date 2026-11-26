$ErrorActionPreference='Stop'
$recoveryRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$privateLog='D:/secrets/AndrewDental/CloudIntegration/RecoveryBackups/off-server-task.log'
Push-Location $recoveryRoot
try {
 & (Join-Path $recoveryRoot 'tmp/toolchains/node-v24.22.1-win-x64/node.exe') (Join-Path $recoveryRoot 'tools/deployment/sync-recovery-backups.mjs') *> $privateLog
 if($LASTEXITCODE -ne 0){throw 'Independent backup transfer failed; inspect controlled task log'}
 $status=Get-Content (Join-Path $recoveryRoot 'docs/verification/recovery/off-server-copy.json') -Raw | ConvertFrom-Json
 if($status.status -ne 'PASS' -or ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds()-$status.last_archive_epoch) -gt 900){throw 'Backup chain archive is missing or exceeds 15 minutes'}
} finally {Pop-Location}
