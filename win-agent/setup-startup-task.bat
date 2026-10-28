@echo off
title Install Windows Agent Startup Task
setlocal EnableDelayedExpansion

:: Current script directory
set "AGENT_DIR=%~dp0"
:: Strip trailing backslash if present
if "%AGENT_DIR:~-1%"=="\" set "AGENT_DIR=%AGENT_DIR:~0,-1%"

set "BAT_PATH=%AGENT_DIR%\start-agent.bat"

echo ========================================================
echo   Windows Tools Backend Agent - Setup Auto-Start Task
echo ========================================================
echo Target script: "%BAT_PATH%"
echo.

if not exist "%BAT_PATH%" (
    echo [ERROR] start-agent.bat not found in %AGENT_DIR%!
    pause
    exit /b 1
)

echo Registering scheduled task 'WindowsToolsBackendAgent'...
schtasks /Create /TN "WindowsToolsBackendAgent" /TR "\"%BAT_PATH%\"" /SC ONLOGON /F /RL HIGHEST

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Task created successfully!
    echo Starting agent now...
    schtasks /Run /TN "WindowsToolsBackendAgent"
    echo [OK] Done!
) else (
    echo.
    echo [FAIL] Could not register scheduled task. Please run this .bat as Administrator.
)

echo.
pause
