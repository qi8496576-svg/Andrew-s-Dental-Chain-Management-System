[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidatePattern('^[a-z0-9/_-]+$')][string]$Repository,
    [Parameter(Mandatory)][ValidatePattern('^[a-zA-Z0-9_.-]+$')][string]$Tag,
    [Parameter(Mandatory)][string]$Output
)
$ErrorActionPreference = 'Stop'
function Read-JsonBody($Response) {
    if ($Response.Content -is [byte[]]) { return [Text.Encoding]::UTF8.GetString($Response.Content) | ConvertFrom-Json }
    return $Response.Content | ConvertFrom-Json
}
$token = (Invoke-RestMethod -Uri "https://auth.docker.io/token?service=registry.docker.io&scope=repository:${Repository}:pull" -TimeoutSec 30).token
$headers = @{Authorization="Bearer $token";Accept='application/vnd.oci.image.index.v1+json,application/vnd.docker.distribution.manifest.list.v2+json,application/vnd.oci.image.manifest.v1+json'}
$base = "https://registry-1.docker.io/v2/$Repository"
$response = Invoke-WebRequest -Uri "$base/manifests/$Tag" -Headers $headers -TimeoutSec 30
$index = Read-JsonBody $response
$platform = $index.manifests | Where-Object { $_.platform.os -eq 'linux' -and $_.platform.architecture -eq 'amd64' } | Select-Object -First 1
if ($platform.digest -notmatch '^sha256:[a-f0-9]{64}$') { throw 'No unambiguous Linux amd64 digest in official manifest' }
$manifestResponse = Invoke-WebRequest -Uri "$base/manifests/$($platform.digest)" -Headers $headers -TimeoutSec 30
$manifest = Read-JsonBody $manifestResponse
$config = Read-JsonBody (Invoke-WebRequest -Uri "$base/blobs/$($manifest.config.digest)" -Headers $headers -TimeoutSec 30)
$metadata = [ordered]@{
    checked_at = [DateTimeOffset]::Now.ToString('o')
    repository = "docker.io/$Repository"
    tag = $Tag
    index_digest = ($response.Headers['Docker-Content-Digest'] -join '')
    linux_amd64_digest = $platform.digest
    config_digest = $manifest.config.digest
    version_environment = @($config.config.Env | Where-Object { $_ -match '^(MYSQL_MAJOR|MYSQL_VERSION|JAVA_VERSION)=' })
    runtime_executed = $false
}
$metadata | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $Output -Encoding utf8
$metadata | ConvertTo-Json -Depth 5
