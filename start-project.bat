@echo off
title RailSync AI - Fast Launcher
echo ===================================================
echo        Starting RailSync AI Project Fastly
echo ===================================================

:: 1. Check / Start PostgreSQL on port 5434
echo [1/3] Checking PostgreSQL service...
netstat -ano | findstr :5434 >nul
if %errorlevel% neq 0 (
    echo Starting PostgreSQL on port 5434 from pgdata...
    "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "%~dp0pgdata" -l "%~dp0pgdata\server.log" -o "-p 5434" start
    timeout /t 3 /nobreak >nul
) else (
    echo PostgreSQL is already running on port 5434.
)

:: 2. Start Backend
echo [2/3] Starting Backend server on port 4000...
start "RailSync AI - Backend (Port 4000)" cmd /k "cd /d %~dp0backend && npm run start:dev"

:: 3. Start Frontend
echo [3/3] Starting Frontend server on port 5173...
start "RailSync AI - Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

:: 4. Open Browser
timeout /t 4 /nobreak >nul
echo Opening RailSync AI in your default browser...
start http://localhost:5173

echo ===================================================
echo Project is launching! 
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:4000
echo ===================================================
