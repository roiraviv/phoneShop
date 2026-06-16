@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

cd /d "%~dp0"
title PhoneStore Pro - הפעלה

echo.
echo ============================================
echo   PhoneStore Pro - חנות סלולר
echo ============================================
echo.

REM ── 1. בדיקת Node.js ו-npm ──────────────────────────────
echo [1/3] בודק התקנות...

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [שגיאה] Node.js לא מותקן במחשב.
    echo         הורד והתקן מ: https://nodejs.org
    echo.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [שגיאה] npm לא נמצא. התקן מחדש את Node.js.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
for /f "tokens=*" %%v in ('npm -v')  do set NPM_VER=%%v
echo        Node.js %NODE_VER%  ^|  npm %NPM_VER%
echo        [OK] Node.js ו-npm מותקנים
echo.

REM ── 2. התקנה ועדכון חבילות ─────────────────────────────
echo [2/3] בודק תלויות ועדכונים...

if not exist "package.json" (
    echo [שגיאה] package.json לא נמצא. הרץ את הקובץ מתיקיית הפרויקט.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo        מתקין חבילות בפעם הראשונה...
    call npm install
    if !ERRORLEVEL! neq 0 (
        echo [שגיאה] npm install נכשל.
        pause
        exit /b 1
    )
    echo        [OK] חבילות הותקנו
) else (
    echo        [OK] node_modules קיים - מסנכרן תלויות...
    call npm install
    if !ERRORLEVEL! neq 0 (
        echo [שגיאה] npm install נכשל.
        pause
        exit /b 1
    )
)

echo        בודק עדכונים זמינים...
call npm outdated >nul 2>&1
if %ERRORLEVEL% equ 1 (
    echo        נמצאו עדכונים - מעדכן חבילות...
    call npm update
    call npm install
    if !ERRORLEVEL! neq 0 (
        echo [אזהרה] עדכון חלק מהחבילות נכשל - ממשיך בהפעלה...
    ) else (
        echo        [OK] חבילות עודכנו
    )
) else (
    echo        [OK] אין עדכונים נדרשים
)
echo.

REM ── 3. הפעלת שרת ופתיחת דפדפן ──────────────────────────
echo [3/3] מפעיל את האתר...

netstat -ano | findstr ":5173.*LISTENING" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo        [OK] השרת כבר רץ על פורט 5173
) else (
    echo        מפעיל שרת + ממשק (חלון נפרד)...
    start "PhoneStore - Server" cmd /k "cd /d "%~dp0" && npm run dev:all"
    echo        ממתין לטעינת השרת...
    powershell -NoProfile -Command ^
        "$ok=$false; for($i=0; $i -lt 45; $i++) { try { $t=New-Object Net.Sockets.TcpClient; $t.Connect('127.0.0.1',5173); $t.Close(); $ok=$true; break } catch { Start-Sleep -Seconds 1 } }; if(-not $ok){ exit 1 }"
    if !ERRORLEVEL! neq 0 (
        echo        [אזהרה] השרת לוקח יותר זמן - פותח דפדפן בכל זאת...
        timeout /t 3 /nobreak >nul
    ) else (
        echo        [OK] השרת מוכן
    )
)

echo        פותח דפדפן: http://localhost:5173
start "" "http://localhost:5173"

echo.
echo ============================================
echo   האתר נפתח בהצלחה!
echo   כתובת: http://localhost:5173
echo   לעצירה: סגור את חלון "PhoneStore - Server"
echo ============================================
echo.
pause
