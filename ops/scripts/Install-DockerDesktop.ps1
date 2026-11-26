#Requires -RunAsAdministrator
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
Start-Transcript -LiteralPath (Join-Path $root 'docs/verification/t002-docker-install.log') -Append
try {
$installer = Join-Path $root 'tmp/installers/DockerDesktopInstaller.exe'
$settings = Get-Content (Join-Path $root 'ops/config/local-storage.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$app = $settings.docker_installation_directory
$data = $settings.docker_wsl_data_root
foreach ($path in @($app, $data)) {
    if ([IO.Path]::GetPathRoot($path) -ne 'D:\') { throw 'Installation and data must reside on D:' }
}
$signature = Get-AuthenticodeSignature -LiteralPath $installer
if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Docker') {
    throw 'Invalid Docker installer signature'
}
$temp = Join-Path $root 'tmp/install-temp'
New-Item -ItemType Directory -Path $temp -Force | Out-Null
$env:TEMP = $temp
$env:TMP = $temp
$arguments = @('install', '--quiet', '--backend=wsl-2', '--no-windows-containers',
    "--installation-dir=$app", "--wsl-default-data-root=$data")
# No --accept-license: the user reviews the agreement at first launch.
$process = Start-Process -FilePath $installer -ArgumentList $arguments -WindowStyle Hidden -Wait -PassThru
[ordered]@{
    finished_at = [DateTimeOffset]::Now.ToString('o')
    exit_code = $process.ExitCode
    installation_directory = $app
    wsl_data_root = $data
    license_accepted_by_agent = $false
    engine_verified = $false
} | ConvertTo-Json | Set-Content (Join-Path $root 'docs/verification/t002-docker-install-result.json') -Encoding utf8
exit $process.ExitCode
} catch {
    $_ | Out-String | Write-Output
    throw
} finally {
    Stop-Transcript
}
