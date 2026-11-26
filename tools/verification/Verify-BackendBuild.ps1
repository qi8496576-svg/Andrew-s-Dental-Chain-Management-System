[CmdletBinding()]
param(
    [string]$Repository,
    [ValidatePattern('^[a-z0-9-]+$')][string]$EvidencePrefix = 'backend-build'
)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$backend = Join-Path $projectRoot 'backend'
$evidence = Join-Path $projectRoot 'docs/verification'
if (-not $Repository) { $Repository = Join-Path $projectRoot 'tmp/maven-repository' }
$Repository = [IO.Path]::GetFullPath($Repository)
$previousMavenUserHome = $env:MAVEN_USER_HOME
$previousTemp = $env:TEMP
$previousTmp = $env:TMP
$localTemp = Join-Path $projectRoot 'tmp/build-temp'
New-Item -ItemType Directory -Path $localTemp -Force | Out-Null
$env:TEMP = $localTemp
$env:TMP = $localTemp
$env:MAVEN_USER_HOME = Join-Path $projectRoot 'tmp/maven-user-home'
$started = [DateTimeOffset]::Now.ToString('o')
$settings = Join-Path $backend '.mvn/settings.xml'
$arguments = @(
    '--batch-mode', '--no-transfer-progress', '--strict-checksums',
    '--settings', $settings, '--global-settings', $settings,
    "-Dmaven.repo.local=$Repository", '-Dstyle.color=never',
    "-Djava.io.tmpdir=$localTemp",
    'clean', 'verify',
    'org.apache.maven.plugins:maven-help-plugin:3.5.1:effective-pom',
    "-Doutput=$(Join-Path $evidence "$EvidencePrefix-effective-pom.xml")",
    'org.apache.maven.plugins:maven-dependency-plugin:3.8.1:tree',
    "-DoutputFile=$(Join-Path $evidence "$EvidencePrefix-dependency-tree.txt")"
)
$code = -1
Push-Location $backend
try {
    & '.\mvnw.cmd' @arguments 2>&1 | Tee-Object -FilePath (Join-Path $evidence "$EvidencePrefix-build.log")
    $code = $LASTEXITCODE
} finally {
    Pop-Location
    $env:MAVEN_USER_HOME = $previousMavenUserHome
    $env:TEMP = $previousTemp
    $env:TMP = $previousTmp
    $mysqlVerified = $false
    $mysqlReport = Join-Path $backend 'target/failsafe-reports/TEST-com.adc.infrastructure.MySqlEnvironmentIT.xml'
    if ($code -eq 0 -and (Test-Path $mysqlReport) -and
        (Get-Item $mysqlReport).LastWriteTimeUtc -ge ([DateTimeOffset]::Parse($started)).UtcDateTime) {
        [xml]$suite = Get-Content -LiteralPath $mysqlReport -Raw -Encoding UTF8
        $mysqlVerified = [int]$suite.testsuite.tests -gt 0 -and
            [int]$suite.testsuite.failures -eq 0 -and [int]$suite.testsuite.errors -eq 0 -and
            [int]$suite.testsuite.skipped -eq 0
    }
    [ordered]@{
        started_at = $started
        finished_at = [DateTimeOffset]::Now.ToString('o')
        exit_code = $code
        commands = $arguments
        real_database_tested = $mysqlVerified
        container_runtime_tested = $mysqlVerified
        production_ready = $false
    } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $evidence "$EvidencePrefix-build-result.json") -Encoding utf8
}
if ($code -ne 0) { throw "Backend verification failed ($code); see docs/verification/$EvidencePrefix-build.log" }
