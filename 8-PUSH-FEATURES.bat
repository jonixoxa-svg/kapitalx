@echo off
chcp 65001 >nul
title KapitalX - Push features te reja
color 0E
cd /d "%~dp0"

echo.
echo ============================================================
echo   PUSH I FEATURES TE REJA NE GITHUB
echo   - Shpenzime me projekte + foto
echo   - Kalendar i editueshem (Java/Muaj/6-Muaj)
echo   - Prodhimi ne punetori
echo   - Stoku i depozites
echo   - Raporte 6-mujore
echo ============================================================
echo.

echo  --- git add ---
git add -A

echo.
echo  --- git commit ---
git commit -m "Add: expenses w/ projects+receipts, calendar, production, stock, 6-month reports"
if errorlevel 1 (
    echo  Nuk ka ndryshime per commit
)

echo.
echo  --- git push ---
echo  Po ngarkohet ne GitHub (Render do te ribindoje automatikisht)...
git push
if errorlevel 1 (
    color 0C
    echo.
    echo  GABIM gjate push-it.
    echo  Nese te kerkon login:
    echo    Username: jonixoxa-svg
    echo    Password: token-i ne kapitalx-lansimi-info.txt
    pause
    exit /b 1
)

color 0A
echo.
echo ============================================================
echo  GATI! Render do te ribindoje aplikacionin (5-10 min).
echo  Faqe te reja: /production /stock /reports
echo  Shko ne: https://kapitalx.onrender.com
echo ============================================================
echo.
pause
