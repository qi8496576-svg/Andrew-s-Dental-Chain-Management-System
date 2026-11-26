[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$storage = Get-Content (Join-Path $root 'ops/config/local-storage.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$docker = Join-Path $storage.docker_installation_directory 'resources/bin/docker.exe'
if (-not (Test-Path $docker)) { throw 'Docker is not installed in the approved D: directory.' }
$disk = Get-ChildItem -LiteralPath $storage.docker_wsl_data_root -Recurse -File -Filter '*.vhdx' -ErrorAction Stop
if (-not $disk) { throw 'No Docker virtual disk found under the approved D: data directory; do not pull images yet.' }
$env:DOCKER_HOST = 'npipe:////./pipe/dockerDesktopLinuxEngine'
$env:DOCKER_CONFIG = Join-Path $root 'tmp/docker-config'
New-Item -ItemType Directory -Path $env:DOCKER_CONFIG -Force | Out-Null
$version = & $docker version --format '{{json .}}'
if ($LASTEXITCODE -ne 0) { throw 'Docker Server is not available.' }
$version = $version | ConvertFrom-Json
if ($version.Server.Os -ne 'linux') { throw 'A Linux Docker Server is required.' }
$composeVersion = & $docker compose version --short
if ($LASTEXITCODE -ne 0) { throw 'Compose is unavailable.' }
$secretDir = Join-Path $root '.secrets/dev'
New-Item -ItemType Directory -Path $secretDir -Force | Out-Null
$acl = Get-Acl $secretDir
$acl.SetAccessRuleProtection($true, $false)
$rule = [Security.AccessControl.FileSystemAccessRule]::new(
    [Security.Principal.WindowsIdentity]::GetCurrent().User,
    'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
$acl.SetAccessRule($rule)
Set-Acl -LiteralPath $secretDir -AclObject $acl
$secret = Join-Path $secretDir 'mysql-root-password'
if (-not (Test-Path $secret)) {
    $bytes = New-Object byte[] 32
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    [IO.File]::WriteAllText($secret, [Convert]::ToBase64String($bytes), [Text.UTF8Encoding]::new($false))
}
$env:ADC_DEV_MYSQL_ROOT_PASSWORD_FILE = $secret
$compose = Join-Path $root 'ops/compose/compose.dev.yaml'
& $docker compose -f $compose config --quiet
if ($LASTEXITCODE -ne 0) { throw 'Compose configuration is invalid.' }
& $docker compose -f $compose up -d --wait --wait-timeout 240 mysql
if ($LASTEXITCODE -ne 0) { throw 'Development MySQL did not become healthy.' }
$query = 'MYSQL_PWD="$(cat /run/secrets/mysql_root_password)" mysql -uroot -N -B -e "SELECT VERSION(),@@version_compile_os,@@lower_case_table_names,@@global.time_zone,@@session.time_zone,@@default_storage_engine"'
$mysql = & $docker compose -f $compose exec -T mysql sh -c $query
if ($LASTEXITCODE -ne 0) { throw 'MySQL settings verification failed.' }
$columns = $mysql.Trim() -split "`t"
if ($columns.Count -ne 6 -or $columns[0] -notlike '8.4.*' -or $columns[1] -notlike 'Linux*' -or
    $columns[2] -ne '0' -or $columns[3] -ne '+00:00' -or $columns[4] -ne '+00:00' -or $columns[5] -ne 'InnoDB') {
    throw 'MySQL configuration differs from the approved baseline.'
}
[ordered]@{
    checked_at = [DateTimeOffset]::Now.ToString('o')
    docker_server_version = $version.Server.Version
    docker_server_os = $version.Server.Os
    compose_version = $composeVersion
    data_disks = @($disk.FullName)
    mysql_settings = $columns
    testcontainers_verified = $false
} | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $root 'docs/verification/t002-local-containers.json') -Encoding utf8
Write-Output 'Docker/Compose/development MySQL passed; now execute MySqlEnvironmentIT via Maven.'
