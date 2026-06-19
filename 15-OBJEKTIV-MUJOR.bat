@echo off
chcp 65001 >nul
title KapitalX - Objektivi Mujor + Profit
color 0B
cd /d "%~dp0"

echo.
echo ============================================================
echo   OBJEKTIVI MUJOR ne Dashboard:
echo.
echo   - Shpenzime mesatare/muaj: 17,500 EUR (editueshme)
echo     ^(paga, qira, karburante, internet, etj.^)
echo.
echo   - Profit i synuar/muaj: 5,000 EUR (editueshme)
echo     ^(sa profit duam ne fund te muajit^)
echo.
echo   - Te ardhura te nevojshme/muaj
echo     ^(Shpenzime + Profit i synuar^)
echo.
echo   - Krahasimi me realitetin aktual:
echo     * Mes. 6 muajt e fundit te te ardhurave
echo     * Status ngjyre: jeshil/verdh/kuq
echo     * Mesazh detajuar nese po e arrijme synimin
echo.
echo ============================================================
echo.

git add -A
git commit -m "Add: monthly target with editable expenses and profit goals, actual vs target comparison"
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
echo  Ne Dashboard do shihesh seksionin e ri "Objektivi Mujor":
echo   - Kliko ikonen e editit ne Shpenzime mes./muaj per ndryshim
echo   - Kliko ikonen e editit ne Profit i synuar/muaj
echo   - Sheh sa duhet te sjellim cdo muaj
echo   - Krahasim me realitetin (mes. 6 muajt e fundit)
echo   - Status: po e arrini/pothuajse/nen synim
echo ============================================================
pause
