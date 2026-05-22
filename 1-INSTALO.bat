@echo off
chcp 65001 >nul
title KapitalX - Instalimi i paketave (npm)
color 0E
cd /d "%~dp0"

echo.
echo ============================================================
echo   Hapi 1/3:  Po instaloj paketat npm
echo   (mund te zgjase 2-5 minuta - prit me durim)
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    color 0C
    echo  GABIM: Node.js nuk eshte instaluar ose nuk eshte ne PATH.
    echo.
    echo  Nese sapo e instalove: MBYLLE kete dritare, RINIS kompjuterin,
    echo  pastaj klikoje perseri kete skedar.
    echo.
    pause
    exit /b 1
)

echo  Node.js u gjet:
node --version
echo.

call npm install
if errorlevel 1 (
    color 0C
    echo.
    echo  GABIM gjate npm install. Lexo mesazhin me lart.
    pause
    exit /b 1
)

color 0A
echo.
echo ============================================================
echo   Paketat u instaluan me sukses!
echo.
echo   Hapi tjeter: kliko dy here mbi  2-DATABAZA.bat
echo   (pasi te kesh vendosur DATABASE_URL ne skedarin .env)
echo ============================================================
echo.
pause
