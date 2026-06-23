Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 防止多开：同名进程已存在则退出
$me = [System.Diagnostics.Process]::GetCurrentProcess()
$others = Get-Process -Name $me.ProcessName -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $me.Id -and $_.StartTime -gt (Get-Date).AddMinutes(-60) }
if ($others) {
    Write-Host "App already running"
    exit
}

# Hide the PowerShell console window
Add-Type -Name Window -Namespace Console -MemberDefinition '
[DllImport("kernel32.dll")]
public static extern IntPtr GetConsoleWindow();
[DllImport("user32.dll")]
public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
'
$consolePtr = [Console.Window]::GetConsoleWindow()
[Console.Window]::ShowWindow($consolePtr, 0)

$root = $PSScriptRoot
$env:Path = "C:\Program Files\nodejs;C:\Users\jxgm\AppData\Local\Programs\Python\Python313;$env:Path"

# Start services hidden
$null = Start-Process cmd -ArgumentList "/c `"`"$root\run-backend.bat`"`"" -WindowStyle Hidden -PassThru
$null = Start-Process cmd -ArgumentList "/c `"`"$root\run-frontend.bat`"`"" -WindowStyle Hidden -PassThru

Start-Sleep -Seconds 5

# Open Chrome app window
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--app=http://localhost:3000"

# Create a hidden form as application context (required for tray icon to work properly)
$form = New-Object System.Windows.Forms.Form
$form.WindowState = 'Minimized'
$form.ShowInTaskbar = $false
$form.Visible = $false

# Tray icon
$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon = [System.Drawing.Icon]::FromHandle(([System.Drawing.Bitmap]::FromFile("$root\icon.png")).GetHicon())
$tray.Text = "Campus Assistant - Running"
$tray.Visible = $true

# Context menu
$menu = New-Object System.Windows.Forms.ContextMenuStrip
$openItem = $menu.Items.Add("Open App")
$openItem.Add_Click({ 
    Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--app=http://localhost:3000"
})
$menu.Items.Add("-") | Out-Null
$quitItem = $menu.Items.Add("Quit")
$quitItem.Add_Click({
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    $tray.Visible = $false
    $tray.Dispose()
    $form.Close()
    [System.Windows.Forms.Application]::Exit()
})
$tray.ContextMenuStrip = $menu

# Double-click tray to reopen
$tray.Add_Click({
    if ($_.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--app=http://localhost:3000"
    }
})

# Run message loop
[System.Windows.Forms.Application]::Run($form)