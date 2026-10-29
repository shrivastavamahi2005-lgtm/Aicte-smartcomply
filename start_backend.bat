@echo off
title AICTE SmartComply 360 - Backend Server (Port 8000)
echo ===================================================
echo Starting AICTE SmartComply 360 FastAPI Backend
echo ===================================================
cd /d "%~dp0\backend"
set "PATH=C:\Users\mahis\AppData\Local\Programs\Python\Python314;C:\Users\mahis\AppData\Local\Programs\Python\Python314\Scripts;%PATH%"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
