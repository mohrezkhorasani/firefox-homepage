@echo off
title Setup Firefox Homepage Task Scheduler
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-task-scheduler.ps1"
echo.
pause
