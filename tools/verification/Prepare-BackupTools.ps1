$ErrorActionPreference='Stop'
$backupRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$backupCache=Join-Path $backupRoot 'tmp/backup-tools'
$docker='D:/ADC-Dev/Docker/app/resources/bin/docker.exe'
New-Item -ItemType Directory -Force -Path $backupCache | Out-Null
if(Test-Path (Join-Path $backupCache 'provenance.json')){
 $proof=Get-Content (Join-Path $backupCache 'provenance.json') -Raw | ConvertFrom-Json
 if((Get-FileHash (Join-Path $backupCache 'mysqlbinlog') -Algorithm SHA256).Hash.ToLower() -eq $proof.binary_sha256){Write-Output 'Verified cached MySQL 8.4 backup client';$global:LASTEXITCODE=0;return}
}
$script='set -euo pipefail; curl --silent --show-error --fail --location --connect-timeout 15 --max-time 180 -o /cache/client.rpm "https://repo.mysql.com/yum/mysql-8.4-community/el/9/x86_64/mysql-community-client-${MYSQL_VERSION}.x86_64.rpm"; curl --silent --show-error --fail --location --connect-timeout 15 --max-time 45 -o /cache/mysql-key.asc https://repo.mysql.com/RPM-GPG-KEY-mysql-2025; gpg --batch --show-keys --with-colons /cache/mysql-key.asc > /cache/key-fingerprint.txt; grep -F "BCA43417C3B485DD128EC6D4B7B3B788A8D3785C" /cache/key-fingerprint.txt; rpm --import /cache/mysql-key.asc; rpm --checksig /cache/client.rpm | tee /cache/rpm-signature.txt; grep -F "digests signatures OK" /cache/rpm-signature.txt; rpm2cpio /cache/client.rpm > /cache/client.cpio'
& $docker run --rm --mount "type=bind,source=$backupCache,target=/cache" --entrypoint /bin/bash 'mysql@sha256:72c368d898861f3b3a07af0e6d690400f44f048799ed46822783d9224cc2c86d' -c $script
if($LASTEXITCODE -ne 0){throw 'MySQL backup client signature verification failed'}
$env:PYTHONUTF8='1'
& 'C:/Users/LiuYang/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' (Join-Path $backupRoot 'tools/verification/extract-backup-client.py')
if($LASTEXITCODE -ne 0){throw 'Verified backup binary extraction failed'}
