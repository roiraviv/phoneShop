@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0"
title PhoneStore Pro

echo.
echo ============================================
echo   PhoneStore Pro
echo ============================================
echo.

echo [1/3] Checking Node.js and npm...

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Node.js is not installed.
    echo         Download from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] npm not found. Reinstall Node.js.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
for /f "tokens=*" %%v in ('npm -v')  do set NPM_VER=%%v
echo        Node.js %NODE_VER%  ^|  npm %NPM_VER%
echo        [OK] Node.js and npm installed
echo.

echo [2/3] Checking dependencies...

if not exist "package.json" (
    echo [ERROR] package.json not found. Run from project folder.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo        Installing packages...
    call npm install
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo        [OK] Packages installed
) else (
    echo        [OK] Syncing dependencies...
    call npm install
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo        Checking for updates...
call npm outdated >nul 2>&1
if %ERRORLEVEL% equ 1 (
    echo        Updates found - updating...
    call npm update
    call npm install
    if !ERRORLEVEL! neq 0 (
        echo        [WARN] Some updates failed - continuing...
    ) else (
        echo        [OK] Packages updated
    )
) else (
    echo        [OK] No updates required
)
echo.

echo [3/3] Starting the app...

netstat -ano | findstr ":5173.*LISTENING" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo        [OK] Server already running on port 5173
    goto OpenBrowser
)

echo        Starting server in a new window...
start "PhoneStore Server" cmd /k cd /d "%~dp0" ^&^& npm run dev:all

echo        Waiting for server...
call :WaitForPort5173
set WAIT_RC=!ERRORLEVEL!
if !WAIT_RC! neq 0 (
    echo        [WARN] Server still starting - opening browser anyway...
    ping 127.0.0.1 -n 4 >nul
) else (
    echo        [OK] Server ready
)

:OpenBrowser
echo        Opening browser: http://localhost:5173
start "" "http://localhost:5173"

echo.
echo ============================================
echo   App started successfully!
echo   URL: http://localhost:5173
echo   To stop: close the PhoneStore Server window
echo ============================================
echo.
pause
exit /b 0

:WaitForPort5173
powershell -NoProfile -Command "$ok=$false; for($i=0; $i -lt 45; $i++) { try { $t=New-Object Net.Sockets.TcpClient; $t.Connect('127.0.0.1',5173); $t.Close(); $ok=$true; break } catch { Start-Sleep -Seconds 1 } }; if(-not $ok){ exit 1 } else { exit 0 }"
exit /b %ERRORLEVEL%