@echo off
chcp 65001 >nul
title KapitalX - Mobile Responsive (PC ngelet i pandryshuar)
color 0B
cd /d "%~dp0"

echo.
echo ============================================================
echo   PESHTATJE PER TELEFON
echo   - Sidebar i fshehur ne mobile, hapet me hamburger menu
echo   - Top bar me logo + buton menu ne mobile
echo   - Tabelat: scroll horizontal kur s'mjafton hapesira
echo   - Kalendari: scroll horizontal ne mobile
echo   - Modal-et nuk dalin jashte ekranit
echo   - Input-et 16px qe te mos beje zoom iOS
echo   - PC view 100%% i pandryshuar - vetem mobile prek
echo ============================================================
echo.

git add -A
git commit -m "Mobile responsive: hamburger sidebar, scrollable tables, mobile-safe modals"
if errorlevel 1 echo  Nuk ka ndryshime per te komituar

echo.
echo  Po ngarkohet ne GitHub...
git push
if errorlevel 1 (
    color 0C
    echo.
    echo  GABIM ne push. Provo perseri ose kontrollo internetin.
    pause
    exit /b 1
)

color 0A
echo.
echo ============================================================
echo  GATI! Render do te ribindoje. Prit 5-10 minuta.
echo.
echo  Pas rebuild-it, hap ne telefon:
echo    https://kapitalx.onrender.com
echo.
echo  Cfare do shohish ne telefon:
echo   - Top bar me logo KapitalX + buton menu (hamburger)
echo   - Klik hamburger -^> hapet menu nga e majta
echo   - Klik prapa (sfond i erret) ose X -^> mbyllet menu
echo   - Klik nje rubrike te menus -^> hapet faqja dhe mbyllet menu
echo.
echo  Ne PC:
echo   - ASGJE NUK NDRYSHON. Sidebar ngelet ne te majte, gjithcka njejte.
echo ============================================================
pause
