@echo off
chcp 65001 >nul
title KapitalX - Push ne GitHub
color 0E
cd /d "%~dp0"

echo.
echo ============================================================
echo   PUSH I KODIT NE GITHUB
echo   Repo: https://github.com/jonixoxa-svg/kapitalx
echo ============================================================
echo.
echo Per te vazhduar, te duhet GitHub token-i.
echo E ke ne file-in: C:\Users\KAPITAL X SHPK\Desktop\kapitalx-lansimi-info.txt
echo Hape ate file, dhe kopjo token-in qe fillon me "ghp_"
echo.
set /p GH_TOKEN=Ngjite token-in ketu dhe shtyp Enter:

if "%GH_TOKEN%"=="" (
    color 0C
    echo  GABIM: nuk shkrove token.
    pause
    exit /b 1
)

REM Pastro .git nese ekziston dhe esht prishur
if exist .git (
    echo.
    echo  Po fshij .git ekzistuese...
    rmdir /s /q .git
)

echo.
echo  --- git init ---
git init -b main
if errorlevel 1 (
    color 0C
    echo  GABIM: git nuk eshte instaluar ne Windows.
    echo  Instaloje nga: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo.
echo  --- git config ---
git config user.email "jonixoxa@gmail.com"
git config user.name "jonixoxa-svg"

echo.
echo  --- git add ---
git add -A

echo.
echo  --- git commit ---
git commit -m "Initial commit - KapitalX ERP"
if errorlevel 1 (
    color 0C
    echo  GABIM gjate commit-it
    pause
    exit /b 1
)

echo.
echo  --- git remote add ---
git remote add origin "https://jonixoxa-svg:%GH_TOKEN%@github.com/jonixoxa-svg/kapitalx.git"

echo.
echo  --- git push ---
echo  Po ngarkohet kodi ne GitHub (mund te zgjase 1-2 minuta)...
git push -u origin main
if errorlevel 1 (
    color 0C
    echo.
    echo  GABIM gjate push-it.
    pause
    exit /b 1
)

color 0A
echo.
echo ============================================================
echo  GATI! Kodi u ngarkua ne GitHub.
echo  Adresa: https://github.com/jonixoxa-svg/kapitalx
echo.
echo  Hapi tjeter: shko ne Render.com per ta vendosur online
echo ============================================================
echo.
pause
