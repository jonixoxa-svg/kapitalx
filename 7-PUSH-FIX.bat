@echo off
chcp 65001 >nul
title KapitalX - Push fix ne GitHub
color 0E
cd /d "%~dp0"

echo.
echo ============================================================
echo   PUSH I NDRYSHIMEVE NE GITHUB
echo   (Render do te ribindojë automatikisht)
echo ============================================================
echo.

echo  --- git add ---
git add -A

echo.
echo  --- git commit ---
git commit -m "Remove demo credentials box from login page"
if errorlevel 1 (
    echo  Nuk ka ndryshime per commit ose gabim
)

echo.
echo  --- git push ---
git push
if errorlevel 1 (
    color 0C
    echo  GABIM gjate push-it.
    echo  Nese te kerkon login:
    echo    Username: jonixoxa-svg
    echo    Password: yt token-i ghp_...
    pause
    exit /b 1
)

color 0A
echo.
echo ============================================================
echo  GATI! Ndryshimet u ngarkuan ne GitHub.
echo  Render do te fillon ndertimin e ri automatikisht.
echo  Prit 5-10 minuta dhe kontrollo dashboard.render.com
echo ============================================================
echo.
pause
