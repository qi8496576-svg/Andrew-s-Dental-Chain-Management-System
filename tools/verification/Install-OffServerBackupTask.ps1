$ErrorActionPreference='Stop'
$recoveryRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$runner=Join-Path $recoveryRoot 'tools/verification/Run-OffServerBackup.ps1'
$taskName='ADC-Recovery-OffServer'
$current=Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if($current -and -not (@($current.Actions)[0].Arguments.Contains($runner))){throw 'Same task name belongs to a different command; preserved'}
$action=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "'+$runner+'"') -WorkingDirectory $recoveryRoot
$trigger=New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5)
$principal=New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Project backup to independent Windows host; requires this host online and user logged in; no pruning.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Write-Output 'Five-minute off-server task registered and started; requires Windows awake and current user logged in.'
