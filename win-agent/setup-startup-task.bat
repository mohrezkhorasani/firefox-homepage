@echo off
title Install Mohrez Windows Tools Backend Agent Startup Task
cd /d "%~dp0"

echo ========================================================
echo   Mohrez - Windows Tools Agent Setup Auto-Start Task
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0register-task.ps1"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Task 'Mohrez - Windows Tools Agent' registered and running!
) else (
    echo.
    echo [FAIL] Could not register task with PowerShell. Trying fallback schtasks...
    schtasks /Create /TN "Mohrez - Windows Tools Agent" /TR "\"%~dp0start-agent.bat\"" /SC ONLOGON /F /RL HIGHEST
    schtasks /Run /TN "Mohrez - Windows Tools Agent"
)

echo.
pause
