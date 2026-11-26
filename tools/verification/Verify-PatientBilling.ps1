[CmdletBinding()]
param([switch]$Full)
$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$env:MAVEN_USER_HOME=Join-Path $taskRoot 'tmp/maven-user-home'
$env:JAVA_HOME='D:/jdk-21'
$env:PATH="$env:JAVA_HOME/bin;D:/ADC-Dev/Docker/app/resources/bin;$env:PATH"
if($Full){& (Join-Path $PSScriptRoot 'Prepare-BackupTools.ps1');if($LASTEXITCODE -ne 0){throw 'Backup client preparation failed'}}
Push-Location (Join-Path $taskRoot 'backend')
try {
 $taskArgs=@('--batch-mode','--no-transfer-progress','--settings','.mvn/settings.xml','--global-settings','.mvn/settings.xml',"-Dmaven.repo.local=$taskRoot/tmp/maven-repository",'-Dstyle.color=never')
 if(-not $Full){$taskArgs+=@('-Dtest=MappingDefinitionTest','-Dsurefire.failIfNoSpecifiedTests=false','-Dit.test=PatientBillingIT,PatientRegistrationIT,AppointmentBookingIT,AppointmentTransitionsIT,AppointmentReschedulingIT,InvoicingIT,OrganizationResourcesIT,SchemaBaselineIT,FlywayHistoryIT')}
 $taskLog=Join-Path $taskRoot $(if($Full){'tmp/patient-billing-full-tests.log'}else{'tmp/patient-billing-tests.log'})
 & './mvnw.cmd' @taskArgs verify *> $taskLog
 $taskExit=$LASTEXITCODE
 Get-Content $taskLog -Tail 45
 if($taskExit -ne 0){throw "Patient billing verification failed ($taskExit)"}
} finally { Pop-Location }
