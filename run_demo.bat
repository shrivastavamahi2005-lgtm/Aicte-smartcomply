@echo off
title AICTE SmartComply AI - SIH Master Launcher
echo ================================================================
echo AICTE SmartComply AI: Approval Automation & Compliance System
echo Smart India Hackathon Prototype Launcher
echo ================================================================
echo.
echo 1. Launching Backend on http://127.0.0.1:8000 ...
start "SmartComply AI Backend" cmd /k "call "%~dp0start_backend.bat""

echo 2. Launching Frontend on http://127.0.0.1:5173 ...
start "SmartComply AI Frontend" cmd /k "call "%~dp0start_frontend.bat""

echo.
echo Both servers initiated!
echo Visit: http://127.0.0.1:5173
echo API Docs: http://127.0.0.1:8000/api/v1/docs
echo.
pause
