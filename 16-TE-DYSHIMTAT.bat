@echo off
chcp 65001 >nul
title KapitalX - Te Dyshimtat
color 0B
cd /d "%~dp0"

echo.
echo ============================================================
echo   FEATURE i ri: TE DYSHIMTAT
echo.
echo   - Rubrike ne sidebar "Te Dyshimtat" me ikone alert
echo   - Per cdo shpenzim/pagese qe Claude e dyshon:
echo     * Vlere e perseritur me nje shpenzim tjeter
echo     * Pershkrim i paqarte
echo     * Nuk eshte e qarte nese eshte per projekt apo te
echo       pergjithshme
echo   - Per cdo artikull ke 3 zgjedhje:
echo     1) Coj te Shpenzime te Pergjithshme (me kategori)
echo     2) Coj ne Shpenzim te Projektit Specifik
echo     3) Coj ne Pagese te Projektit (te ardhura)
echo   - Pas klasifikimit, hiqet automatikisht nga te dyshimtat
echo   - GJITHASHTU: Objektiv Mujor ne Dashboard
echo ============================================================
echo.

git add -A
git commit -m "Add: Te Dyshimtat (pending review) for ambiguous expenses/payments + monthly target"
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
echo  Pas rebuild:
echo   - Sidebar shfaq "Te Dyshimtat" me triangle te verdhe
echo   - Dashboard ka seksionin "Objektivi Mujor"
echo.
echo  Pasi Claude te lexoje email-in tend, do shtoje atje
echo  cdo gje te paqarte ne te dyshimtat - ti kliko Klasifiko
echo  per ta caktuar saktesisht.
echo ============================================================
pause
