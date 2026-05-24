@echo off
chcp 65001 >nul
title KapitalX - Rregullime + Kalendar me shenime
color 0E
cd /d "%~dp0"

echo.
echo ============================================================
echo   - Rregullim: ADMIN_SALARIES enum
echo   - Evidenca: zgjedh muaj specifik (Janar..Dhjetor) + 6-mujore
echo   - Kalendari: kliko diten per zmadhim + shenime te editueshme
echo ============================================================
echo.

git add -A
git commit -m "Fix: enum; Add: half-year attendance, calendar day notes w/ zoom modal"
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
echo   - Kalendari: kliko cdo dite per modal te madh
echo                shkruaj cfardo shenimi, ruaj/fshi
echo   - Pajisjet ne projekt = auto-shpenzim
echo   - Evidenca: Mujore (zgjedh muajin) / Janar-Qer / Korrik-Dhj
echo ============================================================
pause
