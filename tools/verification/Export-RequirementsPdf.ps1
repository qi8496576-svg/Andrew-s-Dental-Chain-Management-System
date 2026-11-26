param([string]$InputPath,[string]$PdfPath)
$ErrorActionPreference='Stop'
$app=$null
$doc=$null
$ownApp=$false
try {
  $app=New-Object -ComObject kwps.Application
  $ownApp=($app.Documents.Count -eq 0)
  $app.DisplayAlerts=0
  try { $app.AutomationSecurity=3 } catch {}
  $doc=$app.Documents.Open($InputPath,$false,$false)
  $doc.Repaginate()
  foreach($toc in $doc.TablesOfContents) { $toc.Update() }
  $doc.Fields.Update() | Out-Null
  $doc.Repaginate()
  $doc.Save()
  $doc.ExportAsFixedFormat($PdfPath,17)
  Write-Output ('Exported pages: '+$doc.ComputeStatistics(2))
} finally {
  if($doc) { $doc.Close(0) }
  if($app -and $ownApp) { $app.Quit() }
}
