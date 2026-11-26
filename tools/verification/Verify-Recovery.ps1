$ErrorActionPreference='Stop'
$recoveryRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
& (Join-Path $PSScriptRoot 'Prepare-BackupTools.ps1')
if($LASTEXITCODE -ne 0){throw 'Backup client preparation failed'}
& (Join-Path $PSScriptRoot 'Verify-BillingRegression.ps1') -Cases 'BackupRecoveryIT,CloudBackupRecoveryDrill'
if($LASTEXITCODE -ne 0){throw 'Recovery drill failed'}
Copy-Item -LiteralPath (Join-Path $recoveryRoot 'tmp/billing-regression.log') -Destination (Join-Path $recoveryRoot 'docs/verification/recovery/recovery-tests.log')
