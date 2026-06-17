@echo off
chcp 65001 >nul
title KapitalX - Bashkepuntoret (Nenkontraktoret)
color 0B
cd /d "%~dp0"

echo.
echo ============================================================
echo   FEATURE I MADH: BASHKEPUNTORET
echo.
echo   - Krijon profile per nenkontraktoret (elektriker,
echo     hidraulik, xhama, saldues te jashtem, etj.)
echo   - Cdo bashkepuntor mund te kete shume caktime
echo     ne projekte te ndryshme
echo   - Cdo caktim ka vleren e dakorduar (psh 3000 EUR)
echo   - Cdo pagese qe i ben:
echo       a) Mbahet ne llogari te bashkepuntorit (sa i ke borxh)
echo       b) Automatikisht behet shpenzim ne projekt
echo   - Sheh ne projekt: tab "Bashkepuntoret"
echo   - Sheh ne sidebar: "Bashkepuntoret" me ikone duar
echo   - Lista permbledh: borxhi total, caktime aktive,
echo     totali i paguar
echo.
echo   GJITHASHTU TE PERFSHIRA:
echo   - Dashboard cash flow (cash, borxh banka, fitim pritshem)
echo   - Pushim 14 dite/vit me dite pune EDITUESHME
echo   - Kompensim qe anulon mungesat
echo   - Kalendar me pushime shfaqur
echo ============================================================
echo.

git add -A
git commit -m "Add: Subcontractors system - profiles, project assignments, payments auto-become expenses"
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
echo  GATI! Render do te ribindoje. Prit 5-10 min.
echo.
echo  Pas rebuild, ne kapitalx.onrender.com:
echo.
echo   1. Sidebar: kliko "Bashkepuntoret"
echo   2. Shto bashkepuntor te ri (emer, specialitet, kontakt)
echo   3. Klik "Shiko Detajet" -^> Cakto ne projekt
echo   4. Klik "Pagese" -^> shto sa paguan
echo   5. Hap projektin -^> tab "Bashkepuntoret"
echo   6. Sheh shpenzimin u shtua automatikisht ne projekt!
echo ============================================================
pause
