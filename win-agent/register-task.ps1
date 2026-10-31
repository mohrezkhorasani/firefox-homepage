$taskName = "Mohrez - Windows Tools Agent"
$oldTaskName = "WindowsToolsBackendAgent"

# Unregister old task if exists
Unregister-ScheduledTask -TaskName $oldTaskName -Confirm:$false -ErrorAction SilentlyContinue

$agentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$batPath = Join-Path $agentDir "start-agent.bat"

$action = New-ScheduledTaskAction -Execute $batPath -WorkingDirectory $agentDir
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartCount 5 `
    -RestartInterval ([TimeSpan]::FromMinutes(1)) `
    -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force
Write-Host "SUCCESS: Task '$taskName' registered successfully."

Start-ScheduledTask -TaskName $taskName
Write-Host "Task '$taskName' started."
