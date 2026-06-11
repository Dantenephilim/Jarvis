Add-Type -AssemblyName System.Drawing
$imagePath = "C:\Users\Dante\OneDrive\Proyects\Jarvis\src\assets\stark_logo_white.png"
$outputPath = "C:\Users\Dante\OneDrive\Proyects\Jarvis\src\assets\stark_logo_cyan.png"

$bmp = New-Object System.Drawing.Bitmap($imagePath)
$cyan = [System.Drawing.Color]::FromArgb(255, 0, 243, 255)
$transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)

for ($y=0; $y -lt $bmp.Height; $y++) {
    for ($x=0; $x -lt $bmp.Width; $x++) {
        $p = $bmp.GetPixel($x, $y)
        $avg = ($p.R + $p.G + $p.B) / 3
        if ($avg -lt 150) {
            # Smooth edge blending could be done here, but hard threshold is fine for high-res
            $bmp.SetPixel($x, $y, $cyan)
        } else {
            $bmp.SetPixel($x, $y, $transparent)
        }
    }
}
$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "Image processed successfully."
