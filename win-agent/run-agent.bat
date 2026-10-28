@echo off
title Windows Tools Backend Agent (Console)
cd /d "%~dp0"
echo ========================================================
echo    Windows Tools Backend Agent - Starting on port 23157
echo ========================================================
python agent.py
pause
