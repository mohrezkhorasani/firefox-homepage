@echo off
title Windows Tools Backend Agent
cd /d "%~dp0"

:: Check if pythonw is available in PATH, otherwise fallback to python
where pythonw >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start "" pythonw "%~dp0agent.py"
) else (
    where python >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        start /b "" python "%~dp0agent.py"
    ) else (
        :: Try default AppData location if PATH not set
        if exist "%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe" (
            start "" "%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe" "%~dp0agent.py"
        ) else (
            echo Python not found!
            pause
        )
    )
)
exit /b 0
