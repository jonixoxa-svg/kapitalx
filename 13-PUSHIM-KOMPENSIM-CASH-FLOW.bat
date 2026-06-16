@echo off
chcp 65001 >nul
title KapitalX - Pushim editueshem + Kompensim + Cash Flow
color 0B
cd /d "%~dp0"

echo.
echo ============================================================
echo   Ndryshime te ardhshme:
echo.
echo   1. DASHBOARD i ri:
echo      - Cash ne dore (editueshem)
echo      - Borxh banka (editueshem)
echo      - Likuiditet neto
echo      - Fitim i pritshem ne fund
echo      - Lista e borxheve nga klientet
echo      - Paralajmerime per cash flow
echo.
echo   2. EVIDENCA me opcione te reja:
echo      - Pushim (14 dite/vit per puntor)
echo      - Kompensim (anulon mungesat)
echo      - Mungesa neto = Mungesa - Kompensim
echo      - Pamje sot e pushimeve aktive
echo      - "Dite Pune" EDITUESHME ne tabele (klik per te ndryshu)
echo        p.sh. 1-17 Gusht = 17 dite kalendarike por ndryshoje
echo        manualisht ne 10 sepse weekendet s'jane dite pune
echo.
echo   3. KALENDARI:
echo      - Pushimet shfaqen me ngjyre fuchsia
echo      - Sheh kush eshte ne pushim cdo dite
echo ============================================================
echo.

git add -A
git commit -m "Add: editable vacation work days, cash flow dashboard, makeup days, calendar integration"
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
echo  GATI! Render po ribindon. Prit 5-10 min.
echo.
echo  Pas rebuild:
echo   - Dashboard ka 4 kartelat e reja + tabela e borxheve
echo   - Evidenca: Pushim/Kompensim ne radhen e statuseve
echo   - Evidenca: "Shto Pushim" me fushe te editueshme per dite pune
echo   - Evidenca: Klik mbi numrin per ndryshim inline
echo   - Kalendari: pushimet me ngjyre fuchsia
echo ============================================================
pause
