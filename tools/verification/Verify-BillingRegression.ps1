param([ValidatePattern('^[A-Za-z0-9,]+$')][string]$Cases='ApiAuthorizationMatrixIT,AuthenticationBrowserIT,MigrationContainerIT,SchemaBaselineIT,PatientBillingIT,PatientBillingHttpIT,InvoicingIT')
$ErrorActionPreference='Stop'
$billingRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$env:MAVEN_USER_HOME=Join-Path $billingRoot 'tmp/maven-user-home'
$env:JAVA_HOME='D:/jdk-21'
$env:PATH="$env:JAVA_HOME/bin;D:/ADC-Dev/Docker/app/resources/bin;$env:PATH"
Push-Location (Join-Path $billingRoot 'backend')
try {
 & './mvnw.cmd' --batch-mode --no-transfer-progress --settings .mvn/settings.xml --global-settings .mvn/settings.xml "-Dmaven.repo.local=$billingRoot/tmp/maven-repository" '-Dstyle.color=never' '-Dtest=MappingDefinitionTest' "-Dit.test=$Cases" verify *> (Join-Path $billingRoot 'tmp/billing-regression.log')
 $billingExit=$LASTEXITCODE
 Get-Content (Join-Path $billingRoot 'tmp/billing-regression.log') -Tail 35
 if($billingExit -ne 0){throw "Billing regression failed ($billingExit)"}
} finally {Pop-Location}
