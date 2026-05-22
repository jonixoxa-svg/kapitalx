@echo off
chcp 65001 >nul
title KapitalX - Vendos fjalekalimin e Postgres
color 0E
cd /d "%~dp0"
setlocal EnableDelayedExpansion

echo.
echo ============================================================
echo   Vendos fjalekalimin e PostgreSQL ne skedarin .env
echo ============================================================
echo.
echo  Shkruaj fjalekalimin qe vendose gjate instalimit te
echo  PostgreSQL-it (ai i perdoruesit "postgres") dhe shtyp Enter.
echo.
echo  (Fjalekalimi do te shfaqet ne ekran ndersa shkruan - eshte normale)
echo.

set /p PG_PASS=Fjalekalimi:

if "!PG_PASS!"=="" (
    color 0C
    echo.
    echo  Nuk shkruajte asgje. Provo perseri.
    pause
    exit /b 1
)

REM Write a fresh .env with the password
(
echo DATABASE_URL="postgresql://postgres:!PG_PASS!@localhost:5432/kapitalx"
echo AUTH_SECRET="kapitalx-super-secret-key-2024-change-in-production"
echo NEXTAUTH_URL="http://localhost:3000"
echo UPLOAD_DIR="./public/uploads"
) > .env

color 0A
echo.
echo ============================================================
echo   GATI! Fjalekalimi u ruajt ne .env
echo.
echo   Hapi tjeter: kliko mbi  1-INSTALO.bat
echo ============================================================
echo.
pause
