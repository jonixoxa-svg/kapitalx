@echo off
chcp 65001 >nul
title KapitalX - Rregullo paketat dhe hape
color 0E
cd /d "%~dp0"

echo.
echo ============================================================
echo   Po shtoj paketat qe mungojne dhe po e hap aplikacionin
echo ============================================================
echo.

call npm install
if errorlevel 1 (
    color 0C
    echo  GABIM gjate npm install
    pause
    exit /b 1
)

color 0A
echo.
echo  Paketat u shtuan. Po nis serverin...
echo.
echo  Adresa:  http://localhost:3000
echo  Login:   admin@kapitalx.com  /  admin123
echo.

start "" /B cmd /c "timeout /t 10 >nul && start http://localhost:3000"

npm run dev
pause
