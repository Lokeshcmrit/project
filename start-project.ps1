# RailSync AI - Fast PowerShell Launcher
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "       Starting RailSync AI Project Fastly         " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

# 1. Check / Start PostgreSQL on port 5434
Write-Host "[1/3] Checking PostgreSQL service on port 5434..." -ForegroundColor Yellow
$pgRunning = Get-NetTCPConnection -LocalPort 5434 -State Listen -ErrorAction SilentlyContinue

if (-not $pgRunning) {
    Write-Host "Starting PostgreSQL on port 5434..." -ForegroundColor Green
    & "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "$root\pgdata" -l "$root\pgdata\server.log" -o "-p 5434" start
    Start-Sleep -Seconds 3
} else {
    Write-Host "PostgreSQL is already active on port 5434." -ForegroundColor Green
}

# 2. Start Backend
Write-Host "[2/3] Starting Backend server on port 4000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run start:dev"

# 3. Start Frontend
Write-Host "[3/3] Starting Frontend server on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

# 4. Open Browser
Start-Sleep -Seconds 3
Write-Host "Opening http://localhost:5173 in default browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Project is running!" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend:  http://localhost:4000" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
