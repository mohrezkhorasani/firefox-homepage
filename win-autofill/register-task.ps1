$taskName = "Mohrez - Windows Autofill Palette"

# Unregister old task if exists
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonw = (Get-Command pythonw -ErrorAction SilentlyContinue).Source
if (-not $pythonw) {
    $pythonw = "$env:LOCALAPPDATA\Programs\Python\Python311\pythonw.exe"
}
$scriptPath = Join-Path $dir "autofill_palette.py"

if (Test-Path $pythonw) {
    # Run pythonw directly for completely invisible background execution
    $action = New-ScheduledTaskAction -Execute $pythonw -Argument "`"$scriptPath`"" -WorkingDirectory $dir
} else {
    $batPath = Join-Path $dir "start-autofill.bat"
    $action = New-ScheduledTaskAction -Execute $batPath -WorkingDirectory $dir
}

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
Write-Host "Task '$taskName' started in background."
