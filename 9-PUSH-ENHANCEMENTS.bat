@echo off
chcp 65001 >nul
title KapitalX - Push enhancements
color 0E
cd /d "%~dp0"

echo.
echo ============================================================
echo   PUSH ENHANCEMENTS NE GITHUB
echo   - Pajisjet ne projekt = auto-shpenzim
echo   - Metoda pagese (Cash/Bank/Check/Other)
echo   - Hyrje e shpejte per Valdet/Tahir
echo ============================================================
echo.

git add -A
git commit -m "Add: equipment auto-expense, payment method, quick expense submitter"
if errorlevel 1 echo  Nuk ka ndryshime per commit

echo.
echo  Po ngarkohet ne GitHub...
git push
if errorlevel 1 (
    color 0C
    echo  GABIM gjate push-it. Provo perseri ose verifiko token-in.
    pause
    exit /b 1
)

color 0A
echo.
echo ============================================================
echo  GATI! Render do te ribindoje ne 5-10 min.
echo  Faqe e re: /quick-expense per Valdet & Tahir
echo ============================================================
pause
