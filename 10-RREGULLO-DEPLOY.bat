@echo off
chcp 65001 >nul
title KapitalX - Rregullo deploy
color 0E
cd /d "%~dp0"

echo.
echo ============================================================
echo   RREGULLIM GABIMI: ADMIN_SALARIES enum
echo ============================================================
echo.

git add -A
git commit -m "Fix: restore ADMIN_SALARIES enum value"
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
echo ============================================================
pause
