param(
    [string]$DestinationDirectory='D:/secrets/AndrewDental/Deployment',
    [string]$WechatAppIdFile='D:/secrets/AndrewDental/WeChat/appid.txt',
    [string]$WechatAppSecretFile='D:/secrets/AndrewDental/WeChat/appsecret.txt'
)
$ErrorActionPreference='Stop'
$destination=[IO.Path]::GetFullPath($DestinationDirectory)
if(-not $destination.StartsWith('D:\secrets\AndrewDental\',[StringComparison]::OrdinalIgnoreCase)){throw 'Use a dedicated D:\secrets\AndrewDental subdirectory'}
$appId=[IO.File]::ReadAllText($WechatAppIdFile).Trim().TrimStart([char]0xFEFF)
$appSecret=[IO.File]::ReadAllText($WechatAppSecretFile).Trim().TrimStart([char]0xFEFF)
if($appId -cnotmatch '^wx[0-9a-zA-Z]{16}$' -or $appSecret -cnotmatch '^[0-9a-fA-F]{32}$'){throw 'Expected nonempty local WeChat configuration files; no values printed'}
if(-not(Test-Path -LiteralPath $destination)){[void](New-Item -ItemType Directory -Path $destination)}
$acl=Get-Acl -LiteralPath $destination
$owner=[Security.Principal.WindowsIdentity]::GetCurrent().Name
$acl.SetAccessRuleProtection($true,$false)
foreach($entry in @($acl.Access)){[void]$acl.RemoveAccessRuleSpecific($entry)}
foreach($principal in @($owner,'NT AUTHORITY\SYSTEM','BUILTIN\Administrators')){$acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($principal,'FullControl','ContainerInherit,ObjectInherit','None','Allow')))}
Set-Acl -LiteralPath $destination -AclObject $acl
$backendDirectory=Join-Path $destination 'backend'
if(-not(Test-Path -LiteralPath $backendDirectory)){[void](New-Item -ItemType Directory -Path $backendDirectory)}
function Write-ExactOrNew([string]$Path,[string]$Value){
    if(Test-Path -LiteralPath $Path){if([IO.File]::ReadAllText($Path) -cne $Value){throw 'Existing controlled configuration differs; do not silently rotate or overwrite'}}
    else{[IO.File]::WriteAllText($Path,$Value,(New-Object Text.UTF8Encoding($false)))}
}
foreach($secretPath in @((Join-Path $destination 'mysql-root'),(Join-Path $destination 'migration'),(Join-Path $backendDirectory 'spring.datasource.password'),(Join-Path $backendDirectory 'adc.auth-secret'))){
    if(Test-Path -LiteralPath $secretPath){$value=[IO.File]::ReadAllText($secretPath);try{$bytes=[Convert]::FromBase64String($value)}catch{throw 'Existing generated credential is invalid; no values printed'};if($bytes.Length -lt 32){throw 'Existing generated credential is too short'}}
    else{$bytes=New-Object byte[] 32;[Security.Cryptography.RandomNumberGenerator]::Fill($bytes);Write-ExactOrNew $secretPath ([Convert]::ToBase64String($bytes))}
}
Write-ExactOrNew (Join-Path $backendDirectory 'adc.wechat.app-secret') $appSecret
Write-ExactOrNew (Join-Path $destination 'wechat-appid') $appId
[pscustomobject]@{directory=$destination;backend_secret_files_ready=$true;credentials_printed=$false;existing_credentials_rotated=$false;remote_upload_performed=$false}|ConvertTo-Json
