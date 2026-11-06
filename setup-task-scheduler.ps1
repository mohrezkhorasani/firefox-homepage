# Setup Task Scheduler for Firefox Homepage & Windows Tools Backend Agent
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
$action1.Arguments = "`"D:\tools\firefox\firefox-homepage\AutoRunner.vbs`""
$action1.WorkingDirectory = "D:\tools\firefox\firefox-homepage"

$t1 = $rootFolder.RegisterTaskDefinition("FirefoxHomepageServer", $taskDef1, 6, "$env:USERDOMAIN\$env:USERNAME", $null, 3)
Write-Host " [OK] Registered: $($t1.Name)" -ForegroundColor Green

Write-Host "Registering WindowsToolsBackendAgent..." -ForegroundColor Cyan
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
$action2.Path = "D:\tools\firefox\firefox-homepage\win-agent\start-agent.bat"
$action2.WorkingDirectory = "D:\tools\firefox\firefox-homepage\win-agent"

$t2 = $rootFolder.RegisterTaskDefinition("WindowsToolsBackendAgent", $taskDef2, 6, "$env:USERDOMAIN\$env:USERNAME", $null, 3)
Write-Host " [OK] Registered: $($t2.Name)" -ForegroundColor Green

Write-Host "Starting tasks..." -ForegroundColor Cyan
Start-ScheduledTask -TaskName "FirefoxHomepageServer"
Start-ScheduledTask -TaskName "WindowsToolsBackendAgent"
Write-Host "All tasks registered and started successfully!" -ForegroundColor Green
