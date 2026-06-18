@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0"
title PhoneShop

cls
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\show-banner.ps1"

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. https://nodejs.org
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found. Reinstall Node.js.
    pause
    exit /b 1
)

if not exist "package.json" (
    echo [ERROR] package.json not found.
    pause
    exit /b 1
)

call npm install >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

netstat -ano | findstr ":5173.*LISTENING" >nul 2>&1
if not errorlevel 1 goto ServerReady

set START_QUIET=1
start /B /D "%~dp0" cmd /c "set START_QUIET=1&& npm run dev:all >nul 2>&1"

call :WaitForPort5173
if errorlevel 1 timeout /t 3 /nobreak >nul

:ServerReady
start "" "http://localhost:5173"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\show-online.ps1"
pause
exit /b 0

:WaitForPort5173
powershell -NoProfile -Command "$ok=$false; for($i=0; $i -lt 45; $i++) { try { $t=New-Object Net.Sockets.TcpClient; $t.Connect('127.0.0.1',5173); $t.Close(); $ok=$true; break } catch { Start-Sleep -Seconds 1 } }; if(-not $ok){ exit 1 } else { exit 0 }"
exit /b %ERRORLEVEL%
