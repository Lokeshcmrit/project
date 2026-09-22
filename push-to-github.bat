@echo off
title Push RailSync AI to GitHub
color 0b
echo ========================================================
echo   RailSync AI - Push to https://github.com/Lokeshcmrit/project.git
echo ========================================================
echo.
cd /d "%~dp0"

echo [1/3] Checking Git Status...
git status -s

echo.
echo [2/3] Setting remote origin to https://github.com/Lokeshcmrit/project.git ...
git remote set-url origin https://github.com/Lokeshcmrit/project.git

echo.
echo [3/3] Pushing to GitHub (Branch: main)...
echo If a GitHub login window opens, please sign in to complete authentication.
echo.
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! All code has been pushed to:
    echo   https://github.com/Lokeshcmrit/project
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   If prompted, please enter your GitHub Personal Access Token or
    echo   run: git push https://^<YOUR_TOKEN^>@github.com/Lokeshcmrit/project.git main
    echo ========================================================
)

echo.
pause
