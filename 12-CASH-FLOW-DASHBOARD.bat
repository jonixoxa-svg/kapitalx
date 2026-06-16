@echo off
chcp 65001 >nul
title KapitalX - Dashboard me borgje + cash flow
color 0B
cd /d "%~dp0"

echo.
echo ============================================================
echo   Dashboard i ri:
echo   - Lista e borxheve nga klientet
echo   - Cash ne dore (editueshem)
echo   - Borxh banka (editueshem)
echo   - Likuiditeti neto
echo   - Fitimi i pritshem ne fund
echo   - Paralajmerime per cash flow
echo ============================================================
echo.

git add -A
git commit -m "Add: dashboard with debts list, cash on hand, bank overdraft, expected profit"
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
echo  Pastaj hape kapitalx.onrender.com -^> Dashboard
echo  do shihesh:
echo   - 4 kartela: Cash, Borxh Banka, Likuiditet, Fitim i Pritshem
echo   - Tabela e borxheve (cila projekt + sa)
echo   - Paralajmerim per cash flow
echo   - Sa muaj mund te operosh me cash-in qe ke
echo.
echo  Klik ikonen e editit ne kartelat e Cash dhe Bankes per
echo  te ndryshuar vlerat sa here te duash.
echo ============================================================
pause
