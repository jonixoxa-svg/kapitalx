@echo off
chcp 65001 >nul
title KapitalX - Pastro te dhenat fiktive
color 0E
cd /d "%~dp0"

echo.
echo ============================================================
echo   FSHIRJA E TE DHENAVE FIKTIVE
echo   Do te fshihen: Projekte, Shpenzime, Punetore, Pajisje,
echo                  Evidence, Pagesa, Fazat, Dokumente, etj.
echo   Do te ruhen:   Llogarite e perdoruesve (login)
echo ============================================================
echo.

set /p CONFIRM=A je i sigurt? Shkruaj PO dhe shtyp Enter:

if /i not "%CONFIRM%"=="PO" (
    echo.
    echo Veprimi u anulua.
    pause
    exit /b 0
)

echo.
echo Po fshihen te dhenat...
echo.

call npx tsx prisma/clean-data.ts
if errorlevel 1 (
    color 0C
    echo.
    echo GABIM gjate fshirjes.
    echo Sigurohu qe serveri dev eshte i mbyllur dhe provo perseri.
    pause
    exit /b 1
)

color 0A
echo.
echo ============================================================
echo  GATI! Databaza eshte e paster.
echo  Tani mund te hapesh aplikacionin me 3-HAPE.bat dhe te
echo  fusesh te dhenat e tua reale.
echo ============================================================
echo.
pause
