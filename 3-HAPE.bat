@echo off
chcp 65001 >nul
title KapitalX - Serveri
color 0A
cd /d "%~dp0"

echo.
echo ============================================================
echo   KapitalX po niset...
echo.
echo   Adresa:  http://localhost:3000
echo.
echo   Login:
echo      Email:        admin@kapitalx.com
echo      Fjalekalimi:  admin123
echo.
echo   Per ta ndaluar serverin: mbylle kete dritare ose Ctrl+C
echo ============================================================
echo.

start "" /B cmd /c "timeout /t 8 >nul && start http://localhost:3000"

npm run dev
pause
