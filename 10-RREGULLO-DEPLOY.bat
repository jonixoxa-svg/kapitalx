@echo off
chcp 65001 >nul
title KapitalX - Rregullime + Evidenca 6 mujore
color 0E
cd /d "%~dp0"

echo.
echo ============================================================
echo   - Rregullim: ADMIN_SALARIES enum
echo   - Evidenca: 6-mujori i pare dhe i dyte
echo ============================================================
echo.

git add -A
git commit -m "Fix: restore ADMIN_SALARIES; add: half-year attendance views"
if errorlevel 1 echo  Nuk ka ndryshime

echo.
echo  Po ngarkohet...
git push
if errorlevel 1 (
    color 0C
    echo  GABIM. Provo perseri.
    pause
    exit /b 1
)

color 0A
echo.
echo ============================================================
echo  GATI! Render do ribindoje. Prit 5-10 min.
echo  Pas rebuild:
echo   - Pajisjet ne projekt = auto-shpenzim per projekt
echo   - Evidenca ka tani: 30 dite / Janar-Qershor / Korrik-Dhjetor
echo ============================================================
pause
