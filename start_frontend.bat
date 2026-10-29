@echo off
title AICTE SmartComply 360 - Frontend Server (Port 5173)
echo ===================================================
echo Starting AICTE SmartComply 360 Vite Frontend
echo ===================================================
cd /d "%~dp0\frontend"
set "PATH=C:\Users\mahis\AppData\Local\Programs\nodejs\node-v20.18.0-win-x64;%PATH%"
npm run dev
pause
