@echo off
chcp 65001 >nul
title KapitalX - Databaza
color 0E
cd /d "%~dp0"

echo.
echo ============================================================
echo   2-DATABAZA  -  Po pergatit databazen
echo ============================================================
echo.
echo  Cdo gabim do te ruhet ne skedarin: error.log
echo  Mos e mbyll kete dritare.
echo.
pause

REM Wipe any old log
del error.log 2>nul

echo.
echo  --- Hapi 1/3: prisma generate ---
echo.
call npx prisma generate 2>> error.log
if errorlevel 1 (
    color 0C
    echo.
    echo  GABIM gjate prisma generate. Detajet ne error.log
    type error.log
    echo.
    pause
    exit /b 1
)

echo.
echo  --- Hapi 2/3: prisma db push ---
echo.
call npx prisma db push 2>> error.log
if errorlevel 1 (
    color 0C
    echo.
    echo  GABIM gjate prisma db push.
    echo  Zakonisht do te thote qe:
    echo    - PostgreSQL sherbimi nuk eshte i ndezur, OSE
    echo    - Fjalekalimi ne .env eshte i gabuar, OSE
    echo    - Databaza "kapitalx" nuk ekziston
    echo.
    echo  Detajet:
    type error.log
    echo.
    pause
    exit /b 1
)

echo.
echo  --- Hapi 3/3: db seed (te dhena demo) ---
echo.
call npm run db:seed 2>> error.log
if errorlevel 1 (
    echo  Paralajmerim: seed deshtoi, por aplikacioni mund te funksionoje.
    type error.log
)

color 0A
echo.
echo ============================================================
echo   GATI! Databaza eshte instaluar dhe e mbushur.
echo.
echo   Hapi tjeter: kliko dy here mbi  3-HAPE.bat
echo ============================================================
echo.
pause
