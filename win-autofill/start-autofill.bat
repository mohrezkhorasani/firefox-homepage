@echo off
title Mohrez Windows Quick Autofill
cd /d "%~dp0"

:: Use pythonw for 100% invisible background runner
where pythonw >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start "" pythonw "%~dp0autofill_palette.py"
) else (
    where python >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        start /b "" python "%~dp0autofill_palette.py"
    ) else (
        echo Python not found!
        pause
    )
)
exit /b 0
