@echo off
chcp 65001 >nul
title KapitalX - Punet Shtese ne Projekte
color 0B
cd /d "%~dp0"

echo.
echo ============================================================
echo   FEATURE i ri: PUNET SHTESE NE PROJEKTE
echo.
echo   - Tab i ri "Punet Shtese" brenda cdo projekti
echo   - Per cdo pune shtese:
echo     * Titulli, pershkrimi, vlera, data
echo     * Kush e ka aprovuar (klienti)
echo     * Statusi: Aprovuar / Ne pritje / Refuzuar
echo.
echo   - Vlera totale e projektit rritte automatikisht:
echo     Kontrata origjinale + Punet shtese (aprovuar) = Total
echo.
echo   - Borxhi i klientit llogaritet me vleren e re
echo   - Dashboard tregon te ardhurat me extras
echo   - Tab "Pagesat" perdor vleren e re per progress
echo.
echo   - Punet ne pritje shfaqen veçmas (s'ndikojne ende)
echo   - Mund t'i aprovosh me 1 klik kur klienti konfirmon
echo ============================================================
echo.

git add -A
git commit -m "Add: Project extra works (change orders) - increase contract value, update payment progress"
if errorlevel 1 echo  Nuk ka ndryshime

echo.
echo  Po ngarkohet ne GitHub...
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
echo  GATI! Render po ribindon. Prit 5-10 min.
echo.
echo  Pas rebuild, hap nje projekt -^> tab "Punet Shtese"
echo  per te provuar.
echo ============================================================
pause
