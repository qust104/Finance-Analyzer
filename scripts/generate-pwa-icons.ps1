# Generates the PWA icon set (PNG) into public/. Idempotent, run with:
# powershell -ExecutionPolicy Bypass -File scripts/generate-pwa-icons.ps1
Add-Type -AssemblyName System.Drawing

$accent = [System.Drawing.ColorTranslator]::FromHtml('#4c5fd5')
$white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)

# Lightning bolt polygon, derived from the favicon (lucide "zap") scaled
# to a 512x512 viewport.
$bolt512 = @(
    (277, 43), (64, 299), (256, 299), (235, 469), (448, 213), (256, 213)
)

function New-Icon {
    param(
        [int]$Size,
        [string]$Path,
        [double]$ContentScale = 1.0
    )
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear($accent)

    $scale = $Size / 512.0
    $center = $Size / 2.0
    $points = foreach ($point in $bolt512) {
        $x = $center + ($point[0] - 256) * $scale * $ContentScale
        $y = $center + ($point[1] - 256) * $scale * $ContentScale
        New-Object System.Drawing.PointF($x, $y)
    }
    $brush = New-Object System.Drawing.SolidBrush($white)
    $graphics.FillPolygon($brush, $points)

    $graphics.Dispose()
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
}

New-Icon -Size 512 -Path 'public/pwa-512.png' -ContentScale 1.0
New-Icon -Size 192 -Path 'public/pwa-192.png' -ContentScale 1.0
New-Icon -Size 180 -Path 'public/apple-touch-icon.png' -ContentScale 1.0
# Maskable icons must keep the logo inside the central 80% safe zone.
New-Icon -Size 512 -Path 'public/pwa-512-maskable.png' -ContentScale 0.7

Write-Output 'PWA icons generated'
