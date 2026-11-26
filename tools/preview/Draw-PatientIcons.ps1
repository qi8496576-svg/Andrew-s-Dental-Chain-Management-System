$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$output=Join-Path $PSScriptRoot '../../apps/patient-miniprogram/miniprogram/assets'
New-Item -ItemType Directory -Path $output -Force | Out-Null
foreach($kind in @('home','calendar','records','user','folder','link','clinic')) {
    foreach($active in @($false,$true)) {
        $bitmap=[System.Drawing.Bitmap]::new(96,96)
        $g=[System.Drawing.Graphics]::FromImage($bitmap)
        $g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $color=if($active){'#17778b'}else{'#83949d'}
        $pen=[System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($color),5)
        $pen.StartCap=[System.Drawing.Drawing2D.LineCap]::Round
        $pen.EndCap=[System.Drawing.Drawing2D.LineCap]::Round
        $pen.LineJoin=[System.Drawing.Drawing2D.LineJoin]::Round
        switch($kind) {
            'home' { $g.DrawLine($pen,16,43,48,16);$g.DrawLine($pen,48,16,80,43);$g.DrawLine($pen,25,40,25,78);$g.DrawLine($pen,25,78,71,78);$g.DrawLine($pen,71,78,71,40);$g.DrawRectangle($pen,40,53,16,25) }
            'calendar' { $g.DrawRectangle($pen,20,25,56,54);$g.DrawLine($pen,20,41,76,41);$g.DrawLine($pen,34,16,34,31);$g.DrawLine($pen,62,16,62,31);$g.DrawLine($pen,34,57,43,66);$g.DrawLine($pen,43,66,62,50) }
            'records' { $g.DrawRectangle($pen,25,17,48,64);$g.DrawLine($pen,37,35,61,35);$g.DrawLine($pen,37,49,61,49);$g.DrawLine($pen,37,63,51,63) }
            'user' { $g.DrawEllipse($pen,35,16,26,26);$g.DrawArc($pen,21,48,54,51,180,180);$g.DrawLine($pen,21,73,75,73) }
            'folder' { $g.DrawLine($pen,18,25,40,25);$g.DrawLine($pen,40,25,49,35);$g.DrawLine($pen,49,35,78,35);$g.DrawLine($pen,78,35,78,75);$g.DrawLine($pen,78,75,18,75);$g.DrawLine($pen,18,75,18,25);$g.DrawLine($pen,38,56,58,56);$g.DrawLine($pen,48,46,48,66) }
            'link' { $g.DrawArc($pen,17,17,42,42,120,300);$g.DrawArc($pen,37,37,42,42,300,300);$g.DrawLine($pen,36,60,60,36) }
            'clinic' { $g.DrawRectangle($pen,23,19,50,60);$g.DrawLine($pen,37,35,59,35);$g.DrawLine($pen,48,25,48,45);$g.DrawRectangle($pen,39,58,18,21) }
        }
        $suffix=if($active){'-active'}else{''}
        $bitmap.Save((Join-Path $output "$kind$suffix.png"),[System.Drawing.Imaging.ImageFormat]::Png)
        $pen.Dispose();$g.Dispose();$bitmap.Dispose()
    }
}
