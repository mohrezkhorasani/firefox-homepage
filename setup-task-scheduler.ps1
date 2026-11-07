# Setup Task Scheduler for Firefox Homepage & Windows Tools Backend Agent
$baseDir = $PSScriptRoot
$toolsDir = Split-Path $baseDir -Parent

$service = New-Object -ComObject("Schedule.Service")
$service.Connect()
$rootFolder = $service.GetFolder("\")

Write-Host "Registering FirefoxHomepageServer..." -ForegroundColor Cyan
$taskDef1 = $service.NewTask(0)
$taskDef1.RegistrationInfo.Description = "Firefox Homepage Dev Server (Port 23156)"
$taskDef1.Settings.Enabled = $true
$taskDef1.Settings.AllowDemandStart = $true
$taskDef1.Settings.StartWhenAvailable = $true
$taskDef1.Settings.DisallowStartIfOnBatteries = $false
$taskDef1.Settings.StopIfGoingOnBatteries = $false
$taskDef1.Settings.ExecutionTimeLimit = "PT0S"

$trigger1 = $taskDef1.Triggers.Create(9) # TASK_TRIGGER_LOGON
$trigger1.UserId = "$env:USERDOMAIN\$env:USERNAME"

$action1 = $taskDef1.Actions.Create(0) # TASK_ACTION_EXEC
$action1.Path = "wscript.exe"
$action1.Arguments = "`"$baseDir\AutoRunner.vbs`""
$action1.WorkingDirectory = "$baseDir"

$t1 = $rootFolder.RegisterTaskDefinition("FirefoxHomepageServer", $taskDef1, 6, "$env:USERDOMAIN\$env:USERNAME", $null, 3)
Write-Host " [OK] Registered: $($t1.Name)" -ForegroundColor Green

Write-Host "Registering WindowsToolsBackendAgent..." -ForegroundColor Cyan
$agentDir = Join-Path $toolsDir "win-agent"
$agentBat = Join-Path $agentDir "start-agent.bat"
if (-not (Test-Path $agentBat)) {
    $agentBat = Join-Path $baseDir "win-agent\start-agent.bat"
}

$taskDef2 = $service.NewTask(0)
$taskDef2.RegistrationInfo.Description = "Windows Tools Backend Agent for Firefox Homepage (Port 23157)"
$taskDef2.Settings.Enabled = $true
$taskDef2.Settings.AllowDemandStart = $true
$taskDef2.Settings.StartWhenAvailable = $true
$taskDef2.Settings.DisallowStartIfOnBatteries = $false
$taskDef2.Settings.StopIfGoingOnBatteries = $false
$taskDef2.Settings.ExecutionTimeLimit = "PT0S"

$trigger2 = $taskDef2.Triggers.Create(9)
$trigger2.UserId = "$env:USERDOMAIN\$env:USERNAME"

$action2 = $taskDef2.Actions.Create(0)
$action2.Path = "$agentBat"
$action2.WorkingDirectory = (Split-Path $agentBat -Parent)

$t2 = $rootFolder.RegisterTaskDefinition("WindowsToolsBackendAgent", $taskDef2, 6, "$env:USERDOMAIN\$env:USERNAME", $null, 3)
Write-Host " [OK] Registered: $($t2.Name)" -ForegroundColor Green

Write-Host "Starting tasks..." -ForegroundColor Cyan
Start-ScheduledTask -TaskName "FirefoxHomepageServer"
Start-ScheduledTask -TaskName "WindowsToolsBackendAgent"
Start-ScheduledTask -TaskName "Mohrez - Site IP Inspector Service" -ErrorAction SilentlyContinue
Start-ScheduledTask -TaskName "Mohrez - Windows Autofill Palette" -ErrorAction SilentlyContinue
Write-Host "All tasks registered and started successfully!" -ForegroundColor Green
