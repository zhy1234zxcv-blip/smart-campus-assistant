Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$root = $PSScriptRoot
$env:Path = "C:\Program Files\nodejs;C:\Users\jxgm\AppData\Local\Programs\Python\Python313;$env:Path"

# 防多开：检查端口是否已被占用
$portCheck = netstat -ano 2>$null | Select-String ":3000.*LISTENING"
if ($portCheck) {
    Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--app=http://localhost:3000"
    exit
}

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "cmd.exe"
$psi.WorkingDirectory = "$root"
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$psi.WindowStyle = 'Hidden'
$psi.Arguments = "/c `"$root\run-backend.bat`""
[System.Diagnostics.Process]::Start($psi) | Out-Null
$psi.Arguments = "/c `"$root\run-frontend.bat`""
[System.Diagnostics.Process]::Start($psi) | Out-Null

Start-Sleep -Seconds 5
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--app=http://localhost:3000"

$tray = New-Object System.Windows.Forms.NotifyIcon
$icoPath = "$root\icon.png"
if (Test-Path $icoPath) {
    $bmp = [System.Drawing.Bitmap]::FromFile($icoPath)
    $tray.Icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
} else { $tray.Icon = [System.Drawing.SystemIcons]::Application }
$tray.Text = "Campus Assistant"
$tray.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip
$menu.Items.Add("Open App").Add_Click({ Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--app=http://localhost:3000" })
$menu.Items.Add("-") | Out-Null
$menu.Items.Add("Quit").Add_Click({ taskkill /F /IM node.exe 2>$null; $tray.Visible=$false; $tray.Dispose(); [System.Windows.Forms.Application]::Exit() })
$tray.ContextMenuStrip = $menu
$tray.Add_Click({ if ($_.Button -eq [System.Windows.Forms.MouseButtons]::Left) { Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--app=http://localhost:3000" } })

$form = New-Object System.Windows.Forms.Form
$form.WindowState = 'Minimized'; $form.ShowInTaskbar = $false; $form.Opacity = 0
[System.Windows.Forms.Application]::Run($form)